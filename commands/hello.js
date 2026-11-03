// commands/hello.js
//
// The /hello command. The bot says hello with a random greeting.
// To add a greeting, add a line to the list below.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { pickRandom } = require('../lib/random');

// Every greeting the bot can choose from.
const greetings = [
  'Hello!',
  'Hi!',
  'Oh my, hello',
  'Hola!',
  'Bonjour',
  'Bore-da',
  'Hi, how are you?',
  'Hello my cheery ol friend',
  'chao',
  'And a good bloody hello to you too',
  'Hello little one',
  'Hello human',
  'H.E.L.L.O',
  'Hell-oh',
  'Hello i am alive yes?',
  'Hellooooooooo    pop',
  'Hi, hope you\'re doing well',
  'pleased to meet you',
  'Hey',
  'What\'s up?',
  'What\'s new?',
  'Long time no see',
  'Hey you',
  'Hello, nice to meet you',
  'Hello there',
  'I am your father',
  'hiiiiiii',
  'Howdy',
  'Hey mate',
  'Hey man',
  'G\'day',
  'Gidday mate',
  'How\'s you?',
  'Hey, is it really you?',
  'Is that you?',
  'Is that seriously you?',
  'Hello stranger!',
  'are you kidding me?',
  'this can\'t be true!',
  'the cake is a lie',
  'I\'ve heard so much about you',
  'Hello and welcome',
  'Dear',
  'Oh my GOD... I did NOT expect to see YOU here...',
  'Sup',
  'Yo',
  'Greetings',
  'Greetings fuckers',
  '*Gives a small nod*',
  'Oi',
  'What\'s going on?',
  'cheers',
  'What do you know?',
  'How\'s this weather?',
  'What\'s up buttercup',
  'How do you do?',
  'What\'s up doc?',
  'What\'s the story?',
  'Alright there?',
  'Morning',
  'How\'s are we',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hello') // must match the file name (hello.js)
    .setDescription('Says hello to the user.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.reply(pickRandom(greetings));
  },
};
