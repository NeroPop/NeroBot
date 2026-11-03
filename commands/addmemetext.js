// commands/addmemetext.js
//
// The /addmemetext command. Adds words to the meme spreadsheet. /meme picks words from this
// spreadsheet to put on its pictures.
// Column A gets the text (that is the column /meme reads) and column B gets the name of the person adding it.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { appendRow } = require('../lib/sheets');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addmemetext') // must match the file name (addmemetext.js)
    .setDescription('Add new text for the bot to randomly assign to generated memes.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('text').setDescription('The words that can go on a meme.').setRequired(true).setMaxLength(300)
    ),

  async execute(interaction) {
    const newText = interaction.options.getString('text', true).trim();

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    // Use the person's server nickname if they have one, otherwise their username.
    const authorName = interaction.member?.displayName ?? interaction.user.username;

    await appendRow(sheetIds.memeText, sheetTabs.memeText, [newText, authorName], 'A:B');
    console.log(`😂 New meme text added by ${authorName}: "${newText}"`);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('😂 Meme Text Added Successfully!')
      .setDescription(`**${newText}**`)
      .setFooter({
        text: `Added by ${authorName}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
