// commands/say.js
//
// The /say command. Makes the bot say something in this channel.
//
// The words are posted as a normal message from the bot (so Discord does not show
// "Someone used /say" above them), and the person who used the command gets a private
// "Sent!" so they know it worked. The bot can ping people but never @everyone or roles.

const { SlashCommandBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say') // must match the file name (say.js)
    .setDescription('Make the bot say something.')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) =>
      option
        .setName('message')
        .setDescription('What should I say?')
        .setRequired(true)
        .setMaxLength(2000) // Discord's limit for one message
    ),

  async execute(interaction) {
    // The bot needs permission to write in this channel. If not, say so privately.
    if (!interaction.appPermissions?.has(PermissionFlagsBits.SendMessages)) {
      await interaction.reply({ content: "I'm not allowed to send messages in this channel.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // the "Sent!" below is private

    await interaction.channel.send({ content: interaction.options.getString('message', true) });

    await interaction.editReply('Sent!');
  },
};
