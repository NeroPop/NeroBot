const { google } = require('googleapis');
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
  const spreadsheetId = "1QgV4SriH4cVSJSvuOWxG6ZeO72UuuT24cb7JBEVa6Ws"; // Google Sheets ID
  const sheets = google.sheets("v4");

  try {
    // Authenticate using your service account credentials
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Fetch data from the sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B", // A = name, B = prompt
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return message.channel.send("📋 No prompts found in the database yet!");
    }

    // Filter out empty rows
    const validPrompts = values.filter((row) => row[0] && row[1]);
    if (validPrompts.length === 0) {
      return message.channel.send("📭 No valid prompts available.");
    }

    // Pick a random prompt
    const randomPrompt =
      validPrompts[Math.floor(Math.random() * validPrompts.length)];
    const [author, promptText] = randomPrompt;

    // Build the embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("💡 Random Prompt")
      .addFields({
        name: "\u200B",
        value: `**${promptText}**`,
      })
      .setFooter({
        text: `Suggested by ${author}`,
        iconURL: client.user.displayAvatarURL(),
      });

    await message.channel.send({ embeds: [embed] });

    console.log(`💡 Sent prompt from ${author}: "${promptText}"`);
  } catch (error) {
    console.error("❌ Error fetching prompt:", error);

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "An error occurred while fetching a random prompt. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "prompt";
exports.description =
  "Reads a random prompt and credits the person who suggested it.";