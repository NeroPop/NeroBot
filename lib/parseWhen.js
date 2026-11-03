// lib/parseWhen.js
//
// Turns what a person types into a moment in time. It is used by /reminder and /reminderdm.
// It understands these (capital letters and commas do not matter):
//
//   A WAIT          "30m"  "2h 30m"  "5 minutes"  "1 day 2 hours"  "in 2 weeks"  "3 months"
//   A CLOCK TIME    "7:20pm"  "19:20"  "9am"  "noon"  "midnight"   the NEXT time the clock reads that
//   A DAY + TIME    "tomorrow 9am"  "today 6pm"  "tonight 9pm"  "friday 6pm"  "sat 19:20"
//   A DATE + TIME   "25 dec 2pm"  "dec 25th 2pm"  "25/12 2pm"  "25/12/2027 14:30"  "2027-12-25 9am"
//   A WAIT + TIME   "2pm in 3 months"  "in 3 months at 2pm"  "9am in 2 weeks"  "6pm in 10 days"
//
// Little words like "on", "at", "in", "next", "this" and "from now" are ignored.
// Clock times without am or pm use the 24 hour clock, so "7" means 07:00 and "19" means 19:00.
//
// Units in a wait: seconds (s), minutes (m), hours (h), days (d), weeks (w), months (mo), years (y).
// Days, weeks, months and years follow the calendar and keep the clock time the same, even when
// the clocks change. One month after 31 January is 28 February (the last day of that month).
//
// A day name means the next time that day comes round. A date with no year means the next time
// that date comes round.

const { MINUTE, HOUR, localMinutes, zonedDateParts, addDays, addMonths, zonedInstant, nextOpening } = require('./timeUtils');

// The words for days, and what each one means:
//   a number is a day of the week (0 is Sunday, 6 is Saturday)
//   'today' and 'tomorrow' are those days
// (A Map is used so that odd words like "constructor" are never mistaken for a day.)
const DAY_WORDS = new Map([
  ['today', 'today'],
  ['tonight', 'today'],
  ['tomorrow', 'tomorrow'],
  ['sunday', 0], ['sun', 0],
  ['monday', 1], ['mon', 1],
  ['tuesday', 2], ['tues', 2], ['tue', 2],
  ['wednesday', 3], ['weds', 3], ['wed', 3],
  ['thursday', 4], ['thurs', 4], ['thur', 4], ['thu', 4],
  ['friday', 5], ['fri', 5],
  ['saturday', 6], ['sat', 6],
]);

// The words for months, and their numbers (January is 1).
const MONTH_WORDS = new Map([
  ['jan', 1], ['january', 1],
  ['feb', 2], ['february', 2],
  ['mar', 3], ['march', 3],
  ['apr', 4], ['april', 4],
  ['may', 5],
  ['jun', 6], ['june', 6],
  ['jul', 7], ['july', 7],
  ['aug', 8], ['august', 8],
  ['sep', 9], ['sept', 9], ['september', 9],
  ['oct', 10], ['october', 10],
  ['nov', 11], ['november', 11],
  ['dec', 12], ['december', 12],
]);

// The spellings we accept for each unit of a wait, and which unit they mean.
const UNIT_SPELLINGS = new Map([
  ['s', 'second'], ['sec', 'second'], ['secs', 'second'], ['second', 'second'], ['seconds', 'second'],
  ['m', 'minute'], ['min', 'minute'], ['mins', 'minute'], ['minute', 'minute'], ['minutes', 'minute'],
  ['h', 'hour'], ['hr', 'hour'], ['hrs', 'hour'], ['hour', 'hour'], ['hours', 'hour'],
  ['d', 'day'], ['day', 'day'], ['days', 'day'],
  ['w', 'week'], ['wk', 'week'], ['wks', 'week'], ['week', 'week'], ['weeks', 'week'],
  ['mo', 'month'], ['mos', 'month'], ['month', 'month'], ['months', 'month'],
  ['y', 'year'], ['yr', 'year'], ['yrs', 'year'], ['year', 'year'], ['years', 'year'],
]);

// Little words that mean nothing here, so "7:20pm on saturday" is the same as "7:20pm saturday".
const FILLER_WORDS = new Set(['on', 'at', 'next', 'this', 'coming', 'the', 'in', 'from', 'now', 'for', 'of', 'after', 'later']);

// Reads a clock time like "7:20pm", "19:20", "9am", "noon" and returns minutes since midnight
// (7:20pm is 1160). Returns null if it is not a valid clock time.
function parseClock(text) {
  if (text === 'noon') return 12 * 60;
  if (text === 'midnight') return 0;

  // Hours, optional minutes (after a : or a .), and an optional am or pm.
  const match = text.match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? 0);
  const suffix = match[3];
  if (minutes > 59) return null;

  if (suffix) {
    // With am or pm, the hour must be 1 to 12. 12am is midnight and 12pm is noon.
    if (hours < 1 || hours > 12) return null;
    hours = (hours % 12) + (suffix === 'pm' ? 12 : 0);
  } else if (hours > 23) {
    return null; // without am or pm it is the 24 hour clock, which stops at 23
  }

  return hours * 60 + minutes;
}

