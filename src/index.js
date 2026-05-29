const cron = require('node-cron');
const { runBirthdayCheck } = require('./modules/birthday');
const { syncChatsToSheet, runReactivation } = require('./modules/reactivation');
const { getStatus } = require('./modules/whatsapp');

async function main() {
  console.log('🌿 Бот Ботаника запускается...');
  const status = await getStatus();
  console.log('[Init] Статус WhatsApp: ' + (status === 'authorized' ? status + ' ✅' : status));
  console.log('✅ Расписание:');
  console.log('• 13:00 — проверка дней рождений');
  console.log('• 15:00 — синхронизация чатов');
  console.log('• 16:00 — рассылка (20 спящих + 20 потерянных + 10 давних)');

  // Разовый запуск СЕГОДНЯ
  console.log('[Init] Разовый запуск: синхронизация через 1 мин, рассылка через 3 мин...');
  setTimeout(() => { console.log('[Cron] Разовый запуск — Синхронизация'); syncChatsToSheet(); }, 1 * 60 * 1000);
  setTimeout(() => { console.log('[Cron] Разовый запуск — Рассылка'); runReactivation(); }, 3 * 60 * 1000);

  // Ежедневное расписание
  cron.schedule('0 13 * * *', () => { console.log('[Cron] 13:00 — ДР'); runBirthdayCheck(); }, { timezone: 'Asia/Almaty' });
  cron.schedule('0 15 * * *', () => { console.log('[Cron] 15:00 — Синхронизация'); syncChatsToSheet(); }, { timezone: 'Asia/Almaty' });
  cron.schedule('0 16 * * *', () => { console.log('[Cron] 16:00 — Рассылка'); runReactivation(); }, { timezone: 'Asia/Almaty' });
}

main();