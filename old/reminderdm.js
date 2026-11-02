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

const spreadsheetId = "1z4wWvQxM2teujLyzSBYvbvAvC_uo4DCzdcTRmg1CQLE";

// Google Sheets API setup
const auth = new google.auth.JWT({
  email: sheetsAuth.client_email,
  key: sheetsAuth.private_key,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets("v4");

module.exports.run = async (client, message, args) => {
  if (!message.content.startsWith("-reminderdm")) return;

  const parts = message.content.split(" ");
  if (parts.length < 4) {
    message.reply("Usage: `-reminderdm [timeValue] [timeUnit] [reminderMessage]`");
    return;
  }

  const userId = message.author.id;
  const timeValue = parseInt(parts[1]);
  const timeUnit = parts[2].toLowerCase();
  const reminderMessage = parts.slice(3).join(" ");

  // convert to milliseconds
  const unitMap = {
    second: 1000, seconds: 1000, sec: 1000, secs: 1000,
    minute: 60000, minutes: 60000, min: 60000, mins: 60000,
    hour: 3600000, hours: 3600000,
    day: 86400000, days: 86400000,
  };

  const timeInMilliseconds = unitMap[timeUnit];
  if (!timeInMilliseconds) {
    message.reply("Invalid time unit.\n\nUsage: `-reminderdm [timeValue] [timeUnit] [reminderMessage]` (timeUnit: seconds, minutes, hours, or days)");
    return;
  }

  const reminderTime = Date.now() + timeValue * timeInMilliseconds;

  // Leaving the channel ID blank tells the reminder scheduler to deliver
  // this one by DM instead of posting in the channel it was created from.
  try {
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Reminders",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[userId, reminderTime, reminderMessage, "", "FALSE"]],
      },
    });
    message.reply(`Reminder set! I'll DM you in ${timeValue} ${timeUnit}.`);
  } catch (err) {
    console.error("Sheets API error:", err);
    message.reply("An error occurred while adding the reminder.");
  }
};

module.exports.name = "reminderdm";
module.exports.description = "Set a reminder to be sent to you via DM.";
