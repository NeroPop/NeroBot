const { google } = require('googleapis');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
} = require("discord.js");

const sheetsAuth = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: (function () {
    const raw = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    const BEGIN = '-----BEGIN PRIVATE KEY-----';
    const END = '-----END PRIVATE KEY-----';
    const start = raw.indexOf(BEGIN);
    const endIdx = raw.indexOf(END);
    if (start === -1 || endIdx === -1) return raw.trim() + '\n';
    const rawBody = raw.slice(start + BEGIN.length, endIdx);
    const cleanBody = rawBody.replace(/[^A-Za-z0-9+/=]/g, '');
    const wrapped = cleanBody.match(/.{1,64}/g).join('\n');
    return `${BEGIN}\n${wrapped}\n${END}\n`;
  })(),
};

exports.run = async (client, message, args) => {
  const spreadsheetId = "1JPgOfxzj9JSRPwCHIqnc9SgsgA1XhGIkqwxlH5oBFaw"; // Google Sheets ID
  const sheets = google.sheets("v4");

  if (args.length < 1) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Missing Author")
          .setDescription(
            "Please provide an author name.\n\n**Usage:** `-quotelist [Author]`"
          ),
      ],
    });
  }

  const authorName = args.join(" ").trim();

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    // Read data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId,
      range: "Sheet1!A2:B",
    });

    const values = response.data.values;
    if (!values || values.length === 0) {
      return message.channel.send("📜 No quotes found in the database yet!");
    }

    // Filter quotes by author (case-insensitive)
    const authorQuotes = values
      .filter(
        (row) =>
          row[0] &&
          row[1] &&
          row[0].toLowerCase() === authorName.toLowerCase()
      )
      .map((row) => row[1]);

    if (authorQuotes.length === 0) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle("📭 No Quotes Found")
            .setDescription(
              `No quotes found for **${authorName}**.\nTry checking the spelling or adding a quote first!`
            ),
        ],
      });
    }

    // Split quotes into pages (10 per page)
    const quotesPerPage = 10;
    const pages = [];
    for (let i = 0; i < authorQuotes.length; i += quotesPerPage) {
      const chunk = authorQuotes.slice(i, i + quotesPerPage);
      const formattedQuotes = chunk
        .map((q, index) => `**${i + index + 1}.** “${q}”`)
        .join("\n\n");

      const embed = new EmbedBuilder()
        .setColor(Colors.Blurple)
        .setTitle(`💬 Quotes by ${authorName}`)
        .setDescription(formattedQuotes)
        .setFooter({
          text: `Page ${Math.floor(i / quotesPerPage) + 1} of ${Math.ceil(
            authorQuotes.length / quotesPerPage
          )} • Total: ${authorQuotes.length} quotes`,
          iconURL: client.user.displayAvatarURL(),
        });

      pages.push(embed);
    }

    let currentPage = 0;

    // Create navigation buttons if more than one page
    const components =
      pages.length > 1
        ? [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("prev")
                .setLabel("◀️ Previous")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
              new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next ▶️")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(pages.length === 1)
            ),
          ]
        : [];

    // Send the first page
    const sentMessage = await message.channel.send({
      embeds: [pages[currentPage]],
      components,
    });

    // Handle pagination interaction
    if (pages.length > 1) {
      const collector = sentMessage.createMessageComponentCollector({
        filter: (i) => i.user.id === message.author.id,
        time: 120000, // 2 minutes
      });

      collector.on("collect", async (interaction) => {
        if (interaction.customId === "next") currentPage++;
        else if (interaction.customId === "prev") currentPage--;

        const newRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀️ Previous")
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
          components: [newRow],
        });
      });

      collector.on("end", async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀️ Previous")
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
    }

    console.log(
      `📚 Sent ${authorQuotes.length} quote(s) by ${authorName} (${pages.length} page(s))`
    );
  } catch (error) {
    console.error("❌ Error fetching quote list:", error);
    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "An error occurred while fetching the quote list. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "quotelist";
exports.description = "Lists all quotes by a specific author.";