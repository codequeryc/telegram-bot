import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text?.includes('#')) return res.status(200).end();

    const query = text.replace(/#/g, '').trim();
    const apiUrl = `https://dlinkz.vercel.app/api/urls?q=${encodeURIComponent(query)}`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.results || data.results.length === 0) {
      await bot.sendMessage(chatId, `❌ No results found for *${query}*.`, {
        parse_mode: "Markdown"
      });
      return res.status(200).end();
    }

    for (const movie of data.results) {
      const caption = `🎬 *${movie.title}*\n\n📅 *Released:* Unknown\n🍿 *Source:* FilmyFly\n\nEnjoy downloading your favorite movie!`;

      const buttons = {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔗 Download Page", url: movie.link },
              { text: "📥 Direct Download", url: movie.download }
            ]
          ]
        },
        parse_mode: "Markdown"
      };

      await bot.sendPhoto(chatId, movie.thumbnail, {
        caption,
        ...buttons
      });
    }

    res.status(200).end();
  } catch (error) {
    console.error("Bot Error:", error.message);
    res.status(500).send("Error");
  }
}
