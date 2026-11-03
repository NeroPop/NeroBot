// lib/sheets.js
//
// The one place that talks to Google Sheets. Every command that needs a spreadsheet uses this
// file, so the sign-in code is not repeated.
//
//   const { sheetIds, sheetTabs } = require('../config');
//   const { readRange, appendRow, updateRange } = require('../lib/sheets');
//
//   // Read cells. Returns a list of rows, and each row is a list of cells (text).
//   const rows = await readRange(sheetIds.cats, sheetTabs.cats, 'A2:B');
//
//   // Add one new row at the bottom of the tab.
//   await appendRow(sheetIds.cats, sheetTabs.cats, ['Nero', 'https://...'], 'A:B');
//
//   // Overwrite some cells.
//   await updateRange(sheetIds.reminders, sheetTabs.reminders, 'E5', [['TRUE']]);
//
// The sheet IDs are listed in config.js. Signing in needs two secret settings,
// which you put in the .env file (see the README):
//   GOOGLE_SERVICE_ACCOUNT_EMAIL   the "client_email" value from the Google JSON key file
//   GOOGLE_PRIVATE_KEY             the "private_key" value from the Google JSON key file
//
// Columns are read by POSITION (column A, column B and so on), not by heading, so the sheets
// do not need any particular headings in row 1.

const { createPrivateKey } = require('node:crypto'); // used to test that the private key is readable
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// The permission we ask Google for: read and edit spreadsheets, and nothing else.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Tidies up the private key so it works however it was pasted into the .env file.
//
// Google's key file writes the line breaks as the two characters \n. Depending on how
// the key was pasted, it may arrive with real line breaks, with \n, with doubled \\n,
// or with stray quote marks, commas or spaces around it. Instead of guessing which,
// this pulls out only the part between the BEGIN and END lines, throws away everything
// that is not allowed in a key, and rebuilds it in the exact shape Google's tools expect.
function normalizePrivateKey(rawKey) {
  // Find the part between the BEGIN and END lines.
  const found = String(rawKey).match(/-----BEGIN PRIVATE KEY-----([\s\S]*?)-----END PRIVATE KEY-----/);
  if (!found) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY does not look like a private key. It should contain ' +
        '"-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----".'
    );
  }

  // Inside, a key only ever contains letters, numbers, + / and =.
  // First remove every \n marker (one or more backslashes followed by n), then
  // remove anything else that does not belong (spaces, quotes, commas, real line breaks).
  const body = found[1].replace(/\\+n/g, '').replace(/[^A-Za-z0-9+/=]/g, '');

  // A whole key has a length that divides by 4 (and is about 1600 characters long).
  // If not, part of it went missing when it was copied. We say how long it is, but never
  // print the key itself.
  if (body.length === 0 || body.length % 4 !== 0) {
    throw new Error(
      `GOOGLE_PRIVATE_KEY looks cut off or damaged (its middle part is ${body.length} characters, ` +
        'and a whole key has about 1600). Copy it again from the Google JSON file.'
    );
  }

  // Rebuild it with a line break every 64 characters, which is the standard layout.
  return `-----BEGIN PRIVATE KEY-----\n${body.match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`;
}

// The robot account's sign-in. It is the same for every spreadsheet, so we make it once.
let auth = null;

function getAuth() {
  if (!auth) {
    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const rawKey = process.env.GOOGLE_PRIVATE_KEY;

    // Tell the user exactly which settings are missing.
    const missing = [];
    if (!email) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    if (!rawKey) missing.push('GOOGLE_PRIVATE_KEY');
    if (missing.length > 0) {
      throw new Error(`Google Sheets is not set up. Missing from the .env file: ${missing.join(', ')}`);
    }

    const key = normalizePrivateKey(rawKey);

    // Test the key right now, on this computer, before involving Google. If it cannot be
    // read, we say so clearly instead of showing a confusing "DECODER" error later.
    try {
      createPrivateKey(key);
    } catch (error) {
      throw new Error(
        'GOOGLE_PRIVATE_KEY has the right start and end but the middle part is damaged, so it ' +
          'cannot be read. Copy it again from the "private_key" line of the Google JSON file.'
      );
    }

    // JWT is the "robot account" sign-in: the service account's email plus its private key.
    auth = new JWT({ email: email.trim(), key, scopes: SCOPES });
  }

  return auth;
}

// The remembered connections, one per spreadsheet. Opening a spreadsheet is slow (about
// a second), so we only do it once per spreadsheet and keep the result.
//   key: the spreadsheet's ID    value: the connection (or the attempt to connect)
const connections = new Map();

