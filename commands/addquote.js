// commands/addquote.js
//
// The /addquote command. Adds a quote to the quotes spreadsheet:
//     /addquote author:Terry Pratchett quote:A quote goes here.
// Column A gets the author and column B gets the quote.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { appendRow } = require('../lib/sheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addquote') // must match the file name (addquote.js)
    .setDescription('Adds a new quote to the Google Sheets document.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => option.setName('author').setDescription('Who said it?').setRequired(true).setMaxLength(100))
    .addStringOption((option) => option.setName('quote').setDescription('What did they say?').setRequired(true).setMaxLength(1000)),

  async execute(interaction) {
    const author = interaction.options.getString('author', true).trim();
    const quote = interaction.options.getString('quote', true).trim();

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    await appendRow(sheetIds.quotes, sheetTabs.quotes, [author, quote], 'A:B');
    console.log(`📝 Quote added by ${interaction.user.tag}: "${quote}" - ${author}`);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('💬 Quote Added Successfully!')
      .setDescription(`> "${quote}"\n**- ${author}**`)
      .setFooter({
        text: `Added by ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