// Is this a real calendar date? (31 February is not.)
function isRealDate(year, month, day) {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Takes the waits out of the text, like "3 months" or "2h 30m".
// Returns the amount of each unit, and the text that is left over.
function takeWaits(text) {
  const waits = { second: 0, minute: 0, hour: 0, day: 0, week: 0, month: 0, year: 0 };
  let found = false;
  let badWait = false;
  let calendarUnitTyped = false; // true for days, weeks, months or years, even when the amount is 0

  // A number, then some letters. If the letters are a unit ("m", "hours"...) it is a wait.
  // If not ("pm", "dec", "th") we leave it alone for the other readers below.
  const left = text.replace(/(\d+(?:\.\d+)?)\s*([a-z]+)(?![a-z])/g, (whole, number, letters) => {
    const unit = UNIT_SPELLINGS.get(letters);
    if (!unit) return whole;

    found = true;
    const amount = Number(number);

    // Days, weeks, months and years follow the calendar, so they must be whole numbers.
    if (['day', 'week', 'month', 'year'].includes(unit)) {
      calendarUnitTyped = true;
      if (!Number.isInteger(amount)) badWait = true;
    }

    // Absurdly big numbers (like 99999999999 days) are refused, because dates cannot go that far.
    if (amount > 100000) badWait = true;

    waits[unit] += amount;
    return ' ';
  });

  return { waits, found, badWait, calendarUnitTyped, left };
}

// Looks for a date in the words, like "25 dec", "dec 25th", "25 dec 2027", "25/12", "25/12/2027"
// or "2027-12-25". Returns:
//   null                           there is no date in the words
//   { error: 'format' }            it looks like a date but is not a real one
//   { day, month, year, rest }     the date (year is null if not given) and the words left over
function takeDate(words) {
  for (let index = 0; index < words.length; index++) {
    const word = words[index];
    const without = (...indexes) => words.filter((_, i) => !indexes.includes(i));

    // 25/12 or 25/12/2027 or 25/12/27 (day first, like in the UK)
    let match = word.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}|\d{2}))?$/);
    if (match) {
      const year = match[3] ? (match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])) : null;
      const day = Number(match[1]);
      const month = Number(match[2]);
      if (month < 1 || month > 12 || day < 1 || day > 31) return { error: 'format' };
      return { day, month, year, rest: without(index) };
    }

    // 2027-12-25
    match = word.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
      if (month < 1 || month > 12 || day < 1 || day > 31) return { error: 'format' };
      return { day, month, year, rest: without(index) };
    }

    // A month name next to a day number: "25 dec", "25th dec", "dec 25", "december 25th".
    if (MONTH_WORDS.has(word)) {
      const dayPattern = /^(\d{1,2})(?:st|nd|rd|th)?$/;
      const before = index > 0 ? words[index - 1].match(dayPattern) : null;
      const after = index < words.length - 1 ? words[index + 1].match(dayPattern) : null;

      // Prefer "25 dec" over "dec 25".
      const useBefore = Boolean(before);
      const dayMatch = useBefore ? before : after;
      if (!dayMatch) return { error: 'format' };

      const used = useBefore ? [index - 1, index] : [index, index + 1];
      const day = Number(dayMatch[1]);
      const month = MONTH_WORDS.get(word);
      if (day < 1 || day > 31) return { error: 'format' };

      // An optional four digit year straight after the date: "25 dec 2027".
      let year = null;
      const yearWord = words[used[1] + 1];
      if (yearWord && /^\d{4}$/.test(yearWord)) {
        year = Number(yearWord);
        used.push(used[1] + 1);
      }

      return { day, month, year, rest: without(...used) };
    }
  }

  return null;
}

// Works out the moment someone means.
//   text      what they typed
//   now       the current time in milliseconds
//   timeZone  the time zone the clock times are in, like 'Europe/London'
// Returns:
//   { atMs }            the moment they mean
//   { error: 'format' } it is not something we understand
//   { error: 'past' }   it is a moment that has already gone by (or is right now)
function parseWhen(text, now, timeZone) {
  try {
    return readWhen(text, now, timeZone);
  } catch (error) {
    // Nothing a person types should ever crash the bot. Anything unexpected counts as "not understood".
    return { error: 'format' };
  }
}

