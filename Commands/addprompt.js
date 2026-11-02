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
  const spreadsheetId = "1QgV4SriH4cVSJSvuOWxG6ZeO72UuuT24cb7JBEVa6Ws"; // Google Sheets ID
  const sheets = google.sheets("v4");

  // Combine arguments into a single string (the prompt)
  const newPrompt = args.join(" ").trim();

  // Validate input
  if (!newPrompt) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Missing Prompt")
          .setDescription(
            "Please provide a prompt to add.\n\n**Usage:** `-addprompt [your new prompt]`"
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

    // Get the user's display name (or fallback to username if no member context)
    const authorName = message.member
      ? message.member.displayName
      : message.author.username;

    // Append the prompt and author to the spreadsheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[authorName, newPrompt]],
      },
    });

    console.log(`💡 New prompt added by ${authorName}: "${newPrompt}"`);

    // Success embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("💡 Prompt Added Successfully!")
      .setDescription(`**${newPrompt}**`)
      .setFooter({
        text: `Added by ${authorName}`,
        iconURL: message.author.displayAvatarURL(),
      });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error adding prompt:", error);

    // Error embed
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "Something went wrong while adding your prompt. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "addprompt";
exports.description = "Add a new conversation prompt to the Google Sheets document.";