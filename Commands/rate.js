exports.run = (client, message, args) => {
  let toRate = args.join(" ");
  if (!toRate) return message.channel.send({ content: "You have to provide something to rate!\n\nUsage: `-rate [item]`" });

  // Check if the message includes "tea", "Tea", "Nero", or "nero"
  const includesSpecialWords = /tea|nero|leone|leontine|jack/i.test(toRate);

  // Generate a rating
  const rating = includesSpecialWords ? '11/10' : Math.floor(Math.random() * 10) + '/10';

  message.channel.send(`I rate ${toRate} ${rating}.`);
};

exports.name = 'rate';
exports.description = 'Rates something';
