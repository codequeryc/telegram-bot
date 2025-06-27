import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

  try {
    const webhook = 'https://filmyloot.vercel.app/api/webhook'; // ✅ full URL
    const result = await bot.setWebHook(webhook);
    console.log("Webhook Set:", result);
    res.status(200).send('✅ Webhook set ho gaya!');
  } catch (err) {
    console.error("Webhook Set Error:", err.message);
    res.status(500).send('❌ Failed to set webhook');
  }
}
