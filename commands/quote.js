// commands/quote.js
//
// The /quote command. Shows a random quote with the person who said it.
// The quotes live in the quotes spreadsheet: column A is the author, column B is the quote
// (config.js: sheetIds.quotes). Use /addquote to add more.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');
const { shorten } = require('../lib/text');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote') // must match the file name (quote.js)
    .setDescription('Sends a random quote from the database.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.deferReply(); // reading the spreadsheet can take a moment

    // Column A = author, column B = quote.
    const rows = await readRange(sheetIds.quotes, sheetTabs.quotes, 'A2:B');
    if (rows.length === 0) {
      await interaction.editReply('📜 No quotes found in the database yet!');
      return;
    }

    // Skip rows where the author or the quote is missing.
    const validQuotes = rows.filter((row) => row[0] && row[1]);
    if (validQuotes.length === 0) {
      await interaction.editReply('📭 All quotes are empty or invalid.');
      return;
    }

    const [author, quote] = pickRandom(validQuotes);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('💬 Inspirational Quote')
      .addFields({
        name: '​', // an invisible title, for spacing
        value: `**“${shorten(quote, 900)}”**\n\n*- ${shorten(author, 100)}*`,
      })
      .setFooter({
        text: "Powered by Nero Bot's Quote Library",
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