// Opens a spreadsheet by its ID.
async function connect(spreadsheetId) {
  const doc = new GoogleSpreadsheet(spreadsheetId, getAuth());
  await doc.loadInfo(); // downloads the spreadsheet's title and list of tabs
  return doc;
}

// Returns the connected spreadsheet. If connecting fails, we forget the failure so
// the next call tries again (useful if the internet blipped or settings were fixed).
function getDoc(spreadsheetId) {
  if (!connections.has(spreadsheetId)) {
    const attempt = connect(spreadsheetId).catch((error) => {
      connections.delete(spreadsheetId);
      throw error;
    });
    connections.set(spreadsheetId, attempt);
  }

  return connections.get(spreadsheetId);
}

// Returns one tab of a spreadsheet, found by its name (the text on the tab at the bottom).
async function getSheet(spreadsheetId, tabName) {
  const doc = await getDoc(spreadsheetId);

  // If the tab is not in our remembered list, refresh the list once in case it was just created.
  if (!doc.sheetsByTitle[tabName]) await doc.loadInfo();

  const sheet = doc.sheetsByTitle[tabName];
  if (!sheet) {
    const found = Object.keys(doc.sheetsByTitle).join(', ');
    throw new Error(`The spreadsheet "${doc.title}" has no tab called "${tabName}". Tabs found: ${found}`);
  }

  return sheet;
}

// ---- Retrying ------------------------------------------------------------
// The internet sometimes blips for a moment (for example "ERR_STREAM_PREMATURE_CLOSE" while
// signing in to Google). Reading and overwriting cells are safe to do twice, so for those we
// try up to 3 times before giving up. Adding a new row is NOT retried, because if the first
// try had actually worked we would end up with the row twice.
const RETRY_TRIES = 3;
const RETRY_WAIT_MS = 1000;

async function withRetry(task) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await task();
    } catch (error) {
      if (attempt >= RETRY_TRIES) throw error;
      console.warn(`Google Sheets call failed (try ${attempt} of ${RETRY_TRIES}), trying again: ${error.message}`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_WAIT_MS));
    }
  }
}

// ---- Reading and writing cells -------------------------------------------

// Builds the "Tab!A2:B" style address Google wants. The tab name goes in single quotes so
// that tab names with spaces still work.
function address(tabName, range) {
  const quotedTab = `'${tabName.replace(/'/g, "''")}'`;
  return range ? `${quotedTab}!${range}` : quotedTab;
}

// The web address of one range of one spreadsheet.
function valuesUrl(spreadsheetId, tabName, range) {
  return (
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}` +
    `/values/${encodeURIComponent(address(tabName, range))}`
  );
}

// Reads cells. "range" is like 'A2:B' (columns A and B from row 2 downwards).
// Returns a list of rows, and each row is a list of cells. An empty range gives an empty list.
// Careful: Google leaves out empty cells at the END of a row, so a row can be shorter than
// you expect. Always treat row[1] as "might be missing".
//
// By default cells come back as the text you SEE in the sheet. For exact numbers (like the
// reminder times, which are very long) pass { valueRenderOption: 'UNFORMATTED_VALUE' } as the
// last argument, and numbers come back as real numbers.
async function readRange(spreadsheetId, tabName, range, options) {
  return withRetry(async () => {
    const sheet = await getSheet(spreadsheetId, tabName);
    return (await sheet.getCellsInRange(range, options)) ?? [];
  });
}

// Adds one new row below the existing data. "values" is a list like ['Nero', 'https://...'].
// "range" says which columns to look at to find the bottom of the data, like 'A:B'.
// The text is saved exactly as typed. It is never treated as a spreadsheet formula.
async function appendRow(spreadsheetId, tabName, values, range) {
  await getAuth().request({
    url: `${valuesUrl(spreadsheetId, tabName, range)}:append`,
    method: 'POST',
    params: { valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS' },
    data: { values: [values] },
  });
}

// Overwrites cells. "rows" is a list of rows, for example [['TRUE']] for one cell, or
// [['Nero', 'url'], ['Mia', 'url']] for a block starting at the top left of "range".
// The text is saved exactly as typed. It is never treated as a spreadsheet formula.
async function updateRange(spreadsheetId, tabName, range, rows) {
  await withRetry(() =>
    getAuth().request({
      url: valuesUrl(spreadsheetId, tabName, range),
      method: 'PUT',
      params: { valueInputOption: 'RAW' },
      data: { values: rows },
    })
  );
}

// Used when the bot starts, to prove a connection works. Returns the spreadsheet's title.
async function checkConnection(spreadsheetId) {
  const doc = await getDoc(spreadsheetId);
  return doc.title;
}

module.exports = { getSheet, readRange, appendRow, updateRange, checkConnection, normalizePrivateKey };
