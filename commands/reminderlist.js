// commands/reminderlist.js
//
// The /reminderlist command. Lists your reminders that are still waiting, with the time left.
// The list is private, because reminders (especially DM ones) can be personal.

const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const reminders = require('../services/reminders');
const { shorten } = require('../lib/text');

// A list longer than this many reminders is cut short ("...and 3 more").
const MAX_SHOWN = 15;

// Writes the time left as text like "2d 3h 4m 5s left".
function timeLeft(ms) {
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s left`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reminderlist') // must match the file name (reminderlist.js)
    .setDescription('Lists all pending reminders for the user.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral }); // only the person who asked can see it

    const waiting = await reminders.listFor(interaction.user.id);
    if (waiting.length === 0) {
      await interaction.editReply('You have no pending reminders.');
      return;
    }

    const now = Date.now();
    const lines = waiting.slice(0, MAX_SHOWN).map((reminder) => {
      const left = reminder.timeMs - now;
      const text = shorten(reminder.message, 100);
      return left <= 0 ? `🕒 "${text}" - sending any moment now` : `🕒 "${text}" - ${timeLeft(left)}`;
    });
    if (waiting.length > MAX_SHOWN) lines.push(`...and ${waiting.length - MAX_SHOWN} more.`);

    await interaction.editReply({ content: lines.join('\n'), allowedMentions: { parse: [] } });
  },
};
