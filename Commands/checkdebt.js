// commands/checkdebt.js
//
// The /checkdebt command. Shows how much a person owes Nero in total.
// The totals live in the "Totals" tab of the debts spreadsheet (config.js: sheetIds.debts):
// column A is the person's name and column B is the total they owe.
// Capital letters do not matter in the name.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('checkdebt') // must match the file name (checkdebt.js)
    .setDescription('Check the total amount owed to Nero by a specific person.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('name').setDescription('Who should I look up?').setRequired(true).setMaxLength(100)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true).trim();

    await interaction.deferReply(); // reading the spreadsheet can take a moment

    // Find the row with this name (ignoring capital letters).
    const rows = await readRange(sheetIds.debts, sheetTabs.debtTotals, 'A:B');
    const match = rows.find((row) => row[0] && String(row[0]).toLowerCase() === name.toLowerCase());

    // Never ping anyone, because the name is text somebody typed.
    const noPings = { parse: [] };

    if (!match) {
      await interaction.editReply({ content: 'The name was not found, they may not owe Nero anything.', allowedMentions: noPings });
      return;
    }

    // The name is on the list but column B is empty.
    if (match[1] === undefined || match[1] === '') {
      await interaction.editReply({ content: `${match[0]} is on the list, but has no total yet.`, allowedMentions: noPings });
      return;
    }

    await interaction.editReply({ content: `${match[0]} owes Nero £${match[1]}.`, allowedMentions: noPings });
  },
};
