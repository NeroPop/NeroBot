const { google } = require('googleapis');

const serviceAccountJson = {
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

const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

// Authenticate using your service account credentials
const auth = new google.auth.JWT({
  email: serviceAccountJson.client_email,
  key: serviceAccountJson.private_key,
  scopes,
});

// Your spreadsheet ID
const spreadsheetId = '1QgV4SriH4cVSJSvuOWxG6ZeO72UuuT24cb7JBEVa6Ws';
const spreadsheetId2 = '1JPgOfxzj9JSRPwCHIqnc9SgsgA1XhGIkqwxlH5oBFaw';
const spreadsheetId3 = '150Jt9-ddbPWhAisrNA1ITK6KN60mCjw0oPgqR_UWZBg';
const spreadsheetId4 = '1xQio_F4j1deCo1X9vxA_eOsEleGA0V6aJqj1J1edGuM';
const spreadsheetId5 = '1z4wWvQxM2teujLyzSBYvbvAvC_uo4DCzdcTRmg1CQLE';

exports.run = async (client, message, args) => {
  // Authorize the client
  try {
    await auth.authorize();
    message.channel.send('Authorization successful');
  } catch (error) {
    console.error('Authorization error:', error);
    message.channel.send('Authorization error');
  }
};
