import { prisma } from '../../lib/prisma';
import { logToJob } from '../../lib/queue';
const TelegramBot = require('node-telegram-bot-api');

export async function handleNotifyTelegram(data: { videoId: string, copyrightRisk: string }, jobId: string) {
  const { videoId, copyrightRisk } = data;
  
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

  if (!token || !chatId) {
    await logToJob(jobId, `Telegram config missing. Skipping notification.`);
    return;
  }

  const video = await prisma.video.findUnique({ 
    where: { id: videoId },
    include: { script: { include: { topic: true } } }
  });

  if (!video) return;

  const bot = new TelegramBot(token, { polling: false });

  const message = `🎬 *VIDEO READY FOR APPROVAL*

*Title:* ${video.script.topic.title}
*Category:* ${video.script.topic.category}
*Duration:* ${video.duration}s
*QA Score:* ${video.qaScore}/100
*Virality:* ${video.script.topic.viralityScore}/100
*Copyright Risk:* ${copyrightRisk}

Review the video in your dashboard.`;

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ APPROVE', callback_data: `approve_${videoId}` },
            { text: '❌ REJECT', callback_data: `reject_${videoId}` }
          ],
          [
            { text: '🔄 REGENERATE', callback_data: `regen_${videoId}` }
          ]
        ]
      }
    });
    await logToJob(jobId, `Telegram notification sent successfully to ${chatId}.`);
  } catch (error: any) {
    throw new Error(`Telegram error: ${error.message}`);
  }
}
