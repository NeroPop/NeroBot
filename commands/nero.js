// commands/nero.js
//
// The /nero command. The bot names Nero.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nero') // must match the file name (nero.js)
    .setDescription('Sir Lord Nero Poppington.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply('Sir Lord Nero Poppington');
  },
};
