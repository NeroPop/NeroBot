const { EmbedBuilder, Colors } = require("discord.js");

exports.run = (client, message) => {
  // Collect all command names
  const commands = client.commands.map(cmd => cmd.name).join(", ");

  const embed = new EmbedBuilder()
    .setTitle(`Total Commands: ${client.commands.size}`)
    .setDescription(
      (commands || "No commands found.") +
        "\n\nFor a detailed breakdown of what each command does, use `-features` instead!"
    )
    .setFooter({ text: "My prefix is -" })
    .setColor(Colors.Blurple);

  message.channel.send({ embeds: [embed] });
};

exports.name = "help";
exports.description = "Lists all available commands.";