// commands/quotelist.js
//
// The /quotelist command. Lists every quote by one author, 10 to a page, with Previous and
// Next buttons. Capital letters do not matter in the author's name.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { sendPages } = require('../lib/paginate');
const { shorten } = require('../lib/text');

// How many quotes go on each page.
const QUOTES_PER_PAGE = 10;

// A very long quote is cut to this many characters, so a page always fits on a card.
const MAX_QUOTE_LENGTH = 350;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quotelist') // must match the file name (quotelist.js)
    .setDescription('Lists all quotes by a specific author.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('author').setDescription('Whose quotes should I list?').setRequired(true).setMaxLength(100)
    ),

  async execute(interaction) {
    const authorName = interaction.options.getString('author', true).trim();

    await interaction.deferReply(); // reading the spreadsheet can take a moment

    const rows = await readRange(sheetIds.quotes, sheetTabs.quotes, 'A2:B');
    if (rows.length === 0) {
      await interaction.editReply('📜 No quotes found in the database yet!');
      return;
    }

    // Keep the quotes by this author (ignoring capital letters). We only need the quote text.
    const authorQuotes = rows
      .filter((row) => row[0] && row[1] && row[0].toLowerCase() === authorName.toLowerCase())
      .map((row) => row[1]);

    if (authorQuotes.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('📭 No Quotes Found')
        .setDescription(`No quotes found for **${authorName}**.\nTry checking the spelling or adding a quote first!`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Cut the quotes into pages of 10.
    const pageCount = Math.ceil(authorQuotes.length / QUOTES_PER_PAGE);
    const pages = [];

    for (let start = 0; start < authorQuotes.length; start += QUOTES_PER_PAGE) {
      const quotesOnPage = authorQuotes.slice(start, start + QUOTES_PER_PAGE);
      const formattedQuotes = quotesOnPage
        .map((quote, index) => `**${start + index + 1}.** “${shorten(quote, MAX_QUOTE_LENGTH)}”`)
        .join('\n\n');

      pages.push(
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle(`💬 Quotes by ${shorten(authorName, 200)}`)
          .setDescription(formattedQuotes)
          .setFooter({
            text: `Page ${pages.length + 1} of ${pageCount} • Total: ${authorQuotes.length} quotes`,
            iconURL: interaction.client.user.displayAvatarURL(),
          })
      );
    }

    await sendPages(interaction, pages, { backLabel: '◀️ Previous', nextLabel: 'Next ▶️' });
  },
};
