// commands/cat.js
//
// The /cat command. Shows a random cat picture with its name and a fun caption.
// The cats live in the cats spreadsheet: column A is the name, column B is the picture link
// (config.js: sheetIds.cats). Use /addcat to add more.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');

// The fun captions. To add one, add a line to this list.
const captions = [
  'Such floof! 😻',
  'A certified good kitty 🐾',
  'Cuteness level: 100%',
  'The purr-fect companion 💕',
  'Professional biscuit maker 🍪',
  'Master of naps 😴',
  'Fur-tunately adorable 🧡',
  'Whisker wizard 🪄',
  'Paws-itively stunning ✨',
  'A cat above the rest 🐈',
  'Stealing hearts and tuna cans 🐟',
  'Radiating pure chaos and love 💥',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat') // must match the file name (cat.js)
    .setDescription('Sends a random cat picture, name, and fun caption.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // Reading the spreadsheet can take a moment, and Discord only waits 3 seconds for a reply.
    // deferReply() tells Discord "working on it" first.
    await interaction.deferReply();

    // Column A = name, column B = picture link. Skip rows where either is missing.
    const rows = await readRange(sheetIds.cats, sheetTabs.cats, 'A2:B');
    const validCats = rows.filter((row) => row[0] && row[1]);

    if (validCats.length === 0) {
      await interaction.editReply('😿 No cat pictures found in the sheet.');
      return;
    }

    const [catName, catImage] = pickRandom(validCats);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blue)
      .setTitle('🐾 Random Cat Picture')
      .setDescription(`Meet **${catName}**!\n${pickRandom(captions)}`)
      .setImage(catImage)
      .setFooter({ text: "Pulled from Nero Bot's Cat Gallery" });

    await interaction.editReply({ embeds: [embed] });
  },
};
