const { google } = require('googleapis');

const sheetsAuth = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (function () {
    const raw = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'); // handle literal backslash-n paste style
    const BEGIN = '-----BEGIN PRIVATE KEY-----';
    const END = '-----END PRIVATE KEY-----';
    const start = raw.indexOf(BEGIN);
    const endIdx = raw.indexOf(END);
    if (start === -1 || endIdx === -1) return raw.trim() + '\n';
    // The panel's paste/env-injection pipeline was corrupting every line of the
    // base64 body with a stray extra character (space), which broke the OpenSSL
    // PEM decoder even though the BEGIN/END markers looked fine. Rebuild the PEM
    // from scratch: strip everything that isn't a valid base64 character from the
    // body, then re-wrap it cleanly at the standard 64 chars per line.
    const rawBody = raw.slice(start + BEGIN.length, endIdx);
    const cleanBody = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
    const wrapped = cleanBody.match(/.{1,64}/g).join('\n');
    return `${BEGIN}\n${wrapped}\n${END}\n`;
  })(),
};

const spreadsheetId = '1xQio_F4j1deCo1X9vxA_eOsEleGA0V6aJqj1J1edGuM'; // Replace with your Google Sheets ID


// Retries a callback-style Google API call a few times before giving up.
// Backstops transient network failures (e.g. ERR_STREAM_PREMATURE_CLOSE while
// fetching the OAuth token) so a single flaky request doesn't fail the command.
function withRetry(task, callback, retries = 3, delayMs = 1000) {
  task((err, response) => {
    if (err && retries > 0) {
      console.warn(`Google Sheets API call failed, retrying in ${delayMs}ms (${retries} attempt(s) left): ${err.message}`);
      setTimeout(() => withRetry(task, callback, retries - 1, delayMs), delayMs);
      return;
    }
    callback(err, response);
  });
}

exports.run = async (client, message, args) => {
  // Check if the user provided at least 3 arguments (Name, Amount, Reason)
  if (args.length < 3) {
    message.channel.send('Please provide all required arguments.\n\nUsage: `-addinvoice [Name] [Amount] [Reason]`');
    return;
  }

  // Extract the first argument as the name
  const name = args[0];

  // Extract the second argument as the amount
  const amount = parseFloat(args[1].replace(/[^-0-9.]/g, ''));

 // Remove non-numeric characters

  // Extract the remaining arguments as the reason
  const reason = args.slice(2).join(' ');

  // Format the date as "dd/mm/yyyy"
  const date = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Authenticate using your service account credentials
  const auth = new google.auth.JWT({
    email: sheetsAuth.client_email,
    key: sheetsAuth.private_key,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Initialize the Google Sheets API
  const sheets = google.sheets('v4');

  // Check if the "Name" exists in the "Totals" sheet
  withRetry(
    (cb) =>
      sheets.spreadsheets.values.get(
        {
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: 'Totals!A:A', // Check the entire "A" column for the name
        },
        cb
      ),
    (err, response) => {
      if (err) {
        console.error('The API returned an error:', err);
        message.channel.send('An error occurred while checking for the Name.');
        return;
      }

      const nameValues = response.data.values;
      const nameExists = nameValues.some((row) => row[0] === name);

      if (!nameExists) {
        // If the name doesn't exist, add it to the "Totals" sheet in the first empty row
        withRetry(
          (cb) =>
            sheets.spreadsheets.values.get(
              {
                auth: auth,
                spreadsheetId: spreadsheetId,
                range: 'Totals!A1:A',
              },
              cb
            ),
          (err, response) => {
            if (err) {
              console.error('The API returned an error:', err);
              message.channel.send('An error occurred while finding an empty row in the Totals sheet.');
              return;
            }

            const totalsValues = response.data.values;
            const emptyRowIndex = totalsValues ? totalsValues.length : 0;

            // Add the name to the first empty row in the Totals sheet
            withRetry(
              (cb) =>
                sheets.spreadsheets.values.update(
                  {
                    auth: auth,
                    spreadsheetId: spreadsheetId,
                    range: `Totals!A${emptyRowIndex + 1}`,
                    valueInputOption: 'RAW',
                    resource: {
                      values: [[name]],
                    },
                  },
                  cb
                ),
              (err, response) => {
                if (err) {
                  console.error('The API returned an error:', err);
                  message.channel.send('An error occurred while adding the Name.');
                  return;
                }

                message.channel.send('New name added successfully.');
              }
            );
          }
        );
      }

      // Find the first empty row in the "Invoice" sheet
      withRetry(
        (cb) =>
          sheets.spreadsheets.values.get(
            {
              auth: auth,
              spreadsheetId: spreadsheetId,
              range: 'Invoice!A:A',
            },
            cb
          ),
        (err, response) => {
          if (err) {
            console.error('The API returned an error:', err);
            message.channel.send('An error occurred while finding an empty row in the Invoice sheet.');
            return;
          }

          const invoiceValues = response.data.values;
          const emptyRowIndex = invoiceValues ? invoiceValues.length : 0;

          // Add the invoice data to the found empty row in the Invoice sheet
          withRetry(
            (cb) =>
              sheets.spreadsheets.values.update(
                {
                  auth: auth,
                  spreadsheetId: spreadsheetId,
                  range: `Invoice!A${emptyRowIndex + 1}:D${emptyRowIndex + 1}`,
                  valueInputOption: 'RAW',
                  resource: {
                    values: [[name, date, reason, amount]],
                  },
                },
                cb
              ),
            (err, response) => {
              if (err) {
                console.error('The API returned an error:', err);
                message.channel.send('An error occurred while adding the invoice to the spreadsheet.');
                return;
              }

              message.channel.send('Invoice added successfully.');
            }
          );
        }
      );
    }
  );
};