function readWhen(text, now, timeZone) {
  // Tidy the text: lower case, commas and "&" become spaces, "and" is ignored.
  let input = String(text ?? '')
    .toLowerCase()
    .replace(/[,&]/g, ' ')
    .replace(/\band\b/g, ' ');

  // ---- 1. Take out any waits ("3 months", "2h 30m") ----
  const { waits, found: hasWait, badWait, calendarUnitTyped, left } = takeWaits(input);
  if (badWait) return { error: 'format' };
  input = left;

  // ---- 2. Split what is left into words, dropping the little filler words ----
  // A number followed by "am" or "pm" in separate words ("2 pm") is joined back together.
  let words = input
    .replace(/(\d)\s+(am|pm)\b/g, '$1$2')
    .split(/\s+/)
    .filter((word) => word !== '' && !FILLER_WORDS.has(word));

  // ---- 3. Look for a date ("25 dec") ----
  let date = null;
  const dateResult = takeDate(words);
  if (dateResult?.error) return dateResult;
  if (dateResult) {
    date = dateResult;
    words = dateResult.rest;
  }

  // ---- 4. Look for a day word ("tomorrow", "friday") ----
  const dayWords = words.filter((word) => DAY_WORDS.has(word));
  if (dayWords.length > 1) return { error: 'format' };
  const day = dayWords.length === 1 ? DAY_WORDS.get(dayWords[0]) : null;

  // ---- 5. Whatever is left must be a clock time (or nothing) ----
  const clockText = words.filter((word) => !DAY_WORDS.has(word)).join(' ');
  let clock = null;
  if (clockText !== '') {
    clock = parseClock(clockText);
    if (clock === null) return { error: 'format' };
  }

  // The waits split into two kinds: clock waits (seconds, minutes, hours) are exact lengths of
  // time, and calendar waits (days, weeks, months, years) follow the calendar.
  const exactMs = waits.second * 1000 + waits.minute * MINUTE + waits.hour * HOUR;
  const hasCalendarWait = waits.day + waits.week + waits.month + waits.year > 0;
  const hasExactWait = exactMs > 0;

  // Moves a date forward by the calendar waits (months and years first, then weeks and days).
  const addCalendarWaits = (dateParts) =>
    addDays(addMonths(dateParts, waits.month + waits.year * 12), waits.day + waits.week * 7);

  let atMs;

  if (hasWait) {
    // A wait cannot be mixed with a day name or a date ("tomorrow in 2 days" makes no sense).
    if (day !== null || date !== null) return { error: 'format' };

    if (clock === null) {
      // ---- A plain wait: "30m", "2 weeks", "1 day 2 hours" ----
      if (!hasExactWait && !hasCalendarWait) return { error: 'format' }; // "0m"

      // First the calendar part, keeping the clock reading the same (so "1 day" from 3pm is 3pm tomorrow).
      let start = now;
      if (hasCalendarWait) {
        const target = addCalendarWaits(zonedDateParts(now, timeZone));
        const secondsIntoMinute = now % MINUTE;
        start = zonedInstant(target.year, target.month, target.day, localMinutes(now, timeZone), timeZone) + secondsIntoMinute;
      }
      atMs = Math.round(start + exactMs);
    } else {
      // ---- A wait plus a clock time: "2pm in 3 months" ----
      // That means the calendar date after the wait, at that clock time. Hours and minutes
      // in the wait would clash with the clock time, so they are refused.
      if (hasExactWait || !calendarUnitTyped) return { error: 'format' };

      const target = addCalendarWaits(zonedDateParts(now, timeZone));
      atMs = zonedInstant(target.year, target.month, target.day, clock, timeZone);
    }
  } else if (date !== null) {
    // ---- A date plus a clock time: "25 dec 2pm" ----
    if (day !== null || clock === null) return { error: 'format' };

    if (date.year !== null) {
      if (!isRealDate(date.year, date.month, date.day)) return { error: 'format' };
      atMs = zonedInstant(date.year, date.month, date.day, clock, timeZone);
    } else {
      // No year given: use the first year (this one, or a later one) when it is still ahead of us.
      // Looking up to 8 years ahead copes with 29 February.
      const thisYear = zonedDateParts(now, timeZone).year;
      for (let year = thisYear; year <= thisYear + 8 && atMs === undefined; year++) {
        if (!isRealDate(year, date.month, date.day)) continue;
        const candidate = zonedInstant(year, date.month, date.day, clock, timeZone);
        if (candidate > now) atMs = candidate;
      }
      if (atMs === undefined) return { error: 'format' }; // not a real date in any of those years
    }
  } else if (day !== null) {
    // ---- A day name plus a clock time: "friday 6pm", "tomorrow 9am" ----
    if (clock === null) return { error: 'format' };

    const today = zonedDateParts(now, timeZone);

    // The moment the clock reads that time, a number of days from today.
    const onDayNumber = (daysAhead) => {
      const target = addDays(today, daysAhead);
      return zonedInstant(target.year, target.month, target.day, clock, timeZone);
    };

    if (day === 'today') {
      atMs = onDayNumber(0);
    } else if (day === 'tomorrow') {
      atMs = onDayNumber(1);
    } else {
      // A day of the week: the next time it comes round. If it is that day today but the time
      // has already gone, it means the same day next week.
      let daysAhead = (day - today.weekday + 7) % 7;
      atMs = onDayNumber(daysAhead);
      if (atMs <= now) atMs = onDayNumber(daysAhead + 7);
    }
  } else if (clock !== null) {
    // ---- Just a clock time: "7:20pm" means the next time the clock reads that ----
    atMs = nextOpening(now, clock, timeZone);
  } else {
    return { error: 'format' }; // nothing we understand
  }

  if (!(atMs > now)) return { error: 'past' };
  return { atMs };
}

module.exports = { parseWhen, parseClock };
