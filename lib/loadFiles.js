// lib/loadFiles.js
//
// This file reads the "commands", "triggers" and "services" folders and hands back everything
// it finds. Both index.js (the real bot) and scripts/check.js (the safety check) use it,
// so the rules for what makes a valid command, trigger or service live in ONE place.
//
// If a file is written wrongly, the error message names the file so it is easy to fix.

const fs = require('node:fs');
const path = require('node:path');

// Finds every .js file inside one of the project's folders. Those folders (commands, triggers,
// services) are in the main project folder, one level up from this lib folder.
// Returns a list like: [{ fileName: 'ping', filePath: 'C:/.../commands/ping.js' }]
// A folder that does not exist (git does not keep empty folders) simply gives an empty list.
function getJsFiles(folderName) {
  const folderPath = path.join(__dirname, '..', folderName); // '..' means one level up, the main project folder

  if (!fs.existsSync(folderPath)) return [];

  return fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith('.js')) // ignore anything that is not a .js file
    .map((file) => ({
      fileName: path.basename(file, '.js'), // "ping.js" becomes "ping"
      filePath: path.join(folderPath, file),
    }));
}

// Loads every slash command from the "commands" folder.
//
// Each command file must export:
//   data    -> the command's name and description (made with SlashCommandBuilder)
//   execute -> the function that runs when someone uses the command
//
// A command file may also export these optional switches:
//   ownerOnly -> true means only the owner (ownerId in config.js) can use the command
//   hidden    -> true means the command is left off the /features list
//
// House rule: the command name must match the file name (/ping lives in ping.js).
function loadCommands() {
  const commands = [];

  for (const { fileName, filePath } of getJsFiles('commands')) {
    const command = require(filePath);

    if (!command.data || typeof command.execute !== 'function') {
      throw new Error(`commands/${fileName}.js must export "data" and an "execute" function.`);
    }

    if (command.data.name !== fileName) {
      throw new Error(
        `commands/${fileName}.js sets the command name to "${command.data.name}", ` +
          `but the file name and command name must match.`
      );
    }

    for (const switchName of ['ownerOnly', 'hidden']) {
      if (command[switchName] !== undefined && typeof command[switchName] !== 'boolean') {
        throw new Error(`commands/${fileName}.js: "${switchName}" must be true or false.`);
      }
    }

    commands.push(command);
  }

  // A bot with no commands is almost certainly a mistake. On Linux hosting the folder name must
  // be exactly "commands" (all lowercase), because "Commands" would be a different folder.
  if (commands.length === 0) {
    throw new Error('No commands were found. They must be .js files inside a folder called "commands" (all lowercase).');
  }

  return commands;
}

// Loads every chat trigger from the "triggers" folder.
//
// Each trigger file must export:
//   pattern -> a regular expression. If a message matches it, the trigger runs.
//   execute -> the function that runs, and it receives the Discord message.
//
// A file may also export "examples" (optional) so scripts/check.js can test the pattern:
//   examples: { shouldMatch: ['some text'], shouldNotMatch: ['other text'] }
function loadTriggers() {
  const triggers = [];

  for (const { fileName, filePath } of getJsFiles('triggers')) {
    const trigger = require(filePath);

    if (!(trigger.pattern instanceof RegExp) || typeof trigger.execute !== 'function') {
      throw new Error(`triggers/${fileName}.js must export a "pattern" (RegExp) and an "execute" function.`);
    }

    // A pattern with the "g" or "y" flag remembers its position between tests,
    // which makes it match unpredictably. We refuse those to avoid confusing bugs.
    if (trigger.pattern.global || trigger.pattern.sticky) {
      throw new Error(`triggers/${fileName}.js: the pattern must not use the "g" or "y" flags.`);
    }

    // Keep the file name on the trigger so log messages can say which one it was.
    triggers.push({ ...trigger, name: fileName });
  }

  return triggers;
}

// Loads every background service from the "services" folder.
//
// A service is a job that keeps running on its own (like sending reminders).
// Each service file must export:
//   start -> a function that receives the Discord client when the bot is ready.
//            It may return a short piece of text to show in the console, like "3 waiting".
function loadServices() {
  const services = [];

  for (const { fileName, filePath } of getJsFiles('services')) {
    const service = require(filePath);

    if (typeof service.start !== 'function') {
      throw new Error(`services/${fileName}.js must export a "start" function.`);
    }

    // Keep the file name on the service so log messages can say which one it was.
    services.push({ ...service, name: fileName });
  }

  return services;
}

module.exports = { loadCommands, loadTriggers, loadServices };
