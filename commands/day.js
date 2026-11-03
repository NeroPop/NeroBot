// commands/day.js
//
// The /day command. Shows the current day, date and time, like:
//     Sunday, 6 October 2025 at 14:37
// The time zone is set in config.js (timezone).

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { timezone } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('day') // must match the file name (day.js)
    .setDescription('Displays the current day, date, and local time.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // How the date and time should be written (24 hour clock, month spelled out).
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    };

    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(new Date());

    await interaction.reply(`🗓️ ${formattedDate}`);
  },
};
