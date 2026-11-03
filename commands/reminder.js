// commands/reminder.js
//
// The /reminder command. Sets a reminder that the bot posts in this channel, pinging you:
//     /reminder when:30m message:Check the oven
//     /reminder when:2pm in 3 months message:Book the dentist
//     /reminder when:friday 6pm message:Feed the cats
// See lib/parseWhen.js for everything the "when" box understands, and services/reminders.js
// for how the reminders are saved and sent.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { addReminderOptions, setReminder } = require('../lib/reminderCommand');

module.exports = {
  data: addReminderOptions(
    new SlashCommandBuilder()
      .setName('reminder') // must match the file name (reminder.js)
      .setDescription('Set a reminder for a future time. It is posted in this channel.')
      .setContexts(InteractionContextType.Guild)
  ),

  async execute(interaction) {
    await setReminder(interaction, { dm: false });
  },
};
