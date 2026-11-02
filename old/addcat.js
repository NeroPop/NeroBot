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
  const spreadsheetId = "1EQqzfFgTmH2nSAVMtGb07Oa6DZg7j2jbrVxTaWEtl8A"; // Google Sheets ID
  const sheets = google.sheets("v4");

  // Validate arguments
  if (args.length < 2) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Missing Information")
          .setDescription(
            "Please provide both a cat name **and** a valid image link.\n\n**Usage:** `-addcat [Cat Name] [Link to Image]`"
          ),
      ],
    });
  }

  const catName = args[0].trim();
  const imageLink = args.slice(1).join(" ").trim();

  // Basic link validation
  if (!imageLink.startsWith("http")) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Invalid Image Link")
          .setDescription(
            "Please make sure your image link starts with `http` or `https`."
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

    // Append the cat data to the spreadsheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[catName, imageLink]],
      },
    });

    console.log(`🐱 Added new cat: ${catName} (${imageLink})`);

    // Success embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("🐾 Cat Added Successfully!")
      .setDescription(`**${catName}** has been added to the cat gallery!`)
      .setImage(imageLink);

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error adding cat:", error);

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "Something went wrong while adding the cat. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "addcat";
exports.description = "Add a new cat image to the Google Sheets document.";