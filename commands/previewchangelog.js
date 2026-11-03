// commands/previewchangelog.js
//
// The /previewchangelog command (owner only). Shows the current announcement exactly as the
// servers would see it, but only to you, so you can check it before sending it.
// The announcement text lives in lib/changelog.js. Use /featureupdatechangelog to send it.

const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { buildChangelogEmbed } = require('../lib/changelog');

module.exports = {
  ownerOnly: true, // only the owner (ownerId in config.js) can use this
  hidden: true, // left off the /features list

  data: new SlashCommandBuilder()
    .setName('previewchangelog') // must match the file name (previewchangelog.js)
    .setDescription('Shows a private preview of the latest changelog (owner only).')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    const embed = buildChangelogEmbed(interaction.client.user.displayAvatarURL());

    // Ephemeral means only the person who used the command can see it.
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
