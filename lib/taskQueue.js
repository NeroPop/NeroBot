// lib/taskQueue.js
//
// A small helper that makes sure only ONE task runs at a time.
//
// Some jobs read a spreadsheet to find the next empty row and then write to it. If two of those
// ran at the same moment they could both pick the same row and overwrite each other.
// This puts them in a line, so each one finishes before the next one starts.
//
//   const runExclusive = createQueue();
//   await runExclusive(async () => { ...runs only when nothing else in this queue is running... });

function createQueue() {
  let queue = Promise.resolve();

  return function runExclusive(task) {
    const result = queue.then(task);
    queue = result.catch(() => {}); // a failed task must not block the tasks after it
    return result;
  };
}

module.exports = { createQueue };
