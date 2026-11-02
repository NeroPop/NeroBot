// triggers/eyes.js
//
// A chat trigger. When anyone's message contains the 👀 emoji, the bot reacts with 👀 too.
//
// Needs the bot's "Add Reactions" permission in the channel.

module.exports = {
  // The pattern: does the message contain the 👀 emoji?
  pattern: /👀/,

  // Optional examples. "npm run check" tests the pattern against them.
  examples: {
    shouldMatch: ['👀', 'ooh 👀 look at that'],
    shouldNotMatch: ['no eyes here', 'eyes'],
  },

  async execute(message) {
    await message.react('👀');
  },
};
