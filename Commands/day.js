exports.run = (client, message) => {
  // Get the current date/time localized to your timezone
  const currentDate = new Date();

  // Change this to your local timezone, e.g. "Europe/London"
  const locale = "en-GB";
  const timeZone = "Europe/London"; // Change this if you live elsewhere

  // Format the full date/time using Intl.DateTimeFormat
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  };

  const formattedDate = new Intl.DateTimeFormat(locale, options).format(currentDate);

  // Example: "Sunday, 6 October 2025 at 14:37"
  message.channel.send(`🗓️ ${formattedDate}`);
};

exports.name = "day";
exports.description = "Displays the current day, date, and local time.";