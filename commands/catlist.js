// commands/catlist.js
//
// The /catlist command. Lists the name of every cat that has a picture, once each, A to Z.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');

// A card can hold about 4096 characters. Longer lists are cut off at this many.
const MAX_LIST_LENGTH = 4000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('catlist') // must match the file name (catlist.js)
    .setDescription('Lists all unique cat names with pictures from the spreadsheet.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.deferReply(); // reading the spreadsheet can take a moment

    // Column A holds the names. A name can appear many times (one row per picture).
    const rows = await readRange(sheetIds.cats, sheetTabs.cats, 'A2:A');
    const names = rows.flat().filter(Boolean);

    // Remove repeats (a Set only keeps one of each), then sort A to Z.
    const catNames = [...new Set(names)].sort((a, b) => a.localeCompare(b));

    if (catNames.length === 0) {
      await interaction.editReply('😿 No cat names found in the spreadsheet.');
      return;
    }

    const fullList = catNames.join('\n');
    const displayList = fullList.length > MAX_LIST_LENGTH ? `${fullList.slice(0, MAX_LIST_LENGTH)}\n...and more!` : fullList;

    const embed = new EmbedBuilder()
      .setColor(Colors.Orange)
      .setTitle('🐱 Current Cat Models')
      .setDescription(displayList)
      .setFooter({ text: `Total cats: ${catNames.length}` });

    await interaction.editReply({ embeds: [embed] });
  },
};
