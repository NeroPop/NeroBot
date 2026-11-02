const axios = require("axios");
const querystring = require("querystring");
const { EmbedBuilder, Colors } = require("discord.js");
const { google } = require("googleapis");

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
  const username = "NeroPop";
  const password = "REMOVED-see-README-and-.env";
  const getMemesUrl = "https://api.imgflip.com/get_memes";
  const captionImageUrl = "https://api.imgflip.com/caption_image";

  const spreadsheetId = "12n41DpDoEvzMc_ICg0ipEVeeb3rwMb3DGhHkKyH7bJc";
  const sheets = google.sheets("v4");

  const auth = new google.auth.JWT({
    email: sheetsAuth.client_email,
    key: sheetsAuth.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  try {
    await auth.authorize();

    const sheetResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1",
    });

    const sheetData = sheetResponse.data.values;
    if (!sheetData || sheetData.length === 0) {
      console.error("No data found in the spreadsheet.");
      return message.channel.send("⚠️ Oops! No meme data found in the spreadsheet.");
    }

    // Pick two random rows from the spreadsheet
    const randomRowIndexTop = Math.floor(Math.random() * sheetData.length);
    const randomRowIndexBottom = Math.floor(Math.random() * sheetData.length);

    const topText = sheetData[randomRowIndexTop][0];
    const bottomText = sheetData[randomRowIndexBottom][0];

    // Get meme templates from Imgflip
    const templatesResponse = await axios.get(getMemesUrl);
    const memes = templatesResponse.data.data.memes;

    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    const templateId = randomMeme.id;

    const requestData = {
      template_id: templateId,
      username,
      password,
      text0: topText,
      text1: bottomText,
    };

    const formData = querystring.stringify(requestData);
    const response = await axios.post(captionImageUrl, formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (response.data.success) {
      const memeUrl = response.data.data.url;

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle("🤣 Random Meme Generator")
        .setDescription("Straight from the chaos matrix:")
        .setImage(memeUrl)
        .setFooter({ text: "Enjoy this generated meme!" });

      await message.channel.send({ embeds: [embed] });
    } else {
      console.error("Error generating meme:", response.data.error_message);
      message.channel.send(
        `😅 Something went wrong while generating the meme:\n> ${response.data.error_message}`
      );
    }
  } catch (error) {
    console.error("Error:", error);
    message.channel.send(`💥 Oops! An error occurred:\n> ${error.message}`);
  }
};

exports.name = "meme";
exports.description = "Generates a random meme using the Imgflip API and random prompts from a Google Sheet.";