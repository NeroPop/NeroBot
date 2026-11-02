// commands/addcat.js
//
// The /addcat command. Adds a cat picture to the cats spreadsheet:
//     /addcat name:Nero link:https://example.com/nero.png
// Column A gets the name and column B gets the picture link.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors, MessageFlags } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { appendRow } = require('../lib/sheets');
const { isWebAddress } = require('../lib/text');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addcat') // must match the file name (addcat.js)
    .setDescription('Add a new cat image to the Google Sheets document.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => option.setName('name').setDescription("The cat's name.").setRequired(true).setMaxLength(100))
    .addStringOption((option) =>
      option.setName('link').setDescription('A link to the picture (starting with http or https).').setRequired(true).setMaxLength(500)
    ),

  async execute(interaction) {
    const catName = interaction.options.getString('name', true).trim();
    const imageLink = interaction.options.getString('link', true).trim();

    // Make sure the link looks like a web address. This reply is private.
    if (!isWebAddress(imageLink)) {
      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle('⚠️ Invalid Image Link')
        .setDescription('Please make sure your image link starts with `http` or `https`.');
      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    await appendRow(sheetIds.cats, sheetTabs.cats, [catName, imageLink], 'A:B');
    console.log(`🐱 Added new cat: ${catName} (${imageLink}) by ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('🐾 Cat Added Successfully!')
      .setDescription(`**${catName}** has been added to the cat gallery!`)
      .setImage(imageLink);

    await interaction.editReply({ embeds: [embed] });
  },
};
