const { EmbedBuilder, Colors } = require("discord.js");

exports.run = (client, message) => {
  const embed = new EmbedBuilder()
    .setTitle("🧾 NeroBot Changelog `05/10/2025`")
    .setDescription(
      "After two years of snoozing, Nero Bot is finally **Back!** 🎉\n\nRefreshed, refactored and now running 24/7* with more personality and fun!"
    )
    .setColor(Colors.Blurple)
    .addFields(
      {
        name: "☁️ Hosting & Reliability",
        value:
          "Migrated over to **Wispbyte**, meaning that now Nero Bot can be online 24/7 with faster responses and no more sleeping comas.\n" +
          "Updated the bot to run on **Node 24** & **Discord.js v14** — improved stability and better features!",
      },
      {
        name: "✨ Nero Bot Personality 2.0!",
        value:
          "NeroBot now has a more consistent voice — chaotic, loving, tea-fuelled cat energy!\n" +
          "Cleaner embeds and improved readability across all commands!",
      },
      {
        name: "🐾 Cats!",
        value:
          "After having the longest cat nap in history, Nero Bot has some feline-related updates:\n" +
          "• `-cat` sends a random cat picture with its name.\n" +
          "• `-catname [name]` fetches a random picture of a specific cat.\n" +
          "• `-addcat [name] [image link]` lets you add your own cats to the mix!",
      },
      {
        name: "💬 Quotes & Prompts",
        value:
          "Nothing like a great quote to keep you inspired!\n" +
          "• `-quote` and `-quoteperson` now show beautiful, readable quotes in large text.\n" +
          "• `-quotelist [name]` now features **PAGES** (the start of a book of quotes?).\n" +
          "• `-addquote [author] [quote]` adds new quotes to the upcoming best seller!\n" +
          "• `-prompt` & `-addprompt [new prompt]` have been updated to look cleaner.",
      },
      {
        name: "😂 Me-me-s",
        value:
          "• `-meme` and `-addmemetext` have now been updated to look even more brainrot.",
      },
      {
        name: "🍪 SNACKS!",
        value:
          "Welcome to the snack zone!\n" +
          "The beloved `-treat` command has been fully updated with new Nero Bot energy.\n" +
          "• Randomised responses and footers in an all-new embed!\n" +
          "• NeroBot will now react to your message to show appreciation.",
      },
      {
        name: "🕓 What day is it?",
        value:
          "Nero Bot's been asleep so long they forgot what day it was!\n" +
          "• `-day` has been updated to reflect the correct time of day!",
      },
      {
        name: "🌍 The Big Picture",
        value:
          "• 30+ commands updated.\n" +
          "• New UX systems and fancy embeds.\n" +
          "• Still powered by Yorkshire Tea! ☕",
      },
      {
        name: "📣 Reminder!",
        value:
          "If you want these announcements to appear in a different channel, go into that channel and run `-botchannel` to set it for future updates!",
      }
    )
    .setFooter({
      text: "NeroBot • Chaotic, loving, tea-fuelled cat energy ☕",
      iconURL: client.user.displayAvatarURL(),
    });

  message.channel.send({ embeds: [embed] });
};