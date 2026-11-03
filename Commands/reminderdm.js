// commands/reminderdm.js
//
// The /reminderdm command. Like /reminder, but the bot sends the reminder to you in a direct
// message instead of posting it in the channel:
//     /reminderdm when:1h message:Take your medicine
// See lib/parseWhen.js for everything the "when" box understands.

const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { addReminderOptions, setReminder } = require('../lib/reminderCommand');

module.exports = {
  data: addReminderOptions(
    new SlashCommandBuilder()
      .setName('reminderdm') // must match the file name (reminderdm.js)
      .setDescription('Set a reminder to be sent to you via DM.')
      .setContexts(InteractionContextType.Guild)
  ),

  async execute(interaction) {
    await setReminder(interaction, { dm: true });
  },
};
