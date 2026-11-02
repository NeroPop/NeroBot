// lib/text.js
//
// Small helpers for text.

// Cuts text down to at most "max" characters, ending with "..." if it was cut.
// Discord refuses messages and cards that are too long, so long text from a spreadsheet
// is shortened before it is shown.
function shorten(text, max) {
  const value = String(text ?? '');
  return value.length <= max ? value : `${value.slice(0, max - 3)}...`;
}

// True if the text is a web address starting with http:// or https://
function isWebAddress(text) {
  return /^https?:\/\/\S+$/i.test(String(text ?? '').trim());
}

module.exports = { shorten, isWebAddress };
