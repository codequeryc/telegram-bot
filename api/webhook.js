import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    const chatId = msg.chat.id;
    const text = msg.text?.trim();

    // ❌ Ignore slash commands like /start, /help, etc.
    if (!text || text.startsWith('/')) return res.status(200).end();

    const query = text;
    const apiBase = process.env.API_URL;
    const apiUrl = `${apiBase}${encodeURIComponent(query)}`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.results || data.results.length === 0) {
      await bot.sendMessage(chatId, `❌ No results found for *${query}*.`, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      });
      return res.status(200).end();
    }

    const limitedResults = data.results.slice(0, 3);

    for (const movie of limitedResults) {
      // ⬇️ Download thumbnail as buffer (no compression)
      const imageResponse = await axios.get(movie.thumbnail, {
        responseType: 'arraybuffer'
      });
      const photoBuffer = Buffer.from(imageResponse.data, 'binary');

      const caption = `🎬 *${movie.title}*\n\n📅 *Released:* Unknown\n🍿 *Source:* FilmyFly\n\nEnjoy downloading your favorite movie!`;

      await bot.sendPhoto(chatId, photoBuffer, {
        caption,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "📥 Download Links", url: movie.download }
            ]
          ]
        }
      });
    }

    res.status(200).end();
  } catch (error) {
    console.error("Bot Error:", error.message);
    res.status(500).send("Error");
  }
}
