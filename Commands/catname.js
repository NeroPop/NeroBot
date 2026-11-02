// commands/catname.js
//
// The /catname command. Shows a random picture of one particular cat, found by name.
// Capital letters do not matter. See /catlist for the names.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catname') // must match the file name (catname.js)
    .setDescription('Provides a random image of a specific cat.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('name').setDescription('The cat to look for (see /catlist).').setRequired(true).setMaxLength(100)
    ),

  async execute(interaction) {
    const catName = interaction.options.getString('name', true).trim();

    await interaction.deferReply(); // reading the spreadsheet can take a moment

    // Keep the rows that match the name (ignoring capital letters) and have a picture link.
    const rows = await readRange(sheetIds.cats, sheetTabs.cats, 'A2:B');
    const catImages = rows.filter((row) => row[0] && row[1] && row[0].toLowerCase() === catName.toLowerCase());

    if (catImages.length === 0) {
      await interaction.editReply({ content: `😿 No images found for **${catName}**.`, allowedMentions: { parse: [] } });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`🐾 Random Cat Picture of ${catName}`)
      .setImage(pickRandom(catImages)[1])
      .setFooter({ text: "Pulled from Nero Bot's Cat Gallery" });

    await interaction.editReply({ embeds: [embed] });
  },
};
