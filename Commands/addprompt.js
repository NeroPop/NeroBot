// commands/addprompt.js
//
// The /addprompt command. Adds a conversation prompt to the prompts spreadsheet.
// Column A gets the name of the person adding it and column B gets the prompt.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { appendRow } = require('../lib/sheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addprompt') // must match the file name (addprompt.js)
    .setDescription('Add a new conversation prompt to the Google Sheets document.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('prompt').setDescription('Your new prompt.').setRequired(true).setMaxLength(1000)
    ),

  async execute(interaction) {
    const newPrompt = interaction.options.getString('prompt', true).trim();

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    // Use the person's server nickname if they have one, otherwise their username.
    const authorName = interaction.member?.displayName ?? interaction.user.username;

    await appendRow(sheetIds.prompts, sheetTabs.prompts, [authorName, newPrompt], 'A:B');
    console.log(`💡 New prompt added by ${authorName}: "${newPrompt}"`);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('💡 Prompt Added Successfully!')
      .setDescription(`**${newPrompt}**`)
      .setFooter({
        text: `Added by ${authorName}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
