// commands/rate.js
//
// The /rate command. Rates anything out of 10.
// Anything that mentions tea, nero, leone, leontine or jack always gets 11/10.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { randomInt } = require('../lib/random');

// The special words that always get 11/10. \b means "the edge of a word", so "tea" counts but
// "steak" and "team" do not.
const SPECIAL_WORDS = /\b(tea|nero|leone|leontine|jack)\b/i;

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

    // Check if the text includes one of the special words (as a whole word).
    const includesSpecialWords = SPECIAL_WORDS.test(toRate);

    // Generate a rating: special words get 11/10, anything else gets 0 to 10 out of 10.
    const rating = includesSpecialWords ? '11/10' : `${randomInt(0, 10)}/10`;

    await interaction.reply(`I rate ${toRate} ${rating}.`);
  },
};
