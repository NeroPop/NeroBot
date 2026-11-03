// services/reminders.js
//
// The background job that sends reminders. It runs on its own while the bot is on.
//
// Reminders are saved in the reminders spreadsheet (config.js: sheetIds.reminders), one per row:
//     A: user ID    B: time to send (milliseconds)    C: message    D: channel ID    E: sent (TRUE/FALSE)
// If column D is empty, the reminder goes to the person's direct messages instead of a channel.
// Rows are written by /reminder and /reminderdm, and the sheet is the bot's memory, so a restart
// loses nothing.
//
// How it works:
//   - The bot keeps a copy of the sheet in memory and checks the clock against it every few
//     seconds (checkEverySeconds in config.js). That is much kinder to Google than reading the
//     sheet every time.
//   - The copy is re-read from the sheet every few minutes (refreshEveryMinutes), so edits made
//     by hand in the sheet are noticed.
//   - A reminder that is overdue (for example the bot was off) is still sent when the bot returns.
//   - If sending fails, it tries again a little later, and gives up after a few tries.
//   - Everything runs one job at a time (see lib/taskQueue.js), so jobs never trip over each other.
//
// Other files use this file like this:
//     const reminders = require('../services/reminders');
//     await reminders.addReminder({ userId, timeMs, message, channelId });
//     const waiting = await reminders.listFor(userId);

const { sheetIds, sheetTabs, reminders: settings } = require('../config');
const { readRange, appendRow, updateRange } = require('../lib/sheets');
const { createQueue } = require('../lib/taskQueue');

// Read the cells as exact values, so the long time numbers come back as real numbers.
const READ_OPTIONS = { valueRenderOption: 'UNFORMATTED_VALUE' };

const runExclusive = createQueue();

let discordClient = null; // set when the service starts
let reminders = []; // our copy of the sheet
let timers = []; // the repeating checks, so they can be stopped

// Reminders we have sent but could not yet tick as sent in the sheet. Without this, a
// failed save would make the bot send the same reminder again and again.
//   key: a text that identifies the reminder      value: the reminder
const unmarked = new Map();

// Reminders that failed to send, and how many times we have tried.
//   key: a text that identifies the reminder      value: { tries, nextTryMs }
const trouble = new Map();

// A piece of text that identifies one reminder (the same person, time and message).
function keyOf(reminder) {
  return `${reminder.userId}|${reminder.timeMs}|${reminder.message}`;
}

// Turns one spreadsheet row into a reminder. Returns null for rows we cannot use (like empty ones).
function readRow(row) {
  const [userId, time, message, channelId, sent] = row;
  const timeMs = Number(time);
  if (!userId || !Number.isFinite(timeMs) || timeMs <= 0) return null;

  return {
    userId: String(userId),
    timeMs,
    message: String(message ?? ''),
    channelId: channelId ? String(channelId) : '',
    sent: String(sent).toUpperCase() === 'TRUE',
  };
}

// Reads the whole sheet into our copy.
async function reload() {
  const rows = await readRange(sheetIds.reminders, sheetTabs.reminders, 'A2:E', READ_OPTIONS); // row 1 is the heading
  reminders = rows.map(readRow).filter(Boolean);

  // Keep anything we already sent but could not tick, so it is not sent twice.
  for (const reminder of reminders) {
    if (unmarked.has(keyOf(reminder))) reminder.sent = true;
  }
}

// Sends one reminder. Returns true if it arrived.
// It goes to the channel it was set in; if that fails (or there is no channel) it is sent as a DM.
async function deliver(reminder) {
  if (reminder.channelId) {
    try {
      const channel = await discordClient.channels.fetch(reminder.channelId);
      await channel.send({
        content: `<@${reminder.userId}> ⏰ Reminder: ${reminder.message}`,
        allowedMentions: { users: [reminder.userId] }, // only the person can be pinged, nobody else
      });
      return true;
    } catch (error) {
      console.error(`Reminders: could not send to channel ${reminder.channelId}: ${error.message}`);
    }
  }

  try {
    const user = await discordClient.users.fetch(reminder.userId);
    await user.send(`⏰ Reminder: ${reminder.message}`);
    return true;
  } catch (error) {
    console.error(`Reminders: could not DM user ${reminder.userId}: ${error.message}`);
    return false;
  }
}

