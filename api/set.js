import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  try {
    const webhook = 'https://filmyloot.vercel.app/api/webhook'; // ✅ apna URL
    await bot.setWebHook(webhook);
    res.status(200).send('✅ Webhook set ho gaya!');
  } catch (err) {
    console.error(err.message);
    res.status(500).send('❌ Failed to set webhook');
  }
}
