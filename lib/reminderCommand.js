// lib/reminderCommand.js
//
// The shared parts of /reminder and /reminderdm, which differ only in where the reminder goes
// (this channel, or the person's direct messages). Keeping them here means the two commands
// are tiny and can never drift apart.
//
//   addReminderOptions(builder)         adds the three boxes (when, message, timezone) to a command
//   setReminder(interaction, { dm })    does the work when someone uses the command

const { MessageFlags } = require('discord.js');
const { timezone: defaultTimezone, reminders: settings } = require('../config');
const { parseWhen } = require('./parseWhen');
const { resolveTimeZone, DAY } = require('./timeUtils');
const reminders = require('../services/reminders');

// A private reply (only the person who used the command can see it).
function privately(interaction, content) {
  return interaction.reply({ content, flags: MessageFlags.Ephemeral });
}

// A Discord timestamp. Each person sees it in their OWN time zone and language.
//   style "F" shows the day, date and time (Saturday, 7 November 2026 at 19:20),
//   style "R" shows "in 3 months".
function stamp(ms, style) {
  return `<t:${Math.floor(ms / 1000)}:${style}>`;
}

// Shown whenever someone gets the time wrong.
function howToSetTheTime(timeZone) {
  return [
    '**How to set the time** (the `when` box)',
    '• A wait: `30m`, `2h 30m`, `5 minutes`, `2 weeks`, `3 months`.',
    '• A day and a time: `tomorrow 9am`, `friday 6pm`, `sat 19:20`.',
    '• A date and a time: `25 dec 2pm`, `25/12 2pm`, `25/12/2027 14:30`.',
    '• A wait and a time: `2pm in 3 months`, `9am in 2 weeks`.',
    '• Just a time: `7:20pm`, `19:20`, `noon` (the next time the clock reads that).',
    `• Times are read as ${timeZone} time, unless you fill in the \`timezone\` box (for example \`America/New_York\`).`,
    `• A reminder can be at most ${settings.maxAheadDays} days ahead.`,
  ].join('\n');
}

// Adds the three boxes to a command. Call it with the command being built.
function addReminderOptions(builder) {
  return builder
    .addStringOption((option) =>
      option
        .setName('when')
        .setDescription('When? For example 30m, tomorrow 9am, 25 dec 2pm, or 2pm in 3 months.')
        .setRequired(true)
        .setMaxLength(100)
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('What should I remind you about?').setRequired(true).setMaxLength(500)
    )
    .addStringOption((option) =>
      option
        .setName('timezone')
        .setDescription(`Your time zone, like America/New_York. If you leave this out it is ${defaultTimezone}.`)
        .setMaxLength(60)
    );
}

// Sets a reminder. With { dm: true } it is sent to the person's direct messages, otherwise it
// is posted in the channel where the command was used.
async function setReminder(interaction, { dm }) {
  const when = interaction.options.getString('when', true);
  const message = interaction.options.getString('message', true).trim();
  const timezoneText = interaction.options.getString('timezone');

  // Which time zone are the clock times in?
  let timeZone = defaultTimezone;
  if (timezoneText) {
    timeZone = resolveTimeZone(timezoneText);
    if (!timeZone) {
      await privately(
        interaction,
        `I do not know the time zone "${timezoneText}". Use a name like \`Europe/London\` or \`America/New_York\`, or leave the box empty.`
      );
      return;
    }
  }

  // Work out the moment they mean.
  const now = Date.now();
  const result = parseWhen(when, now, timeZone);

  if (result.error === 'format') {
    await privately(interaction, `"${when}" is not a time I understand.\n\n${howToSetTheTime(timeZone)}`);
    return;
  }
  if (result.error === 'past') {
    await privately(interaction, `That moment has already passed. Try a later time, a day name or a wait like \`30m\`.\n\n${howToSetTheTime(timeZone)}`);
    return;
  }
  if (result.atMs - now > settings.maxAheadDays * DAY) {
    await privately(interaction, `That is too far ahead. A reminder can be at most ${settings.maxAheadDays} days ahead.`);
    return;
  }

  await interaction.deferReply(); // saving to the spreadsheet can take a moment

  await reminders.addReminder({
    userId: interaction.user.id,
    timeMs: result.atMs,
    message,
    channelId: dm ? '' : interaction.channelId, // an empty channel means "send a direct message"
  });

  // Show exactly what we understood, so a mistake is easy to spot.
  const where = dm ? "I'll DM you" : "I'll remind you in this channel";
  await interaction.editReply(
    `Reminder set! ${where} on ${stamp(result.atMs, 'F')} (${stamp(result.atMs, 'R')}).\n` +
      `-# Times you type are read as ${timeZone} time.`
  );
}

module.exports = { addReminderOptions, setReminder };
