// scripts/check.js
//
// A safety check you run on your PC BEFORE pushing to GitHub:
//
//     npm run check
//
// It does NOT connect to Discord and does NOT need your token. It only makes sure that:
//   - every file in "commands", "triggers" and "services" is written correctly,
//   - each trigger pattern passes its own example messages,
//   - the settings in config.js make sense,
//   - the changelog fits inside Discord's limits,
//   - the project follows the house rules (secrets ignored by git, no em-dashes).
// If anything is wrong it explains what and exits with an error, so you can fix it before
// the bot restarts.

const fs = require('node:fs');
const path = require('node:path');
const { loadCommands, loadTriggers, loadServices } = require('../lib/loadFiles');

// The main project folder (one level up from this scripts folder).
const projectFolder = path.join(__dirname, '..');

// Counts problems so we can report them all at the end.
let problems = 0;

// Prints a failure and counts it.
function fail(message) {
  problems++;
  console.error(`FAIL  ${message}`);
}

// ---- Check the slash commands --------------------------------------------
try {
  const commands = loadCommands(); // throws a clear error if a file is written wrongly

  for (const command of commands) {
    // toJSON() is what we send to Discord. It throws if the command is invalid
    // (for example a name with capital letters or a description that is too long).
    const json = command.data.toJSON();

    // Every command must work in servers only (context 0). Direct messages never worked for this bot.
    if (!Array.isArray(json.contexts) || json.contexts.length !== 1 || json.contexts[0] !== 0) {
      fail(`command /${json.name}: add .setContexts(InteractionContextType.Guild) so it works in servers only.`);
    }

    // A command can list the picture it uses (imagePath). A missing picture is a reminder to
    // commit it, not a failure, because the command still works without it.
    if (command.imagePath) {
      const present = fs.existsSync(command.imagePath);
      console.log(present ? `OK  picture  /${json.name} has its picture` : `NOTE  /${json.name} picture not found at ${command.imagePath}`);
    }

    const tags = [command.ownerOnly ? 'owner only' : '', command.hidden ? 'hidden from /features' : ''].filter(Boolean);
    console.log(`OK  command  /${json.name}${tags.length > 0 ? `   (${tags.join(', ')})` : ''}`);
  }
} catch (error) {
  fail(`commands: ${error.message}`);
}

// ---- Check the chat triggers ---------------------------------------------
try {
  const triggers = loadTriggers(); // throws a clear error if a file is written wrongly

  for (const trigger of triggers) {
    const examples = trigger.examples || {};

    // Every "shouldMatch" example must match the pattern.
    for (const text of examples.shouldMatch || []) {
      if (!trigger.pattern.test(text)) fail(`trigger ${trigger.name}: should match "${text}" but did not`);
    }

    // Every "shouldNotMatch" example must NOT match the pattern.
    for (const text of examples.shouldNotMatch || []) {
      if (trigger.pattern.test(text)) fail(`trigger ${trigger.name}: should NOT match "${text}" but did`);
    }

    console.log(`OK  trigger  ${trigger.name}`);
  }
} catch (error) {
  fail(`triggers: ${error.message}`);
}

// ---- Check the background services ---------------------------------------
try {
  for (const service of loadServices()) {
    console.log(`OK  service  ${service.name}`);
  }
} catch (error) {
  fail(`services: ${error.message}`);
}

// ---- Check the settings in config.js -------------------------------------
try {
  const config = require('../config');

  // The owner ID is a long number (a Discord "snowflake").
  if (!/^\d{15,25}$/.test(config.ownerId)) {
    fail('config: ownerId must be a Discord user ID (a number about 18 digits long), written in quote marks.');
  }

  // Every sheet ID should look like a Google spreadsheet ID: letters, numbers, - and _, about 44 long.
  for (const [name, id] of Object.entries(config.sheetIds)) {
    if (!/^[A-Za-z0-9_-]{30,60}$/.test(id)) fail(`config: sheetIds.${name} does not look like a Google spreadsheet ID.`);
  }

  // Every tab name must be some text.
  for (const [name, tab] of Object.entries(config.sheetTabs)) {
    if (typeof tab !== 'string' || tab.trim() === '') fail(`config: sheetTabs.${name} must be the name of a tab.`);
  }

  // The time zone must be one the computer knows.
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: config.timezone });
  } catch {
    fail(`config: timezone "${config.timezone}" is not a real time zone name (for example Europe/London).`);
  }

  console.log('OK  config   settings in config.js');
} catch (error) {
  fail(`config: ${error.message}`);
}

