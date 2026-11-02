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

exports.run = async (client, message, args) => {
  const spreadsheetId = "1EQqzfFgTmH2nSAVMtGb07Oa6DZg7j2jbrVxTaWEtl8A"; // Google Sheets ID
  const sheets = google.sheets("v4");

  if (args.length < 1) {
    return message.channel.send("❗ Please provide a cat name. Usage: `-catname [Name]`");
  }

  const catName = args.join(" ").trim();

  try {
    // Authenticate using service account credentials
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Fetch data from the sheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B", // Read both columns A and B
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return message.channel.send("⚠️ No cat data found in the spreadsheet.");
    }

    // Filter rows matching the name, ignoring case and empty image cells
    const catImages = values.filter(
      (row) => row[0] && row[1] && row[0].toLowerCase() === catName.toLowerCase()
    );

    if (catImages.length === 0) {
      return message.channel.send(`😿 No images found for **${catName}**.`);
    }

    // Pick a random image from the results
    const randomImage = catImages[Math.floor(Math.random() * catImages.length)][1];

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`🐾 Random Cat Picture of ${catName}`)
      .setImage(randomImage)
      .setFooter({ text: "Pulled from Nero Bot's Cat Gallery" });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error fetching cat data:", error);
    await message.channel.send("💥 An error occurred while fetching the cat image.");
  }
};

exports.name = "catname";
exports.description = "Provides a random image of a specific cat.";