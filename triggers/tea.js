// triggers/tea.js
//
// A chat trigger. When a message contains the word "tea", the bot replies with a random
// tea quote. To add a quote, add a line to the list below.
// (A message with a 👀 in it also gets a 👀 reaction from triggers/eyes.js. They work separately.)

const { pickRandom } = require('../lib/random');

// Every quote the bot can choose from.
const teaQuotes = [
  'I LOVE TEA GREATLY',
  'TEA IS VERY NICE',
  'EVERYONE LOVES TEA',
  'Tea is a good idea',
  'Tea is good',
  'Time for a cuppa',
  'tea is what gives me a soul',
  'Life is brew-tea-ful with a cup of tea',
  'Sip, sip, hooray! It\'s tea time',
  'You\'re my cup of tea',
  'Te,a-rrific times ahead',
  'Keep calm and drink tea',
  'Tea is the elixir of life',
  'Tea, though ridiculed by those who are naturally coarse in their nervous sensibilities, will always be the favorite beverage of the intellectual',
  'Where there is tea, there is hope',
  'Tea is a religion of the art of life',
  'The first sip is joy, the second is gladness, the third is serenity, the fourth is madness',
  'Tea is to the body as music is to the soul',
  'A cup of tea makes everything better',
  'Take life one sip at a time',
  'When life gives you lemons, add some tea',
  'Tea is a gentle reminder to slow down and savor the moment',
  'The aroma of tea carries stories untold',
  'Tea is a silent conversation, a bridge between minds and hearts',
  'Tea is a gentle healer, soothing both body and mind',
  'Tea, a humble leaf that unfolds a world of possibilities',
  'Tea, an invitation to cherish the present moment',
  'Tea: the magic key to the vault where my brain is kept.',
  'Sereni-tea in a world full of chaos.',
  'Tea is liquid wisdom.',
  'Embrace the cozy side of life with a cup of tea.',
  'Inhale the aroma, exhale the stress - tea makes it all better.',
  'Tea is like a hug in a cup.',
  'Let your worries steep away with a cup of herbal harmony.',
  'Tea time is me time.',
  'Tea is the answer, no matter the question.',
  'Finding calm within the chaos, one tea cup at a time.',
  'Tea: because adulting is hard.',
  'Life is like a cup of tea; it\'s all in how you make it.',
  'Tea is a cup of sunshine on a cloudy day.',
  'Tea is the whisper of leaves, the echo of nature\'s tranquility.',
  'Drown in a sea of tea and let the world float by.',
  'Tea, the balm for the soul\'s wounds.',
  'In the world of ordinary, be extraordinary - drink tea.',
  'Tea is a voyage in a cup.',
  'The art of tea is a slow dance with time.',
  'Tea: where pleasure meets peace.',
  'Tea-riffic moments start with a steep.',
  'Chai some, you\'ll love it!',
  'Tea is a hug in a mug.',
  'Pour yourself a cup of positivi-tea.',
  'Tea: the key to inner peace and tranquili-tea.',
  'Savor the sip, embrace the bliss - tea is pure happiness.',
  'Steeped in love, brewed in joy - every cup tells a story.',
  'Tea: the antidote to a hectic day.',
  'Infuse your day with a dash of tea-liciousness.',
  'Sip by sip, life\'s problems disappear in the warmth of tea.',
  'Tea is like a good friend; always there to lift your spirits.',
  'Chamomile: the calm in the storm of life.',
  'Tea is a conversation starter, a sip is the punctuation.',
  'Warm your hands, warm your heart - tea does both.',
  'Let your worries steep away in the comforting embrace of tea.',
  'Tea is the silent poetry of the morning.',
  'That sounds Tea-rrible',
  'I\'m your perfect matcha',
];

module.exports = {
  // The pattern: does the message contain the whole word "tea" (capital letters do not matter)?
  // \b means "the edge of a word", so words that only contain the letters (team, steak, instead)
  // do not count.
  pattern: /\btea\b/i,

  // Optional examples. "npm run check" tests the pattern against them.
  examples: {
    shouldMatch: ['I love tea', 'TEA time', "Tea's ready", 'a nice cup of Tea please', 'tea!', 'tea 👀'],
    shouldNotMatch: ['steak', 'team meeting', 'instead', 'teacher', 'coffee only', 'hello there'],
  },

  async execute(message) {
    await message.channel.send(pickRandom(teaQuotes));
  },
};
