// commands/botchannel.js
//
// The /botchannel command. Run it in the channel where this server should receive the bot's
// announcements (like the changelog). The choice is saved in the announcement channels
// spreadsheet (config.js: sheetIds.announcementChannels): column A is the server's ID and
// column B is the channel's ID. Run it again in another channel to change it.
//
// Only people with the "Manage Server" permission can use it.

const {
  SlashCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
  EmbedBuilder,
  Colors,
  MessageFlags,
} = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange, appendRow, updateRange } = require('../lib/sheets');
const { createQueue } = require('../lib/taskQueue');

// Changes are saved one at a time, so two people running it together cannot add the server twice.
const runExclusive = createQueue();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botchannel') // must match the file name (botchannel.js)
    .setDescription("Sets the current channel as the bot's announcement channel for this server.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild), // Discord only shows it to people with Manage Server

  async execute(interaction) {
    // Server owners can change who sees a command, so we check the permission here as well.
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      await interaction.reply({ content: 'You need the Manage Server permission to use this command.', flags: MessageFlags.Ephemeral });
      return;
    }

    const serverId = interaction.guild.id;
    const serverName = interaction.guild.name;
    const channelId = interaction.channel.id;

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    await runExclusive(async () => {
      // Column A = server ID, column B = channel ID. Row 1 is the heading, so we start at row 2.
      const rows = await readRange(sheetIds.announcementChannels, sheetTabs.announcementChannels, 'A2:B');
      const index = rows.findIndex((row) => String(row[0]) === serverId);

      if (index !== -1) {
        // This server is already listed, so only change its channel (column B of that row).
        await updateRange(sheetIds.announcementChannels, sheetTabs.announcementChannels, `B${index + 2}`, [[channelId]]);
        console.log(`🔁 Updated bot channel for ${serverName} -> #${interaction.channel.name}`);
      } else {
        // A new server, so add a row at the bottom.
        await appendRow(sheetIds.announcementChannels, sheetTabs.announcementChannels, [serverId, channelId], 'A:B');
        console.log(`➕ Added bot channel for ${serverName} -> #${interaction.channel.name}`);
      }
    });

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('✅ Bot Channel Registered')
      .setDescription(
        `This channel has been successfully set for bot announcements.\n\n**Server:** ${serverName}\n**Channel:** <#${channelId}>`
      )
      .setFooter({ text: 'You can change this anytime by re-running /botchannel.' });

    await interaction.editReply({ embeds: [embed] });
  },
};
