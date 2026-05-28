const cron = require('node-cron');
const { runBirthdayCheck } = require('./modules/birthday');
const { syncChatsToSheet, runReactivation } = require('./modules/reactivation');
const { getStatus } = require('./modules/whatsapp');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🌿 Бот Ботаника запускается...');

  // Одноразовый фикс имён в таблице ДР
  const fixFlag = path.join(__dirname, '../.names-fixed');
  if (!fs.existsSync(fixFlag)) {
    try {
      console.log('[Fix] Запускаем исправление имён в таблице...');
      await require('../scripts/fix-birthday-names')();
      fs.writeFileSync(fixFlag, new Date().toISOString());
      console.log('[Fix] ✅ Имена исправлены');
    } catch (e) {
      console.error('[Fix] Ошибка:', e.message);
    }
  }

  const status = await getStatus();
  console.log(`[Init] Статус WhatsApp: ${status === 'authorized' ? status + ' ✅' : status}`);

  console.log('✅ Расписание:');
  console.log('• 13:00 — проверка дней рождений');
  console.log('• 14:00 — синхронизация чатов');
  console.log('• 15:00 — рассылка (20 спящих + 20 потерянных + 10 давних)');

  cron.schedule('0 13 * * *', () => { console.log('[Cron] 13:00 — ДР'); runBirthdayCheck(); }, { timezone: 'Asia/Almaty' });
  cron.schedule('0 14 * * *', () => { console.log('[Cron] 14:00 — Синхронизация'); syncChatsToSheet(); }, { timezone: 'Asia/Almaty' });
  cron.schedule('0 15 * * *', () => { console.log('[Cron] 15:00 — Рассылка'); runReactivation(); }, { timezone: 'Asia/Almaty' });
}

main();