// commands/suggestion.js
//
// The /suggestion command. Saves an idea for a new bot feature in the suggestions spreadsheet.
// Column A gets the person's Discord username and column B gets their idea.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { appendRow } = require('../lib/sheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('suggestion') // must match the file name (suggestion.js)
    .setDescription("Add a new suggestion for a new Bot feature you'd like to see.")
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('idea').setDescription('The feature you would like to see.').setRequired(true).setMaxLength(1500)
    ),

  async execute(interaction) {
    const newSuggestion = interaction.options.getString('idea', true).trim();

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    await appendRow(sheetIds.suggestions, sheetTabs.suggestions, [interaction.user.username, newSuggestion], 'A:B');

    await interaction.editReply(`Suggestion added successfully: "${newSuggestion}"`);
  },
};
