// commands/prompt.js
//
// The /prompt command. Shows a random conversation prompt and credits the person who
// suggested it. The prompts live in the prompts spreadsheet: column A is who suggested it,
// column B is the prompt (config.js: sheetIds.prompts). Use /addprompt to add more.

const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, Colors } = require('discord.js');
const { sheetIds, sheetTabs } = require('../config');
const { readRange } = require('../lib/sheets');
const { pickRandom } = require('../lib/random');
const { shorten } = require('../lib/text');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('prompt') // must match the file name (prompt.js)
    .setDescription('Reads a random prompt and credits the person who suggested it.')
    .setContexts(InteractionContextType.Guild),

  async execute(interaction) {
    await interaction.deferReply(); // reading the spreadsheet can take a moment

    // Column A = who suggested it, column B = the prompt.
    const rows = await readRange(sheetIds.prompts, sheetTabs.prompts, 'A2:B');
    if (rows.length === 0) {
      await interaction.editReply('📋 No prompts found in the database yet!');
      return;
    }

    // Skip rows where the name or the prompt is missing.
    const validPrompts = rows.filter((row) => row[0] && row[1]);
    if (validPrompts.length === 0) {
      await interaction.editReply('📭 No valid prompts available.');
      return;
    }

    const [author, promptText] = pickRandom(validPrompts);

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle('💡 Random Prompt')
      .addFields({
        name: '​', // an invisible title, for spacing
        value: `**${shorten(promptText, 1000)}**`,
      })
      .setFooter({
        text: `Suggested by ${shorten(author, 100)}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      });

    await interaction.editReply({ embeds: [embed] });
  },
};
