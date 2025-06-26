import TelegramBot from 'node-telegram-bot-api';

const bot = new TelegramBot(process.env.BOT_TOKEN);

export default async function handler(req, res) {
  try {
    const webhook = 'https://filmyloot.vercel.app/api/webhook';
    await bot.setWebHook(webhook);
    res.status(200).send('Webhook set ✅');
  } catch (err) {
    res.status(500).send('Error setting webhook');
  }
}
