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
  const spreadsheetId = "1JPgOfxzj9JSRPwCHIqnc9SgsgA1XhGIkqwxlH5oBFaw"; // Google Sheets ID
  const sheets = google.sheets("v4");

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Fetch quotes from the sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B", // Author (A) | Quote (B)
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return message.channel.send("📜 No quotes found in the database yet!");
    }

    // Filter out invalid/empty rows
    const validQuotes = values.filter((row) => row[0] && row[1]);
    if (validQuotes.length === 0) {
      return message.channel.send("📭 All quotes are empty or invalid.");
    }

    // Pick a random quote
    const randomQuote = validQuotes[Math.floor(Math.random() * validQuotes.length)];
    const [author, quote] = randomQuote;

// Build the embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("💬 Inspirational Quote")
      .addFields({
        name: "\u200B", // invisible field title for spacing
        value: `**“${quote}”**\n\n*— ${author}*`,
      })
      .setFooter({
        text: "Powered by Nero Bot's Quote Library",
        iconURL: client.user.displayAvatarURL(),
      });

    // Send embed
    await message.channel.send({ embeds: [embed] });

    console.log(`📜 Sent quote by ${author}: "${quote}"`);
  } catch (error) {
    console.error("❌ Error fetching quote:", error);

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription("An error occurred while fetching a quote. Please try again later."),
      ],
    });
  }
};

exports.name = "quote";
exports.description = "Sends a random quote from the database.";