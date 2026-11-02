const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

exports.run = (client, message) => {
  const embed = new EmbedBuilder()
    .setTitle("Jack Myrick Portfolio")
    .setDescription("Explore Jack Myrick’s work and projects.")
    .setColor("#fb9500")
    .setURL("https://www.jackmyrick.design")
    .setImage("attachment://Nero_Knight.png");

  const button = new ButtonBuilder()
    .setLabel("View Portfolio")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.jackmyrick.design");

  const row = new ActionRowBuilder().addComponents(button);

  message.channel.send({
    embeds: [embed],
    components: [row],
    files: ["./images/Nero_Knight.png"], // now from the images folder
  });
};

exports.name = "portfolio";
exports.description = "Displays Jack Myrick's portfolio.";