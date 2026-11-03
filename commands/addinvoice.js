// commands/addinvoice.js
//
// The /addinvoice command (owner only). Records that someone owes Nero money:
//     /addinvoice name:Sam amount:12.50 reason:Cat treats
//
// It uses the debts spreadsheet (config.js: sheetIds.debts), which has two tabs:
//   Totals   column A holds each person's name once. (Column B adds up what they owe, in the sheet.)
//   Invoice  one row per invoice: name, date, reason, amount.
// If the person is not in the Totals tab yet, their name is added there first.
// Capital letters do not matter when matching a name, so "sam" finds "Sam".

const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { sheetIds, sheetTabs, timezone } = require('../config');
const { readRange, updateRange } = require('../lib/sheets');
const { createQueue } = require('../lib/taskQueue');

// Invoices are saved one at a time, so two at once can never pick the same empty row.
const runExclusive = createQueue();

module.exports = {
  ownerOnly: true, // only the owner (ownerId in config.js) can use this
  hidden: true, // left off the /features list

  data: new SlashCommandBuilder()
    .setName('addinvoice') // must match the file name (addinvoice.js)
    .setDescription('Add an invoice to the spreadsheet (owner only).')
    .setContexts(InteractionContextType.Guild)
    .addStringOption((option) => option.setName('name').setDescription('Who owes the money?').setRequired(true).setMaxLength(100))
    .addStringOption((option) =>
      option.setName('amount').setDescription('How much, for example 12.50 or £12.50.').setRequired(true).setMaxLength(20)
    )
    .addStringOption((option) => option.setName('reason').setDescription('What is it for?').setRequired(true).setMaxLength(200)),

  async execute(interaction) {
    const name = interaction.options.getString('name', true).trim();
    const reason = interaction.options.getString('reason', true).trim();

    // Remove everything except digits, a minus sign and a point, so "£12.50" becomes 12.50.
    const amount = parseFloat(interaction.options.getString('amount', true).replace(/[^-0-9.]/g, ''));

    // This reply is private.
    if (!Number.isFinite(amount)) {
      await interaction.reply({ content: 'Please give the amount as a number, like `12.50` or `£12.50`.', flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply(); // saving to the spreadsheet can take a moment

    // The date as dd/mm/yyyy, in the time zone from config.js.
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: timezone });

    const newNameAdded = await runExclusive(async () => {
      // Is this person already in the Totals tab?
      const totals = await readRange(sheetIds.debts, sheetTabs.debtTotals, 'A:A');
      const existing = totals.find((row) => row[0] && String(row[0]).toLowerCase() === name.toLowerCase());

      // If not, add their name in the first empty row of column A.
      if (!existing) {
        await updateRange(sheetIds.debts, sheetTabs.debtTotals, `A${totals.length + 1}`, [[name]]);
      }

      // Use the spelling already in the sheet, so the totals add up under one name.
      const invoiceName = existing ? existing[0] : name;

      // Add the invoice in the first empty row of the Invoice tab.
      const invoices = await readRange(sheetIds.debts, sheetTabs.debtInvoices, 'A:A');
      const row = invoices.length + 1;
      await updateRange(sheetIds.debts, sheetTabs.debtInvoices, `A${row}:D${row}`, [[invoiceName, date, reason, amount]]);

      return !existing;
    });

    await interaction.editReply(`${newNameAdded ? 'New name added successfully.\n' : ''}Invoice added successfully.`);
  },
};
