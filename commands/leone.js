// commands/leone.js
//
// The /leone command. The bot names Leone.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leone') // must match the file name (leone.js)
    .setDescription('Leone.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply('Rollercoaster Expert Extraordinaire Leontine Lacrima');
  },
};
