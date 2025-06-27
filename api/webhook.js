import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import cheerio from 'cheerio';

const bot = new TelegramBot(process.env.BOT_TOKEN);
const SITE_URL = "https://filmyfly.loan";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    console.log("Incoming Telegram message:", msg);

    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text?.includes('#')) return res.status(200).end();

    const movieName = text.replace(/#/g, '').trim();
    const searchURL = `${SITE_URL}/site-1.html?to-search=${encodeURIComponent(movieName)}`;
    console.log("Search URL:", searchURL);

    const { data: html } = await axios.get(searchURL);
    const $ = cheerio.load(html);

    const firstResult = $('.A2 a').first();
    const href = firstResult.attr('href');
    const title = $('.A2 a b span').first().text().trim();

    if (href) {
      const postUrl = SITE_URL + href;

      // Optional: fetch post page for more info if needed
      const replyText = `🎬 *${title}*\n📥 [Download Page](${postUrl})`;

      const sentMsg = await bot.sendMessage(chatId, replyText, { parse_mode: "Markdown" });

      // Auto delete after 60s
      setTimeout(() => {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {});
      }, 60 * 1000);
    } else {
      const notFoundMsg = await bot.sendMessage(chatId, "❌ Movie not found on FilmyFly.");

      setTimeout(() => {
        bot.deleteMessage(chatId, msg.message_id).catch(() => {});
        bot.deleteMessage(chatId, notFoundMsg.message_id).catch(() => {});
      }, 60 * 1000);
    }

    res.status(200).end();
  } catch (err) {
    console.error("Bot error:", err);
    res.status(500).send("Error");
  }
}
