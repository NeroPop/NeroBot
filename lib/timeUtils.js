// lib/timeUtils.js
//
// Helpers for working out dates and times in a particular time zone. Used by lib/parseWhen.js
// (which reads what people type into /reminder). Nothing in here talks to Discord or Google.
//
// Why time zones matter: "2pm" means a different moment in London and in New York, and the
// clocks change for summer and winter time. These helpers take care of that.

// How many milliseconds are in each unit.
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// ---- Time zones ----------------------------------------------------------

// Checks a time zone name like "Europe/London" and returns its correct spelling,
// or null if there is no such time zone.
function resolveTimeZone(name) {
  try {
    return new Intl.DateTimeFormat('en-GB', { timeZone: String(name).trim() }).resolvedOptions().timeZone;
  } catch (error) {
    return null; // Intl throws an error for names it does not know
  }
}

// Building a time formatter is slow, so we keep one per time zone and reuse it.
const formatters = new Map();

// What time is it on the clock in that time zone, as minutes since midnight?
// (For example 10:30 in London is 630, whatever the server's own clock says.)
function localMinutes(ms, timeZone) {
  if (!formatters.has(timeZone)) {
    formatters.set(
      timeZone,
      new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    );
  }

  const parts = formatters.get(timeZone).formatToParts(new Date(ms));
  const hours = Number(parts.find((part) => part.type === 'hour').value) % 24;
  const minutes = Number(parts.find((part) => part.type === 'minute').value);
  return hours * 60 + minutes;
}

// ---- Calendar days -------------------------------------------------------

// The short names Intl uses for the days of the week, in order (index 0 is Sunday).
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// What is the calendar date in a time zone at a given moment? Returns
//   { year, month, day, weekday }   where month is 1 to 12 and weekday is 0 (Sunday) to 6 (Saturday).
// (The date depends on the time zone: 00:30 on Saturday in London is still Friday in New York.)
function zonedDateParts(ms, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).formatToParts(new Date(ms));

  const get = (type) => parts.find((part) => part.type === type).value;
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    weekday: WEEKDAY_NAMES.indexOf(get('weekday')),
  };
}

// The date that is "days" days after the given date. Months and years roll over properly,
// so adding 3 days to 30 October gives 2 November.
function addDays({ year, month, day }, days) {
  const moved = new Date(Date.UTC(year, month - 1, day + days));
  return { year: moved.getUTCFullYear(), month: moved.getUTCMonth() + 1, day: moved.getUTCDate() };
}

// The date that is "months" calendar months after the given date (use 12 for a year).
// If that month is too short for the day, the last day of the month is used, so one month
// after 31 January is 28 February (or 29 in a leap year).
function addMonths({ year, month, day }, months) {
  const totalMonths = year * 12 + (month - 1) + months;
  const newYear = Math.floor(totalMonths / 12);
  const newMonth = (totalMonths % 12) + 1;

  // Day 0 of the NEXT month is the last day of this month, which tells us how long this month is.
  const daysInMonth = new Date(Date.UTC(newYear, newMonth, 0)).getUTCDate();
  return { year: newYear, month: newMonth, day: Math.min(day, daysInMonth) };
}

// The exact moment when the clock in a time zone reads a given time on a given date.
//   zonedInstant(2026, 11, 7, 19 * 60 + 20, 'Europe/London')   is 7:20pm on 7 November 2026 in London
// "minutesOfDay" is minutes since midnight (7:20pm is 1160).
function zonedInstant(year, month, day, minutesOfDay, timeZone) {
  const wantedDay = Date.UTC(year, month - 1, day) / DAY; // the date we want, as a day number

  // Start by pretending the wanted clock time is in UTC, then correct by how far off that is.
  // We check the answer and nudge it a few times, which also copes with the clocks changing
  // for summer or winter time (the answer can be an hour out on the first try).
  let guess = Date.UTC(year, month - 1, day) + minutesOfDay * MINUTE;

  for (let attempt = 0; attempt < 3; attempt++) {
    const actual = zonedDateParts(guess, timeZone);
    const actualDay = Date.UTC(actual.year, actual.month - 1, actual.day) / DAY;
    const difference = (wantedDay - actualDay) * 1440 + (minutesOfDay - localMinutes(guess, timeZone));
    if (difference === 0) break;
    guess += difference * MINUTE;
  }

  return guess;
}

// The next moment (after the given time) when the clock in a time zone reads a given time.
// "minutesOfDay" is minutes since midnight. For example, at 20:00 the next 09:00 is tomorrow.
function nextOpening(ms, minutesOfDay, timeZone) {
  const minuteStart = ms - (ms % MINUTE);

  // How many minutes until the clock next reads that time?
  let delta = (minutesOfDay - localMinutes(minuteStart, timeZone) + 1440) % 1440;
  if (delta === 0) delta = 1440;

  let candidate = minuteStart + delta * MINUTE;

  // Clocks changing for summer or winter time can leave us an hour out, so
  // check the clock at our answer and nudge it until it matches.
  for (let attempt = 0; attempt < 3; attempt++) {
    let difference = minutesOfDay - localMinutes(candidate, timeZone);
    if (difference > 720) difference -= 1440;
    if (difference < -720) difference += 1440;
    if (difference === 0) break;
    candidate += difference * MINUTE;
  }

  return candidate;
}

module.exports = {
  MINUTE,
  HOUR,
  DAY,
  resolveTimeZone,
  localMinutes,
  zonedDateParts,
  addDays,
  addMonths,
  zonedInstant,
  nextOpening,
};
