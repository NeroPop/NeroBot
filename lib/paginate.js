// lib/paginate.js
//
// Shows a list of pages (Discord embeds) with "Back" and "Next" buttons underneath.
// Used by /features and /quotelist.
//
//   await sendPages(interaction, [embedOne, embedTwo, embedThree]);
//
// - Only the person who used the command can press the buttons.
// - The buttons stop working after 2 minutes (they grey out).
// - With only one page there are no buttons at all.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// "pages" is a list of EmbedBuilder objects.
// "options" can change the button labels and how long the buttons work (in seconds).
async function sendPages(interaction, pages, options = {}) {
  const backLabel = options.backLabel ?? '◀️ Back';
  const nextLabel = options.nextLabel ?? 'Next ▶️';
  const seconds = options.seconds ?? 120;

  // One page needs no buttons.
  if (pages.length === 1) {
    await interaction.reply({ embeds: [pages[0]] });
    return;
  }

  let currentPage = 0;

  // Builds the row of two buttons. Back is greyed out on the first page, Next on the last.
  // Pass true to grey out both (used when the time runs out).
  const buildButtons = (disableBoth) =>
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel(backLabel)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disableBoth || currentPage === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel(nextLabel)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disableBoth || currentPage === pages.length - 1)
    );

  // Send the first page with its buttons.
  await interaction.reply({ embeds: [pages[currentPage]], components: [buildButtons(false)] });
  const sentMessage = await interaction.fetchReply();

  // Listen for button presses from the person who used the command.
  const collector = sentMessage.createMessageComponentCollector({
    filter: (buttonPress) => buttonPress.user.id === interaction.user.id,
    time: seconds * 1000,
  });

  collector.on('collect', async (buttonPress) => {
    try {
      if (buttonPress.customId === 'next') currentPage = Math.min(currentPage + 1, pages.length - 1);
      if (buttonPress.customId === 'prev') currentPage = Math.max(currentPage - 1, 0);

      await buttonPress.update({ embeds: [pages[currentPage]], components: [buildButtons(false)] });
    } catch (error) {
      // A failed button press must never crash the bot. Log it and carry on.
      console.error('Error in the page buttons (lib/paginate.js):', error);
    }
  });

  // When the time runs out, grey out the buttons so nobody presses them in vain.
  collector.on('end', async () => {
    try {
      await interaction.editReply({ components: [buildButtons(true)] });
    } catch (error) {
      console.error('Could not grey out the page buttons (lib/paginate.js):', error.message);
    }
  });
}

module.exports = { sendPages };
