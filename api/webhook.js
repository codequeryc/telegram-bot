import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import cheerio from 'cheerio';

const bot = new TelegramBot(process.env.BOT_TOKEN);
const SITE_URL = "https://filmyfly.loan";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const msg = req.body.message;

  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text?.includes('#')) return res.status(200).end();

    const movieName = text.replace(/#/g, '').trim();
    const searchURL = `${SITE_URL}/site-1.html?to-search=${encodeURIComponent(movieName)}`;

    const { data: html } = await axios.get(searchURL);
    const $ = cheerio.load(html);

    // Yeh selector check kare pehla result
    const firstResult = $('a:contains("Download")').first();
    const href = firstResult.attr('href');

    if (href) {
      const postUrl = SITE_URL + '/' + href;
      const { data: postHtml } = await axios.get(postUrl);
      const $$ = cheerio.load(postHtml);

      const title = $$('title').text().trim();
      const downloadLink = $$("a:contains('Download'), a:contains('480p'), a:contains('720p')").first().attr("href");

      const replyText = `🎬 *${title}*\n📥 [Download Link](${downloadLink})\n🔗 [Open Post](${postUrl})`;

      const sentMsg = await bot.sendMessage(chatId, replyText, { parse_mode: "Markdown" });

      // Delete both messages after 60 seconds
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
    console.error("Bot error:", err.message);
    res.status(500).send("Error");
  }
}
