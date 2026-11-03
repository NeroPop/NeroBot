// commands/rate.js
//
// The /rate command. Rates anything out of 10.
// Anything that mentions tea, nero, leone, leontine or jack always gets 11/10.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate') // must match the file name (rate.js)
    .setDescription('Rates something.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option.setName('item').setDescription('What should I rate?').setRequired(true)
    ),

  async execute(interaction) {
    const toRate = interaction.options.getString('item', true);

    // Check if the text includes one of the special words.
    const includesSpecialWords = /tea|nero|leone|leontine|jack/i.test(toRate);

    // Generate a rating.
    const rating = includesSpecialWords ? '11/10' : Math.floor(Math.random() * 10) + '/10';

    await interaction.reply(`I rate ${toRate} ${rating}.`);
  },
};
