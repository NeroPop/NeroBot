// commands/portfolio.js
//
// The /portfolio command. Shows Jack Myrick's portfolio as a card with a picture and a button
// that opens the website. The picture is images/Nero_Knight.png.

const path = require('node:path');
const {
  SlashCommandBuilder,
  InteractionContextType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
} = require('discord.js');

// Settings you might want to change.
const WEBSITE = 'https://www.jackmyrick.design';
const IMAGE_PATH = path.join(__dirname, '..', 'images', 'Nero_Knight.png');
const IMAGE_NAME = 'Nero_Knight.png';

module.exports = {
  // scripts/check.js looks for this to make sure the picture is in the project.
  imagePath: IMAGE_PATH,

  data: new SlashCommandBuilder()
    .setName('portfolio') // must match the file name (portfolio.js)
    .setDescription("Displays Jack Myrick's portfolio.")
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('Jack Myrick Portfolio')
      .setDescription('Explore Jack Myrick’s work and projects.')
      .setColor('#fb9500')
      .setURL(WEBSITE)
      .setImage(`attachment://${IMAGE_NAME}`); // "attachment://" means: use the file we send below

    // A link button that opens the website.
    const button = new ButtonBuilder().setLabel('View Portfolio').setStyle(ButtonStyle.Link).setURL(WEBSITE);
    const row = new ActionRowBuilder().addComponents(button);

    await interaction.reply({
      embeds: [embed],
      components: [row],
      files: [new AttachmentBuilder(IMAGE_PATH, { name: IMAGE_NAME })],
    });
  },
};
