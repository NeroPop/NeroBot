const { google } = require('googleapis');

const sheetsAuth = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (function () {
    const raw = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const BEGIN = '-----BEGIN PRIVATE KEY-----';
    const END = '-----END PRIVATE KEY-----';
    const start = raw.indexOf(BEGIN);
    const endIdx = raw.indexOf(END);
    if (start === -1 || endIdx === -1) return raw.trim() + '\n';
    const rawBody = raw.slice(start + BEGIN.length, endIdx);
    const cleanBody = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
    const wrapped = cleanBody.match(/.{1,64}/g).join('\n');
    return `${BEGIN}\n${wrapped}\n${END}\n`;
  })(),
};

const spreadsheetId = '1xQio_F4j1deCo1X9vxA_eOsEleGA0V6aJqj1J1edGuM'; // Replace with your Google Sheets ID

exports.run = async (client, message, args) => {
  // Check if the user provided the name as an argument
  if (args.length < 1) {
    message.channel.send('Please provide a name.\n\nUsage: `-checkdebt [Name]`');
    return;
  }

  // Extract the name from the command
  const name = args[0];

  // Authenticate using your service account credentials
  const auth = new google.auth.JWT({
    email: sheetsAuth.client_email,
    key: sheetsAuth.private_key,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Initialize the Google Sheets API
  const sheets = google.sheets('v4');

  // Check if the name exists in the "Totals" sheet
  sheets.spreadsheets.values.get(
    {
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: 'Totals!A:A', // Check the entire "A" column for the name
    },
    (err, response) => {
      if (err) {
        console.error('The API returned an error:', err);
        message.channel.send('An error occurred while checking for the name.');
        return;
      }

      const nameValues = response.data.values;
      const rowIndex = nameValues.findIndex((row) => row[0] === name);

      if (rowIndex === -1) {
        message.channel.send('The name was not found, they may not owe Nero anything.');
        return;
      }

      // Retrieve the total owed for the specified name
      const totalOwed = sheets.spreadsheets.values.get(
        {
          auth: auth,
          spreadsheetId: spreadsheetId,
          range: `Totals!B${rowIndex + 1}`, // Get the corresponding cell in column B
        },
        (err, response) => {
          if (err) {
            console.error('The API returned an error:', err);
            message.channel.send('An error occurred while fetching the total owed.');
            return;
          }

          const total = response.data.values[0][0];

          message.channel.send(`${name} owes Nero £${total}.`);
        }
      );
    }
  );
};

exports.name = 'checkdebt';
exports.description = 'Check the total amount owed to Nero by a specific person.';
