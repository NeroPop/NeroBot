const { google } = require('googleapis');
const { EmbedBuilder, Colors } = require("discord.js");

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

  // Validation: must have at least 2 args (author + quote)
  if (args.length < 2) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Invalid Usage")
          .setDescription(
            "You must include both an author and a quote.\n\n**Usage:** `-addquote [author] [quote]`"
          ),
      ],
    });
  }

  const author = args[0].trim();
  const quote = args.slice(1).join(" ").trim();

  if (!author || !quote) {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Blurple)
          .setTitle("⚠️ Missing Information")
          .setDescription("Please provide both the author name and the quote text.\n\n**Usage:** `-addquote [author] [quote]`"),
      ],
    });
  }

  try {
    // Authenticate with Google Sheets
    const auth = new google.auth.JWT({
      email: sheetsAuth.client_email,
      key: sheetsAuth.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Append the quote and author to the sheet
    await sheets.spreadsheets.values.append({
      auth,
      spreadsheetId,
      range: "Sheet1!A:B",
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      resource: {
        values: [[author, quote]],
      },
    });

    console.log(`📝 Quote added by ${message.author.tag}: "${quote}" - ${author}`);

    // Confirmation embed
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("💬 Quote Added Successfully!")
      .setDescription(`> "${quote}"\n**- ${author}**`)
      .setFooter({
        text: `Added by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      });

    await message.channel.send({ embeds: [embed] });
  } catch (error) {
    console.error("❌ Error adding quote:", error);

    await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle("❌ Error")
          .setDescription(
            "Something went wrong while adding your quote. Please try again later."
          ),
      ],
    });
  }
};

exports.name = "addquote";
exports.description = "Adds a new quote to the Google Sheets document.";