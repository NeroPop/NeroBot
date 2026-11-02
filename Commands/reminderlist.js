// Import necessary modules
const { google } = require('googleapis');

// Google Sheets authentication information
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

// Google Sheets ID
const spreadsheetId = '1z4wWvQxM2teujLyzSBYvbvAvC_uo4DCzdcTRmg1CQLE';
const auth = new google.auth.JWT({
  email: sheetsAuth.client_email,
  key: sheetsAuth.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets("v4");

module.exports.run = async (client, message) => {
  if (!message.content.startsWith("-reminderlist")) return;

  const userId = message.author.id;

  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Reminders",
    });

    const rows = response.data.values || [];
    const userReminders = rows.filter(row => row[0] === userId && row[4] !== 'TRUE');

    if (userReminders.length === 0) {
      message.reply("You have no pending reminders.");
      return;
    }

    const list = userReminders.map(row => {
      const reminderTime = parseInt(row[1]);
      const timeLeft = reminderTime - Date.now();
      if (timeLeft <= 0) {
        return `🕒 "${row[2]}" - sending any moment now`;
      }
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % 86400000) / 3600000);
      const minutes = Math.floor((timeLeft % 3600000) / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      return `🕒 "${row[2]}" - ${days}d ${hours}h ${minutes}m ${seconds}s left`;
    });

    message.reply(list.join("\n"));
  } catch (err) {
    console.error("Sheets API error:", err);
    message.reply("An error occurred while fetching reminders.");
  }
};

module.exports.name = "reminderlist";
module.exports.description = "Lists all pending reminders for the user.";