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

exports.run = async (client, message, args) => {
  const spreadsheetId = "12n41DpDoEvzMc_ICg0ipEVeeb3rwMb3DGhHkKyH7bJc"; // Google Sheets ID
  const sheets = google.sheets("v4");

  // Combine user input into one string
  const newText = args.join(" ").trim();

  // Validate user input
  if (!newText) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Missing Meme Text")
          .setDescription(
            "Please provide meme text to add.\n\n**Usage:** `-addmemetext [your text that will go in memes]`"
          ),
      ],
    });
  }

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Use the user's display name if available (fallback to username)
    const authorName = message.member
      ? message.member.displayName
      : message.author.username;

    // Append meme text and author to Google Sheets
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[authorName, newText]],
      },
    });

    console.log(`😂 New meme text added by ${authorName}: "${newText}"`);

    // Success embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("😂 Meme Text Added Successfully!")
      .setDescription(`**${newText}**`)
      .setFooter({
        text: `Added by ${authorName}`,
        iconURL: message.author.displayAvatarURL(),
      });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error adding meme text:", error);

    // Error embed
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "Something went wrong while adding your meme text. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "addmemetext";
exports.description =
  "Add new text for the bot to randomly assign to generated memes.";