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

    // ✅ Send all results (one by one)
    for (const movie of data.results) {
      const caption = `🎬 *${movie.title}*\n\n🔗 [Download Page](${movie.link})\n📥 [Direct Download](${movie.download})`;

      await bot.sendPhoto(chatId, movie.thumbnail, {
        caption,
        parse_mode: "Markdown"
      });
    }

    res.status(200).end();
  } catch (error) {
    console.error("Bot Error:", error.message);
    res.status(500).send("Error");
  }
}
