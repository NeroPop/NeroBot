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
  description: 'NeroBot has had a big tidy-up behind the scenes, and it brings some changes you will notice!',

  // The sections of the announcement. Each has a name (a heading) and a value (the text).
  fields: [
    {
      name: '⌨️ Slash commands!',
      value:
        'Everything now works with slash commands. Type `/` in the chat to see what NeroBot can do.\n' +
        'The old `-` commands (like `-cat`) no longer work, so use `/cat` instead.\n' +
        'Use `/features` to see the full list.',
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
