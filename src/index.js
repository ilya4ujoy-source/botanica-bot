require('dotenv').config();
const cron = require('node-cron');
const whatsapp = require('./modules/whatsapp');
const birthday = require('./modules/birthday');
const reactivation = require('./modules/reactivation');

console.log('🌿 Бот Ботаника запускается...');

async function init() {
  const status = await whatsapp.getStatus();
  console.log(`[Init] Статус WhatsApp: ${status}`);
  if (status !== 'authorized') {
    console.error('[Init] ⚠️ WhatsApp не авторизован! Проверь QR-код в Green API.');
  }

  // 13:00 — проверка дней рождений
  cron.schedule('0 13 * * *', async () => {
    console.log('\n⏰ Cron: Проверка дней рождений');
    await birthday.runBirthdayCheck();
  }, { timezone: 'Asia/Almaty' });

  // 14:00 — синхронизация чатов
  cron.schedule('0 14 * * *', async () => {
    console.log('\n⏰ Cron: Синхронизация чатов');
    await reactivation.syncChatsToSheet();
  }, { timezone: 'Asia/Almaty' });

  // 15:00 — рассылка реактивации
  cron.schedule('0 15 * * *', async () => {
    console.log('\n⏰ Cron: Реактивация гостей');
    await reactivation.runReactivation();
  }, { timezone: 'Asia/Almaty' });

  console.log('✅ Расписание:');
  console.log('   • 13:00 — проверка дней рождений');
  console.log('   • 14:00 — синхронизация чатов');
  console.log('   • 15:00 — рассылка (макс 25 чел/день)');
}

if (process.env.RUN_BIRTHDAY_NOW === 'true') {
  birthday.runBirthdayCheck().then(() => process.exit(0));
} else if (process.env.RUN_REACTIVATION_NOW === 'true') {
  reactivation.syncChatsToSheet()
    .then(() => reactivation.runReactivation())
    .then(() => process.exit(0));
} else {
  init().catch(console.error);
}