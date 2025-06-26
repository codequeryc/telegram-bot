import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';

const TELEGRAM_TOKEN = "7976993972:AAELkzCfYMVvaCozefxZPw-2BoZGWgfTrFs";
const BLOGGER_URL = "https://filmylootz.blogspot.com";

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

bot.on('message', async (msg) => {
  try {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text) return; // ignore non-text messages

    // Check for hashtag #
    if (!text.includes('#')) return; // ignore messages without #

    // Extract movie name by removing #
    const movieName = text.replace(/#/g, '').trim();

    // Fetch Blogger feed
    const feedURL = `${BLOGGER_URL}/feeds/posts/default?q=${encodeURIComponent(movieName)}&alt=json`;

    const { data } = await axios.get(feedURL);
    const entries = data?.feed?.entry;

    if (entries && entries.length > 0) {
      const entry = entries[0];
      const title = entry.title.$t;
      const link = entry.link.find(l => l.rel === "alternate").href;
      const content = entry.content.$t;

      const match = content.match(/https?:\/\/[^\s"<]+/gi);
      const downloadLink = match ? match[0] : link;

      const replyText = `🎬 *${title}*\n📥 [Download Here](${downloadLink})\n🔗 [Read Post](${link})`;

      // Send reply message
      const sentMsg = await bot.sendMessage(chatId, replyText, { parse_mode: "Markdown" });

      // Delete both messages after 1 minute
      setTimeout(() => {
        bot.deleteMessage(chatId, msg.message_id).catch(console.error);
        bot.deleteMessage(chatId, sentMsg.message_id).catch(console.error);
      }, 60 * 1000);

    } else {
      // Movie not found
      const sentMsg = await bot.sendMessage(chatId, "❌ Movie not found.");

      setTimeout(() => {
        bot.deleteMessage(chatId, msg.message_id).catch(console.error);
        bot.deleteMessage(chatId, sentMsg.message_id).catch(console.error);
      }, 60 * 1000);
    }

  } catch (error) {
    console.error("Bot error:", error.message);
  }
});

console.log("Bot is running with polling...");