// ---- Check the changelog fits inside Discord's limits --------------------
try {
  const { changelog, buildChangelogEmbed } = require('../lib/changelog');
  const embed = buildChangelogEmbed('https://example.com/icon.png').toJSON();

  if ((embed.title || '').length > 256) fail('changelog: the title is longer than 256 characters.');
  if ((embed.description || '').length > 4096) fail('changelog: the description is longer than 4096 characters.');
  if ((embed.fields || []).length > 25) fail('changelog: there can be at most 25 fields.');

  let total = (embed.title || '').length + (embed.description || '').length + (embed.footer?.text || '').length;
  for (const field of embed.fields || []) {
    if (field.name.length > 256) fail(`changelog: the field name "${field.name}" is longer than 256 characters.`);
    if (field.value.length > 1024) fail(`changelog: the field "${field.name}" is longer than 1024 characters.`);
    total += field.name.length + field.value.length;
  }
  if (total > 6000) fail(`changelog: everything together is ${total} characters, and Discord allows 6000.`);

  console.log(
    changelog.date
      ? 'OK  changelog fits inside Discord\'s limits'
      : 'NOTE  changelog has no date yet (fine while it is a draft). Set "date" in lib/changelog.js before announcing.'
  );
} catch (error) {
  fail(`changelog: ${error.message}`);
}

// ---- Check the project follows the house rules ---------------------------
try {
  // The .gitignore must keep the secrets and the packages out of GitHub.
  const gitignore = fs.readFileSync(path.join(projectFolder, '.gitignore'), 'utf8').split(/\r?\n/).map((line) => line.trim());
  for (const needed of ['.env', 'node_modules/']) {
    if (!gitignore.includes(needed)) fail(`.gitignore must contain the line "${needed}".`);
  }

  // package.json must ask for Node 24 or newer and list the "check" shortcut.
  const packageJson = require('../package.json');
  if (!packageJson.engines || !packageJson.engines.node) fail('package.json needs an "engines" setting for Node.');
  if (!packageJson.scripts || !packageJson.scripts.check) fail('package.json needs a "check" script.');

  // No em-dashes anywhere (the long dash character). The character is built from its code number
  // here so that this file does not contain one itself.
  const emDash = String.fromCharCode(0x2014);
  const skipFolders = new Set(['node_modules', '.git', '.npm', 'old']);
  const textFiles = /\.(js|json|md|txt)$/i;

  const scanFolder = (folder) => {
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      const fullPath = path.join(folder, entry.name);

      if (entry.isDirectory()) {
        if (!skipFolders.has(entry.name)) scanFolder(fullPath);
      } else if (textFiles.test(entry.name)) {
        const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
        lines.forEach((line, index) => {
          if (line.includes(emDash)) fail(`em-dash found in ${path.relative(projectFolder, fullPath)} line ${index + 1}. Use a comma, full stop or hyphen.`);
        });
      }
    }
  };
  scanFolder(projectFolder);

  console.log('OK  rules    .gitignore, package.json and no em-dashes');
} catch (error) {
  fail(`rules: ${error.message}`);
}

// ---- Report --------------------------------------------------------------
if (problems > 0) {
  console.error(`\nCheck failed with ${problems} problem(s). Fix them before pushing.`);
  process.exit(1); // a non-zero exit code tells npm that the check failed
}

console.log('\nAll checks passed. Safe to push.');
