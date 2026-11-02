const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } = require("discord.js");

exports.run = async (client, message) => {
  // Define your embed pages
  const pages = [
    new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("🧠 Nero Bot Features — Page 1")
      .setDescription("Here are some of the features of this bot and what they do:")
      .addFields(
        { name: "-addcat [name] [link]", value: "Adds a cat image to the spreadsheet of cat pics." },
        { name: "-addmemetext [text]", value: "Adds a text prompt to the spreadsheet to be used in memes." },
        { name: "-addprompt [prompt]", value: "Adds a new conversation prompt for the bot." },
        { name: "-addquote [author] [quote]", value: "Adds a new quote to the bot." },
        { name: "-botchannel", value: "Channel assigned for bot announcements" },
        { name: "-cat", value: "Sends a random cat pic with the cat’s name." },
        { name: "-catlist", value: "Lists all cat names." },
        { name: "-catname [name]", value: "Sends a random cat pic of a specific cat." },
        { name: "-checkdebt [Name]", value: "Checks how much a person owes Nero." },
        { name: "-day", value: "Displays the current day, date, and time." },
        { name: "-features", value: "Shows all available features and what they do." },
        { name: "-hello", value: "Says hello." },
        { name: "-help", value: "Lists all available commands." },
        { name: "-home", value: "Posts a random image from North Wales." },
        { name: "-Leone", value: "Names Leone." },
        { name: "-meme", value: "Generates a random meme." },
        { name: "-Nero", value: "Names Nero." },
        { name: "-ping", value: "Responds with Pong!" },
        { name: "-portfolio", value: "Shows Jack Myrick's portfolio." },
        { name: "-prompt", value: "Sends a random prompt." }
      ),

    new EmbedBuilder()
      .setColor("#fb9500")
      .setTitle("🧠 Nero Bot Features — Page 2")
      .addFields(
        { name: "-quote", value: "Gets a random quote." },
        { name: "-quotelist [Author]", value: "Lists all quotes by a specific author." },
        { name: "-quoteperson [Author]", value: "Gets a random quote by a specific author." },
        { name: "-rate [item]", value: "Rates the specified item." },
        {
          name: "-reminder [number] [timeframe] [message]",
          value: "Sets a reminder and posts it in this channel when the time is up.",
        },
        {
          name: "-reminderdm [number] [timeframe] [message]",
          value: "Sets a reminder and sends it to you via DM when the time is up.",
        },
        { name: "-reminderlist", value: "Lists all your pending reminders." },
        { name: "-say [message]", value: "Makes the bot say something." },
        {
          name: "-suggestion [message]",
          value: "Submits a suggestion for new features or improvements.",
        },
        { name: "-treat", value: "Gives the bot a treat 🍪." }
      )
      .setFooter({ text: "Page 2 of 2 — Nero Bot • Feature Overview" }),
  ];

  let currentPage = 0;

  // Create navigation buttons
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("prev").setLabel("◀️ Back").setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("next").setLabel("Next ▶️").setStyle(ButtonStyle.Primary)
  );

  // Send the first embed with buttons
  const sentMessage = await message.channel.send({
    embeds: [pages[currentPage]],
    components: [buttons],
  });

  // Create a collector to handle button interactions
  const collector = sentMessage.createMessageComponentCollector({
    filter: (i) => i.user.id === message.author.id,
    time: 120000, // 2 minutes
  });

  collector.on("collect", async (interaction) => {
    if (interaction.customId === "next") {
      currentPage++;
    } else if (interaction.customId === "prev") {
      currentPage--;
    }

    // Update button states
    const updatedButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀️ Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage === 0),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === pages.length - 1)
    );

    await interaction.update({
      embeds: [pages[currentPage]],
      components: [updatedButtons],
    });
  });

  collector.on("end", async () => {
    // Disable buttons when time runs out
    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev")
        .setLabel("◀️ Back")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next")
        .setLabel("Next ▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true)
    );

    await sentMessage.edit({ components: [disabledRow] });
  });
};

exports.name = "features";
exports.description = "Shows all features and what they do.";