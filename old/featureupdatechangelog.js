const { google } = require("googleapis");
const { EmbedBuilder, Colors } = require("discord.js");

const sheetsAuth = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (function () {
    const raw = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const BEGIN = '-----BEGIN PRIVATE KEY-----';
    const END = '-----END PRIVATE KEY-----';
    const start = raw.indexOf(BEGIN);
    const endIdx = raw.indexOf(END);
    if (start === -1 || endIdx === -1) return raw.trim() + '\n';
    const rawBody = raw.slice(start + BEGIN.length, endIdx);
    const cleanBody = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
    const wrapped = cleanBody.match(/.{1,64}/g).join('\n');
    return `${BEGIN}\n${wrapped}\n${END}\n`;
  })(),
};

exports.run = async (client, message) => {
  const spreadsheetId = "1rPOrOgg0tkK12VuaDSahW-mJ954LM51jVWa0baZ-cNc"; // Google Sheets ID
  const sheets = google.sheets("v4");

  const auth = new google.auth.JWT({
    email: sheetsAuth.client_email,
    key: sheetsAuth.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  try {
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B",
    });

    const values = response.data.values || [];
    if (values.length === 0) {
      return message.channel.send("No server/channel data found in the spreadsheet.");
    }

    // Create changelog embed
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

    let successCount = 0;
    let failedCount = 0;

    for (const row of values) {
      const [serverID, channelID] = row;
      const guild = client.guilds.cache.get(serverID);

      if (!guild) {
        console.warn(`⚠️ Guild not found: ${serverID}`);
        failedCount++;
        continue;
      }

      let targetChannel = null;

      // Try the channel ID from the sheet if available
      if (channelID) {
        targetChannel = guild.channels.cache.get(channelID);
      }

      // If no valid channel found, fall back to the system or first text channel
      if (!targetChannel) {
        targetChannel =
          guild.systemChannel ||
          guild.channels.cache.find(
            (ch) => ch.isTextBased() && ch.permissionsFor(guild.members.me).has("SendMessages")
          );
      }

      if (!targetChannel) {
        console.warn(`⚠️ No valid text channel found in ${guild.name} (${guild.id})`);
        failedCount++;
        continue;
      }

      try {
        await targetChannel.send({ embeds: [embed] });
        console.log(`✅ Sent changelog to ${guild.name} → #${targetChannel.name}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to send to ${guild.name}: ${err.message}`);
        failedCount++;
      }
    }

    console.log(
      `\n📢 Nero Bot changelog summary:\n` +
      `✅ Successfully sent to ${successCount} server(s)\n` +
      `⚠️ Failed to send to ${failedCount} server(s)\n`
    );

    await message.channel.send("✅ Changelog broadcast completed. Check console for summary!");
  } catch (error) {
    console.error("💥 Error accessing Google Sheets:", error);
    message.channel.send("⚠️ An error occurred while reading the spreadsheet.");
  }
};

//Sends the latest Nero Bot changelog to all registered servers via Google Sheets. Falls back to the default channel if none is set.