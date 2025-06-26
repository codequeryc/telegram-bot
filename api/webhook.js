import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const bot = new TelegramBot(process.env.BOT_TOKEN); // token Vercel me set hoga
const BLOGGER_URL = "https://filmylootz.blogspot.com";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text?.includes('#')) return res.status(200).end();

    const movieName = text.replace(/#/g, '').trim();
    const feedURL = `${BLOGGER_URL}/feeds/posts/default?q=${encodeURIComponent(movieName)}&alt=json`;

    const { data } = await axios.get(feedURL);
    const entries = data?.feed?.entry;

    if (entries?.length > 0) {
      const entry = entries[0];
      const title = entry.title.$t;
      const link = entry.link.find(l => l.rel === "alternate").href;
      const content = entry.content.$t;
      const match = content.match(/https?:\/\/[^\s"<]+/gi);
      const downloadLink = match ? match[0] : link;

      const replyText = `🎬 *${title}*\n📥 [Download Here](${downloadLink})\n🔗 [Read Post](${link})`;
      await bot.sendMessage(chatId, replyText, { parse_mode: "Markdown" });
    } else {
      await bot.sendMessage(chatId, "❌ Movie not found.");
    }

    res.status(200).end();
  } catch (err) {
    console.error("Bot error:", err.message);
    res.status(500).send("Error");
  }
}
