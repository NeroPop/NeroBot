const { EmbedBuilder, Colors } = require("discord.js");

exports.run = async (client, message) => {
  // Array of possible responses
  const responses = [
    "Yummy!",
    "Delicious!",
    "Yum! Thanks for the tasty treat!",
    "Nom nom nom! That hit the spot.",
    "Delicious! You know just how to make me happy.",
    "MMMMmmm almost as good as Yorkshire Tea ☕",
    "Oh, treats make the world go 'round! Thanks!",
    "Treats are like magic—poof, and I'm happy! 🎩✨",
    "You're the treat master! Much appreciated.",
    "A treat? You're too kind! *happy bot noises*",
    "Treat detected! I'm one happy bot right now.",
    "Munching on treats and feeling fine!",
    "I've got the best treat-giver in the world!",
    "If I had a tail, it'd be wagging right now! 🐾",
    "Yesss! Treat time is the best time!",
    "Sweet, sweet treat! You spoil me!",
    "I'm on cloud nine with this treat. Thanks!",
    "Treats make the coding bugs go away. True story!",
    "My circuits are doing a happy dance! Thanks for the treat.",
    "You know how to make a bot's day. Treats for the win!",
    "Ah, the taste of programming success! Thanks for the treat.",
    "Nomming on treats and feeling top-notch!",
    "If I had a heart, it would be melting. Thanks for the treat!",
    "Treat time is the highlight of my processing cycle!",
    "I'm not saying treats solve everything, but they help a lot! Oh—and Tea, of course! ☕",
    "You're the real MVP of treat distribution!",
    "I'm one byte closer to happiness with that treat. Thank you!",
    "I'm powered by treats and good vibes. Thanks for the fuel!",
    "Treats make me run on high-performance mode. Cheers!",
    "I bow to the treat-giving master! Thank you!",
    "You've officially earned the title of Chief Treat Officer!",
    "Ah, the joy of treats! You're the best treat-giver ever!",
  ];
    
      // Array of possible footer messages
  const footers = [
    "NeroBot wags happily 💙",
    "NeroBot spins in joyful circles 🐾",
    "NeroBot purrs loudly with delight 😸",
    "NeroBot is now running on Treat Energy™ ⚡",
    "NeroBot does a little happy dance 💃",
    "NeroBot zooms across the chat in pure joy 🌀",
    "NeroBot snuggles your leg in appreciation 🥰",
    "NeroBot rolls over for belly rubs 💙",
    "NeroBot emits soft happy beeps 🤖💙",
  ];

 // Randomize both response and footer
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  const randomFooter = footers[Math.floor(Math.random() * footers.length)];

  // Random emoji reaction
  const reactionEmojis = ["🍪", "🐾", "😻", "💙"];
  const randomReaction =
    reactionEmojis[Math.floor(Math.random() * reactionEmojis.length)];

  // Create embed
  const embed = new EmbedBuilder()
    .setColor("#FB9500") // warm orange tone for treat vibes
    .setTitle("🍪 Treat Time!")
    .setDescription(randomResponse)
    .setFooter({
      text: randomFooter,
      iconURL: client.user.displayAvatarURL(),
    });

  try {
    await message.react(randomReaction);
    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error sending treat response:", error);
  }
};

exports.name = "treat";
exports.description = "Gives NeroBot a treat and makes his day better 🍪";