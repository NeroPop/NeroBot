// lib/changelog.js
//
// The text of the latest NeroBot announcement. It lives in ONE place, and two commands use it:
//   /previewchangelog          shows it to the owner only, so you can read it before sending
//   /featureupdatechangelog    sends it to every server's announcement channel
//
// HOW TO USE THIS FILE
//   - When you add or change something people will notice, add a line to the right field below.
//   - Only write things that members of a server can see. Internal tidying is not worth mentioning.
//   - Before you announce, set "date" to today's date (like '02/11/2026') and run /previewchangelog.
//   - When a NEW announcement is due, replace the fields below with the new news.
//
// Discord's limits for an embed: the title can be 256 characters, each field name 256, each field
// value 1024, there can be 25 fields, and everything together must stay under 6000.
// "npm run check" tests all of these for you.

const { EmbedBuilder, Colors } = require('discord.js');

const changelog = {
  // The date this announcement was written. Leave it empty while it is still a draft.
  date: '',

  // The short paragraph under the title.
  description: "Another year, another big Nero bot Refresh! This time there's lots of tidying up behind the scenes and some nice improvements!",

  // The sections of the announcement. Each has a name (a heading) and a value (the text).
  fields: [
    {
      name: '⌨️ Slash commands!',
      value:
        'Everything now works with slash commands. Type `/` in the chat to see what NeroBot can do.\n' +
        'The old `-` commands (like `-cat`) no longer work, so use `/cat` instead.\n' +
        'Use `/features` to see the full list.',
    },
    {
      name: '📖 A help list that stays up to date',
      value:
        '`/features` shows every command and what it does, with Back and Next buttons.\n' +
        'It builds itself, so new commands appear there automatically.',
    },
    {
      name: '🐾 Cats, 💬 quotes and 💡 prompts',
      value:
        '• `/cat`, `/catname` and `/catlist` show your favourite cats. `/addcat` adds new ones.\n' +
        '• `/quote`, `/quoteperson` and `/quotelist` (with pages) share quotes. `/addquote` now accepts authors with more than one word, like Mary Shelley.\n' +
        '• `/prompt` and `/addprompt` get the conversation going.\n' +
        '• `/meme` and `/addmemetext` make the memes.\n' +
        '• `/suggestion` sends ideas for new features.',
    },
    {
      name: '⏰ Much easier reminders',
      value:
        'Tell `/reminder` (posts in the channel) or `/reminderdm` (sends you a DM) when, in your own words:\n' +
        '• `30m`, `2h 30m`, `2 weeks`\n' +
        '• `tomorrow 9am`, `friday 6pm`, `25 dec 2pm`\n' +
        '• `2pm in 3 months`\n' +
        'The bot shows you the exact date it understood. Reminders can be up to 2 years ahead, and `/reminderlist` shows what is waiting.',
    },
    {
      name: '🍪 Little improvements',
      value:
        '• `/rate` can now give a perfect 10/10, and only whole words like tea get 11/10 (no more 11/10 for steak!).\n' +
        '• NeroBot only chats about tea when you say the actual word "tea".\n' +
        '• The 👀 and tea replies now work together.\n' +
        '• `/treat` still gets a happy reaction, and `/say` posts as a normal NeroBot message.',
    },
    {
      name: '📣 Announcements',
      value: 'Run `/botchannel` in the channel where you want announcements like this one (you need the Manage Server permission).',
    },
  ],
};

// Builds the announcement as a Discord embed (a formatted card).
// "iconURL" is the picture shown in the footer, normally the bot's own avatar.
function buildChangelogEmbed(iconURL) {
  const title = changelog.date ? `🧾 NeroBot Changelog \`${changelog.date}\`` : '🧾 NeroBot Changelog';

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(changelog.description)
    .setColor(Colors.Blurple)
    .addFields(changelog.fields)
    .setFooter({ text: 'NeroBot • Chaotic, loving, tea-fuelled cat energy ☕', iconURL });
}

module.exports = { changelog, buildChangelogEmbed };
