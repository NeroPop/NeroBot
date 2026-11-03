// commands/featureupdatechangelog.js
//
// The /featureupdatechangelog command (owner only). Sends the latest announcement to EVERY
// server that has the bot. The announcement text lives in lib/changelog.js; use
// /previewchangelog first to read it.
//
// Where each server gets it:
//   1. The channel chosen with /botchannel (saved in the announcement channels spreadsheet).
//   2. If none was chosen, the server's system channel.
//   3. If it has none, the first text channel the bot is allowed to write in.
//
// As a safety net it refuses to send while the announcement has no date, because that means
// it is still a draft.

const { SlashCommandBuilder, InteractionContextType, ChannelType, MessageFlags, PermissionFlagsBits } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { changelog, buildChangelogEmbed } = require('../lib/changelog');

// Works out which channel in a server should get the announcement. Returns null if there is none.
async function findChannel(guild, channelId) {
  // The channel chosen with /botchannel, if it still exists.
  if (channelId) {
    const chosen = guild.channels.cache.get(channelId);
    if (chosen) return chosen;
  }

  // Otherwise the system channel, then the first text channel the bot may write in.
  if (guild.systemChannel) return guild.systemChannel;

  const me = guild.members.me ?? (await guild.members.fetchMe());
  return (
    guild.channels.cache.find(
      (channel) => channel.type === ChannelType.GuildText && channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)
    ) ?? null
  );
}

module.exports = {
  ownerOnly: true, // only the owner (ownerId in config.js) can use this
  hidden: true, // left off the /features list

  data: new SlashCommandBuilder()
    .setName('featureupdatechangelog') // must match the file name (featureupdatechangelog.js)
    .setDescription('Sends the latest changelog to every server (owner only).')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // Do not broadcast a draft.
    if (!changelog.date) {
      await interaction.reply({
        content: 'The changelog has no date yet, so it still looks like a draft. Set `date` in lib/changelog.js, restart the bot, and try again.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // sending to every server takes a while

    // Column A = server ID, column B = channel ID (can be empty). Row 1 is the heading.
    const rows = await readRange(sheetIds.announcementChannels, sheetTabs.announcementChannels, 'A2:B');
    if (rows.length === 0) {
      await interaction.editReply('No servers are listed in the announcement channels spreadsheet.');
      return;
    }

    const embed = buildChangelogEmbed(interaction.client.user.displayAvatarURL());
    const alreadySent = new Set(); // so a server listed twice is not sent to twice
    let successCount = 0;
    let failedCount = 0;

    for (const [serverId, channelId] of rows) {
      if (!serverId || alreadySent.has(serverId)) continue;
      alreadySent.add(serverId);

      // One server failing must never stop the others.
      try {
        const guild = interaction.client.guilds.cache.get(serverId);
        if (!guild) {
          console.warn(`⚠️ Guild not found: ${serverId}`);
          failedCount++;
          continue;
        }

        const targetChannel = await findChannel(guild, channelId);
        if (!targetChannel) {
          console.warn(`⚠️ No valid text channel found in ${guild.name} (${guild.id})`);
          failedCount++;
          continue;
        }

        await targetChannel.send({ embeds: [embed] });
        console.log(`✅ Sent changelog to ${guild.name} -> #${targetChannel.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to send the changelog to server ${serverId}: ${error.message}`);
        failedCount++;
      }
    }

    console.log(`📢 Changelog summary: sent to ${successCount} server(s), failed for ${failedCount}.`);
    await interaction.editReply(`✅ Changelog broadcast finished. Sent to ${successCount} server(s), failed for ${failedCount}. Check the console for details.`);
  },
};
