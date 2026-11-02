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
  const spreadsheetId = "1EQqzfFgTmH2nSAVMtGb07Oa6DZg7j2jbrVxTaWEtl8A"; // Google Sheets ID
  const sheets = google.sheets("v4");

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Get cat names (column A)
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:A",
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return message.channel.send("😿 No cat names found in the spreadsheet.");
    }

    // Create a unique, alphabetized list of names
    const catNames = [...new Set(values.flat().filter(Boolean))].sort((a, b) =>
      a.localeCompare(b)
    );

    if (catNames.length === 0) {
      return message.channel.send("😿 No cat names found in the spreadsheet.");
    }

    // Discord messages have a max length; truncate if too long
    const fullList = catNames.join("\n");
    const displayList =
      fullList.length > 4000 ? fullList.slice(0, 4000) + "\n...and more!" : fullList;

    // Build the embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setTitle("🐱 Current Cat Models")
      .setDescription(displayList)
      .setFooter({ text: `Total cats: ${catNames.length}` });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error fetching cat list:", error);
    await message.channel.send("💥 An error occurred while fetching the cat list.");
  }
};

exports.name = "catlist";
exports.description = "Lists all unique cat names with pictures from the spreadsheet.";