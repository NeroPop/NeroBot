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
  const spreadsheetId = "1EQqzfFgTmH2nSAVMtGb07Oa6DZg7j2jbrVxTaWEtl8A"; // Google Sheets ID
  const sheets = google.sheets("v4");

  // 🐱 Fun cat captions
  const captions = [
    "Such floof! 😻",
    "A certified good kitty 🐾",
    "Cuteness level: 100%",
    "The purr-fect companion 💕",
    "Professional biscuit maker 🍪",
    "Master of naps 😴",
    "Fur-tunately adorable 🧡",
    "Whisker wizard 🪄",
    "Paws-itively stunning ✨",
    "A cat above the rest 🐈",
    "Stealing hearts and tuna cans 🐟",
    "Radiating pure chaos and love 💥",
  ];

  try {
    // Authenticate using your service account
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Read data from the spreadsheet
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B", // A = Name, B = Image Link
    });

    const values = response.data.values;

    if (!values || values.length === 0) {
      return message.channel.send("😿 No cat data found in the spreadsheet.");
    }

    // Filter out rows without valid image links
    const validCats = values.filter((row) => row[0] && row[1]);

    if (validCats.length === 0) {
      return message.channel.send("😿 No cat pictures found in the sheet.");
    }

    // Pick a random cat and caption
    const randomCat = validCats[Math.floor(Math.random() * validCats.length)];
    const [catName, catImage] = randomCat;
    const randomCaption = captions[Math.floor(Math.random() * captions.length)];

    // Create the embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle(`🐾 Random Cat Picture`)
      .setDescription(`Meet **${catName}**!\n${randomCaption}`)
      .setImage(catImage)
      .setFooter({ text: "Pulled from Nero Bot's Cat Gallery" });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error fetching cat data:", error);
    await message.channel.send("💥 An error occurred while fetching a random cat image.");
  }
};

exports.name = "cat";
exports.description = "Sends a random cat picture, name, and fun caption.";