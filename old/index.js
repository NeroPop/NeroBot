require("dotenv").config();
const { Client, GatewayIntentBits, Partials, Collection } = require("discord.js");
const fs = require("fs");
const { startReminderScheduler } = require("./reminderScheduler");

// Express app for uptime (keep it if needed)
const express = require("express");
const app = express();
app.listen(3000, () => console.log("Project is running!"));
app.get("/", (req, res) => res.send("Hello world!"));

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  allowedMentions: { parse: ["users"] },
});

const prefix = "-";
client.commands = new Collection();

// Load command files
const commands = fs.readdirSync("./Commands").filter(file => file.endsWith(".js"));
for (const file of commands) {
  const commandName = file.split(".")[0];
  const command = require(`./Commands/${commandName}`);
  client.commands.set(commandName, command);
}

// Message handler
client.on("messageCreate", (message) => {
  const senderID = message.author.id;
  const botID = client.user?.id;

  if (senderID === botID || message.author.bot) return;

  if (message.content.startsWith("- ")) return;

  if (message.content.startsWith(prefix)) {
    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);

    if (!command) {
      message.channel.send({ content: "That command doesn't exist!" });
    } else if (args.join(" ").length > 1900) {
      message.channel.send({ content: "Error: message too long (2000 char limit)." });
    } else {
      command.run(client, message, args);
    }
  } else if (message.content.includes("👀")) {
    message.react("👀");
  } else if (message.content.toLowerCase().includes("tea")) {
    const teaQuotes = [
        "I LOVE TEA GREATLY",
        "TEA IS VERY NICE",
        "EVERYONE LOVES TEA",
        "Tea is a good idea",
        "Tea is good",
        "Time for a cuppa",
        "tea is what gives me a soul",
        "Life is brew-tea-ful with a cup of tea",
        "Sip, sip, hooray! It's tea time",
        "You're my cup of tea",
        "Te,a-rrific times ahead",
        "Keep calm and drink tea",
        "Tea is the elixir of life",
        "Tea, though ridiculed by those who are naturally coarse in their nervous sensibilities, will always be the favorite beverage of the intellectual",
        "Where there is tea, there is hope",
        "Tea is a religion of the art of life",
        "The first sip is joy, the second is gladness, the third is serenity, the fourth is madness",
        "Tea is to the body as music is to the soul",
        "A cup of tea makes everything better",
        "Take life one sip at a time",
        "When life gives you lemons, add some tea",
        "Tea is a gentle reminder to slow down and savor the moment",
        "The aroma of tea carries stories untold",
        "Tea is a silent conversation, a bridge between minds and hearts",
        "Tea is a gentle healer, soothing both body and mind",
        "Tea, a humble leaf that unfolds a world of possibilities",
        "Tea, an invitation to cherish the present moment",
        "Tea: the magic key to the vault where my brain is kept.",
        "Sereni-tea in a world full of chaos.",
        "Tea is liquid wisdom.",
        "Embrace the cozy side of life with a cup of tea.",
        "Inhale the aroma, exhale the stress—tea makes it all better.",
        "Tea is like a hug in a cup.",
        "Let your worries steep away with a cup of herbal harmony.",
        "Tea time is me time.",
        "Tea is the answer, no matter the question.",
        "Finding calm within the chaos, one tea cup at a time.",
        "Tea: because adulting is hard.",
        "Life is like a cup of tea; it's all in how you make it.",
        "Tea is a cup of sunshine on a cloudy day.",
        "Tea is the whisper of leaves, the echo of nature's tranquility.",
        "Drown in a sea of tea and let the world float by.",
        "Tea, the balm for the soul's wounds.",
        "In the world of ordinary, be extraordinary—drink tea.",
        "Tea is a voyage in a cup.",
        "The art of tea is a slow dance with time.",
        "Tea: where pleasure meets peace.",
        "Tea-riffic moments start with a steep.",
        "Chai some, you'll love it!",
        "Tea is a hug in a mug.",
        "Pour yourself a cup of positivi-tea.",
        "Tea: the key to inner peace and tranquili-tea.",
        "Savor the sip, embrace the bliss—tea is pure happiness.",
        "Steeped in love, brewed in joy—every cup tells a story.",
        "Tea: the antidote to a hectic day.",
        "Infuse your day with a dash of tea-liciousness.",
        "Sip by sip, life's problems disappear in the warmth of tea.",
        "Tea is like a good friend; always there to lift your spirits.",
        "Chamomile: the calm in the storm of life.",
        "Tea is a conversation starter, a sip is the punctuation.",
        "Warm your hands, warm your heart—tea does both.",
        "Let your worries steep away in the comforting embrace of tea.",
        "Tea is the silent poetry of the morning.",
        "That sounds Tea-rrible",
        "I'm your perfect matcha",
    ];
    const random = teaQuotes[Math.floor(Math.random() * teaQuotes.length)];
    message.channel.send(random);
  }
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  startReminderScheduler(client);
});

// Login
client.login(process.env.TOKEN);