import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

import dotenv from 'dotenv';
dotenv.config();

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text?.includes('#')) return res.status(200).end();

    const query = text.replace(/#/g, '').trim();
    const apiBase = process.env.API_URL || 'https://dlinkz.vercel.app/api/urls?q=';
    const apiUrl = `${apiBase}${encodeURIComponent(query)}`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data.results || data.results.length === 0) {
      const notFoundMsg = await bot.sendMessage(chatId, `❌ No results found for *${query}*.`, {
        parse_mode: "Markdown",
        disable_web_page_preview: true
      });

      // ⏱️ Only delete bot reply
      setTimeout(() => {
        bot.deleteMessage(chatId, notFoundMsg.message_id).catch(() => {});
      }, 60000);

      return res.status(200).end();
    }

    // 👇 Limit to top 3
    const limitedResults = data.results.slice(0, 3);
    const moreResults = data.results.length > 3;

    for (const movie of limitedResults) {
      const caption = `🎬 *${movie.title}*\n\n📅 *Released:* Unknown\n🍿 *Source:* FilmyFly\n\nEnjoy downloading your favorite movie!`;

      const sentMsg = await bot.sendPhoto(chatId, movie.thumbnail, {
        caption,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🔗 Download Page", url: movie.link },
              { text: "📥 Direct Download", url: movie.download }
            ]
          ]
        }
      });

      setTimeout(() => {
        bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {});
      }, 60000); // ⏱️ Delete only bot message
    }

    // 🧩 View More Button
    if (moreResults) {
      const moreBtn = await bot.sendMessage(chatId, `🔎 *More results available for:* _${query}_`, {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [{ text: "🔍 View All", url: `${apiBase}${encodeURIComponent(query)}` }]
          ]
        }
      });

      // ⏱️ Delete "More" message after 60s
      setTimeout(() => {
        bot.deleteMessage(chatId, moreBtn.message_id).catch(() => {});
      }, 60000);
    }

    res.status(200).end();
  } catch (error) {
    console.error("Bot Error:", error.message);
    res.status(500).send("Error");
  }
}
