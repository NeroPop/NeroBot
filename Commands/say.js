// commands/say.js
//
// The /say command. Makes the bot say something.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say') // must match the file name (say.js)
    .setDescription('Make the bot say something.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('What should I say?')
        .setRequired(true)
        .setMaxLength(2000) // Discord's limit for one message
    ),

  async execute(interaction) {
    await interaction.reply({ content: interaction.options.getString('message', true) });
  },
};
