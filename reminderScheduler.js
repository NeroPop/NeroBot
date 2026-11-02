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

const spreadsheetId = '1z4wWvQxM2teujLyzSBYvbvAvC_uo4DCzdcTRmg1CQLE';
const auth = new google.auth.JWT({
  email: sheetsAuth.client_email,
  key: sheetsAuth.private_key,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets('v4');

const CHECK_INTERVAL_MS = 30000;
let checkInFlight = false;

async function checkReminders(client) {
  if (checkInFlight) return;
  checkInFlight = true;

  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: 'Reminders',
    });

    const rows = response.data.values || [];
    const now = Date.now();

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const [userId, reminderTime, reminderMessage, channelId, sent] = row;
      if (!userId || !reminderTime) continue;
      if (sent === 'TRUE') continue;
      if (parseInt(reminderTime, 10) > now) continue;

      let delivered = false;
      if (channelId) {
        try {
          const channel = await client.channels.fetch(channelId);
          await channel.send(`<@${userId}> ⏰ Reminder: ${reminderMessage}`);
          delivered = true;
        } catch (err) {
          console.error(`Reminder scheduler: failed to send to channel ${channelId}:`, err.message);
        }
      }
      if (!delivered) {
        try {
          const user = await client.users.fetch(userId);
          await user.send(`⏰ Reminder: ${reminderMessage}`);
        } catch (err) {
          console.error(`Reminder scheduler: failed to DM user ${userId}:`, err.message);
        }
      }

      try {
        await sheets.spreadsheets.values.update({
          auth,
          spreadsheetId,
          range: `Reminders!E${i + 1}`,
          valueInputOption: 'RAW',
          resource: { values: [['TRUE']] },
        });
      } catch (err) {
        console.error(`Reminder scheduler: failed to mark row ${i + 1} as sent:`, err.message);
      }
    }
  } catch (err) {
    console.error('Reminder scheduler: failed to read sheet:', err.message);
  } finally {
    checkInFlight = false;
  }
}

function startReminderScheduler(client) {
  checkReminders(client);
  setInterval(() => checkReminders(client), CHECK_INTERVAL_MS);
  console.log('Reminder scheduler started.');
}

module.exports = { startReminderScheduler };