// Ticks a reminder as sent in the sheet (column E becomes TRUE).
// We read the sheet again to find the right row, because rows may have moved since our copy was made.
async function markSent(reminder) {
  const key = keyOf(reminder);

  try {
    const rows = await readRange(sheetIds.reminders, sheetTabs.reminders, 'A2:E', READ_OPTIONS);
    const index = rows.findIndex((row) => {
      const found = readRow(row);
      return found && keyOf(found) === key && !found.sent;
    });

    if (index !== -1) {
      await updateRange(sheetIds.reminders, sheetTabs.reminders, `E${index + 2}`, [['TRUE']]); // +2: row 1 is the heading
    }
    unmarked.delete(key);
  } catch (error) {
    // Remember it, and try again on the next check.
    unmarked.set(key, reminder);
    console.error(`Reminders: could not tick a reminder as sent (will try again): ${error.message}`);
  }
}

// One check of the clock: send everything that is due.
async function checkClock() {
  const now = Date.now();

  for (const reminder of reminders) {
    if (reminder.sent || reminder.timeMs > now) continue;

    // Skip it if we are waiting before trying again.
    const key = keyOf(reminder);
    const problem = trouble.get(key);
    if (problem && problem.nextTryMs > now) continue;

    const delivered = await deliver(reminder);

    if (!delivered) {
      const tries = (problem?.tries ?? 0) + 1;
      if (tries < settings.giveUpAfterTries) {
        trouble.set(key, { tries, nextTryMs: now + settings.retryAfterMinutes * 60 * 1000 });
        console.warn(`Reminders: will try again in ${settings.retryAfterMinutes} minute(s) (try ${tries} of ${settings.giveUpAfterTries}).`);
        continue;
      }
      console.error(`Reminders: giving up on a reminder for user ${reminder.userId} after ${tries} tries.`);
    }

    trouble.delete(key);
    reminder.sent = true;
    await markSent(reminder);
  }

  // Try again to tick any that could not be saved earlier.
  for (const reminder of [...unmarked.values()]) {
    await markSent(reminder);
  }
}

// Runs a job in the queue and logs any problem instead of letting it crash the bot.
function safely(name, job) {
  return runExclusive(job).catch((error) => console.error(`Reminders: ${name} failed: ${error.message}`));
}

// ---- Used by the commands ------------------------------------------------

// Saves a new reminder.
//   userId      who to remind
//   timeMs      when, as a number of milliseconds (from Date.now())
//   message     what to say
//   channelId   the channel to post in, or '' to send a direct message instead
async function addReminder({ userId, timeMs, message, channelId }) {
  await appendRow(sheetIds.reminders, sheetTabs.reminders, [String(userId), timeMs, message, channelId || '', 'FALSE'], 'A:E');
  await runExclusive(reload); // read it back so our copy matches the sheet
}

// The reminders still waiting for one person, soonest first.
async function listFor(userId) {
  await runExclusive(reload);
  return reminders.filter((reminder) => !reminder.sent && reminder.userId === String(userId)).sort((a, b) => a.timeMs - b.timeMs);
}

// ---- Starting and stopping -----------------------------------------------

// Called by index.js when the bot is ready. Returns a short note for the console.
async function start(client) {
  discordClient = client;

  // Load the sheet now. If Google is unavailable we still start the timers, because the
  // next refresh may work.
  let note;
  try {
    await runExclusive(reload);
    note = `${reminders.filter((reminder) => !reminder.sent).length} waiting`;
  } catch (error) {
    console.warn(`Reminders: could not read the sheet yet (${error.message}). Will keep trying.`);
    note = 'the sheet could not be read yet';
  }

  stop(); // make sure we never run two sets of timers
  timers = [
    setInterval(() => safely('the clock check', checkClock), settings.checkEverySeconds * 1000),
    setInterval(() => safely('the sheet refresh', reload), settings.refreshEveryMinutes * 60 * 1000),
  ];

  // Send anything that became due while the bot was off, straight away.
  safely('the first clock check', checkClock);

  return note;
}

// Stops the repeating checks. (Used by tests.)
function stop() {
  for (const timer of timers) clearInterval(timer);
  timers = [];
}

module.exports = { start, stop, addReminder, listFor };
