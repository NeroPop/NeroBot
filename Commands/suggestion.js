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

exports.run = async (client, message, args) => {
  const spreadsheetId3 = '150Jt9-ddbPWhAisrNA1ITK6KN60mCjw0oPgqR_UWZBg'; // Replace with your Google Sheets ID
  const sheets = google.sheets('v4');

  // Check if the user provided a suggestion
  const newSuggestion = args.join(' ');
  if (!newSuggestion) {
    message.channel.send('Please add a feature suggestion. Usage: `-suggestion [your suggested feature]`');
    return;
  }

  // Authenticate using your service account credentials
  const auth = new google.auth.JWT({
    email: sheetsAuth.client_email,
    key: sheetsAuth.private_key,
    scopes: 'https://www.googleapis.com/auth/spreadsheets',
  });

  // Get the user's Discord name
  const authorName = message.author.username;

  // Append the suggestion and author to the spreadsheet
  sheets.spreadsheets.values.append(
    {
      auth: auth,
      spreadsheetId: spreadsheetId3,
      range: 'Sheet1',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[authorName, newSuggestion]],
      },
    },
    (err, response) => {
      if (err) {
        console.error('The API returned an error:', err);
        message.channel.send('An error occurred while adding the suggestion to the spreadsheet.');
        return;
      }

      message.channel.send(`Suggestion added successfully: "${newSuggestion}"`);
    }
  );
};

exports.name = 'suggestion';
exports.description = "Add a new suggestion for a new Bot feature you'd like to see.";
