// config.js
//
// Settings that are NOT secret and may be shared on GitHub.
// (Secrets like the bot token and Google key stay in the .env file on the server.)

module.exports = {
  // The Discord user ID of the bot's owner. Commands marked "ownerOnly" can only be used by
  // this person (in Discord: User Settings > Advanced > Developer Mode on, then right-click
  // your name > Copy User ID).
  ownerId: '150931226767785985',

  // The time zone used for the date and time the bot shows (the /day command).
  timezone: 'Europe/London',

  // The Google Sheets the bot uses. To add a new one for a future feature:
  //   1. Share the spreadsheet with the service account's email (as Editor).
  //   2. Add a line below: a short name, then the sheet's ID.
  //      The ID is the part of the web address between "/d/" and "/edit".
  //   3. In your code, use it like:  readRange(sheetIds.myNewSheet, 'Tab name', 'A2:B')
  sheetIds: {
    cats: '1EQqzfFgTmH2nSAVMtGb07Oa6DZg7j2jbrVxTaWEtl8A', // cat names and picture links
    quotes: '1JPgOfxzj9JSRPwCHIqnc9SgsgA1XhGIkqwxlH5oBFaw', // quotes and who said them
    prompts: '1QgV4SriH4cVSJSvuOWxG6ZeO72UuuT24cb7JBEVa6Ws', // conversation prompts
    memeText: '12n41DpDoEvzMc_ICg0ipEVeeb3rwMb3DGhHkKyH7bJc', // the words used on generated memes
    suggestions: '150Jt9-ddbPWhAisrNA1ITK6KN60mCjw0oPgqR_UWZBg', // feature suggestions
    debts: '1xQio_F4j1deCo1X9vxA_eOsEleGA0V6aJqj1J1edGuM', // who owes Nero money
    reminders: '1z4wWvQxM2teujLyzSBYvbvAvC_uo4DCzdcTRmg1CQLE', // reminders waiting to be sent
    announcementChannels: '1rPOrOgg0tkK12VuaDSahW-mJ954LM51jVWa0baZ-cNc', // where each server gets announcements
  },

  // Settings for the reminders (/reminder, /reminderdm and /reminderlist).
  reminders: {
    // How far ahead a reminder can be set, in days.
    maxAheadDays: 730,

    // How often the bot checks whether a reminder is due, in seconds.
    checkEverySeconds: 15,

    // How often the bot re-reads the reminders spreadsheet, in minutes. This picks up edits made
    // by hand in the sheet. (Reminders made with the commands are noticed straight away.)
    refreshEveryMinutes: 5,

    // If a reminder fails to send (for example Discord had a hiccup), try again after this many
    // minutes, and give up after this many tries in total.
    retryAfterMinutes: 2,
    giveUpAfterTries: 3,
  },

  // The name of the tab (the label at the bottom of the spreadsheet) the bot uses in each sheet.
  // Sheets that were made with Google's defaults use "Sheet1".
  sheetTabs: {
    cats: 'Sheet1',
    quotes: 'Sheet1',
    prompts: 'Sheet1',
    memeText: 'Sheet1',
    suggestions: 'Sheet1',
    announcementChannels: 'Sheet1',
    debtTotals: 'Totals', // one row per person: their name, then the total they owe
    debtInvoices: 'Invoice', // one row per invoice: name, date, reason, amount
    reminders: 'Reminders',
  },
};
