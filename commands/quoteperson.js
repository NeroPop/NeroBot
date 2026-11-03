// commands/quoteperson.js
//
// The /quoteperson command. Shows a random quote by one particular author.
// Capital letters do not matter.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');
const { shorten } = require('../lib/text');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quoteperson') // must match the file name (quoteperson.js)
    .setDescription('Provides a random quote by a specific author.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('author').setDescription('Who said it?').setRequired(true).setMaxLength(100)
    ),

  async execute(interaction) {
    const authorName = interaction.options.getString('author', true).trim();

    await interaction.deferReply(); // reading the spreadsheet can take a moment

    const rows = await readRange(sheetIds.quotes, sheetTabs.quotes, 'A2:B');
    if (rows.length === 0) {
      await interaction.editReply('📜 No quotes found in the database yet!');
      return;
    }

    // Keep the quotes by this author (ignoring capital letters).
    const authorQuotes = rows.filter((row) => row[0] && row[1] && row[0].toLowerCase() === authorName.toLowerCase());

    if (authorQuotes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('📭 No Quotes Found')
        .setDescription(`No quotes found for **${authorName}**.\nTry checking the spelling or adding a quote first!`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const [author, quote] = pickRandom(authorQuotes);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle(`💬 Quote by ${shorten(author, 200)}`)
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
