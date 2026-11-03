// commands/meme.js
//
// The /meme command. Makes a random meme:
//   1. Picks two random pieces of text from the meme spreadsheet (config.js: sheetIds.memeText).
//   2. Picks a random meme picture from Imgflip (https://imgflip.com).
//   3. Asks Imgflip to put the text on the picture, and shows the result.
//
// Imgflip needs an account. Its username and password are secrets, so they live in the .env file:
//     IMGFLIP_USERNAME=...
//     IMGFLIP_PASSWORD=...
// Use /addmemetext to add more text to the spreadsheet.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors, MessageFlags } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');

const GET_MEMES_URL = 'https://api.imgflip.com/get_memes';
const CAPTION_IMAGE_URL = 'https://api.imgflip.com/caption_image';

// How long to wait for Imgflip before giving up, in milliseconds.
const IMGFLIP_TIMEOUT_MS = 15000;

// Asks Imgflip for something and returns its answer as an object.
// "options" is passed on to fetch (for example to send the text for a caption).
async function askImgflip(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(IMGFLIP_TIMEOUT_MS) });
  if (!response.ok) throw new Error(`Imgflip answered with status ${response.status}.`);
  return response.json();
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme') // must match the file name (meme.js)
    .setDescription('Generates a random meme using the Imgflip API and random prompts from a Google Sheet.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const username = process.env.IMGFLIP_USERNAME;
    const password = process.env.IMGFLIP_PASSWORD;

    // Without the Imgflip login there is nothing we can do. Say so (privately) and log it.
    if (!username || !password) {
      console.error('The meme command needs IMGFLIP_USERNAME and IMGFLIP_PASSWORD in the .env file.');
      await interaction.reply({
        content: '⚠️ The meme maker is not set up yet. Please tell the bot owner.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply(); // this takes a few seconds

    // Column A holds the text. Skip empty rows so a blank is never put on a meme.
    const rows = await readRange(sheetIds.memeText, sheetTabs.memeText, 'A:B');
    const texts = rows.map((row) => row[0]).filter(Boolean);

    if (texts.length === 0) {
      await interaction.editReply('⚠️ Oops! No meme data found in the spreadsheet.');
      return;
    }

    // Two random pieces of text: one for the top of the picture and one for the bottom.
    const topText = pickRandom(texts);
    const bottomText = pickRandom(texts);

    // Get the list of meme pictures from Imgflip and pick one.
    const templates = await askImgflip(GET_MEMES_URL);
    if (!templates.success) throw new Error(`Imgflip could not list the memes: ${templates.error_message}`);
    const randomMeme = pickRandom(templates.data.memes);

    // Ask Imgflip to put our text on it.
    const captioned = await askImgflip(CAPTION_IMAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        template_id: randomMeme.id,
        username,
        password,
        text0: topText,
        text1: bottomText,
      }),
    });

    if (!captioned.success) {
      console.error('Error generating meme:', captioned.error_message);
      await interaction.editReply({
        content: `😅 Something went wrong while generating the meme:\n> ${captioned.error_message}`,
        allowedMentions: { parse: [] },
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('🤣 Random Meme Generator')
      .setDescription('Straight from the chaos matrix:')
      .setImage(captioned.data.url)
      .setFooter({ text: 'Enjoy this generated meme!' });

    await interaction.editReply({ embeds: [embed] });
  },
};
