const { google } = require("googleapis");
const { EmbedBuilder, Colors } = require("discord.js");

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

exports.run = async (client, message) => {
  const spreadsheetId = "1rPOrOgg0tkK12VuaDSahW-mJ954LM51jVWa0baZ-cNc"; // Google Sheets ID
  const sheets = google.sheets("v4");

  const serverID = message.guild.id;
  const serverName = message.guild.name;
  const channelID = message.channel.id;
  const channelName = message.channel.name;

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Read existing data
    const readResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B",
    });

    const values = readResponse.data.values || [];
    let updated = false;

    if (values.length > 0) {
      // Check if this server already exists
      const existingIndex = values.findIndex((row) => row[0] === serverID);

      if (existingIndex !== -1) {
        // Update that row’s channel ID
        values[existingIndex][1] = channelID;
        updated = true;

        await sheets.spreadsheets.values.update({
          auth,
          spreadsheetId,
          range: "Sheet1!A2:B",
          valueInputOption: "RAW",
          resource: { values },
        });

        console.log(`🔁 Updated bot channel for ${serverName} → #${channelName}`);
      }
    }

    if (!updated) {
      // If not found, append new entry
      await sheets.spreadsheets.values.append({
        auth,
        spreadsheetId,
        range: "Sheet1!A2:B",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        resource: { values: [[serverID, channelID]] },
      });

      console.log(`➕ Added bot channel for ${serverName} → #${channelName}`);
    }

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("✅ Bot Channel Registered")
      .setDescription(
        `This channel has been successfully set for bot announcements.\n\n**Server:** ${serverName}\n**Channel:** <#${channelID}>`
      )
      .setFooter({ text: "You can change this anytime by re-running -botchannel." });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error setting bot channel:", error);
    await message.channel.send("⚠️ An error occurred while setting the bot channel. Please try again later.");
  }
};

exports.name = "botchannel";
exports.description = "Sets the current channel as the bot's announcement channel for this server.";