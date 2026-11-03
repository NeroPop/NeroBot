// commands/features.js
//
// The /features command. Shows every command the bot has and what it does, in pages with
// Back and Next buttons.
//
// The list builds ITSELF from the files in the commands folder, so a new command appears here
// automatically, using its description. To keep a command off the list (for example an
// owner-only one), add this line to its file:   hidden: true,

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sendPages } = require('../lib/paginate');

// How many commands to show on each page. (Discord allows up to 25 on one embed.)
const COMMANDS_PER_PAGE = 15;

// Writes how a command is typed, like "/addcat [name] [link]".
function usageOf(commandJson) {
  const options = (commandJson.options ?? []).filter((option) => option.type > 2); // skip subcommands (types 1 and 2)
  const optionText = options.map((option) => ` [${option.name}]`).join('');
  return `/${commandJson.name}${optionText}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('features') // must match the file name (features.js)
    .setDescription('Shows all features and what they do.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    // Every command except the hidden ones, in alphabetical order.
    const shown = interaction.client.commands
      .filter((command) => !command.hidden)
      .map((command) => command.data.toJSON())
      .sort((a, b) => a.name.localeCompare(b.name));

    // Cut the list into pages.
    const pageCount = Math.max(1, Math.ceil(shown.length / COMMANDS_PER_PAGE));
    const pages = [];

    for (let pageNumber = 0; pageNumber < pageCount; pageNumber++) {
      const commandsOnPage = shown.slice(pageNumber * COMMANDS_PER_PAGE, (pageNumber + 1) * COMMANDS_PER_PAGE);

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple) // the same blue-purple on every page
        .setTitle(`🧠 Nero Bot Features - Page ${pageNumber + 1}`)
        .addFields(commandsOnPage.map((command) => ({ name: usageOf(command), value: command.description })))
        .setFooter({ text: `Page ${pageNumber + 1} of ${pageCount} - Nero Bot • Feature Overview` });

      // Only the first page has the introduction.
      if (pageNumber === 0) embed.setDescription('Here are some of the features of this bot and what they do:');

      pages.push(embed);
    }

    await sendPages(interaction, pages);
  },
};
