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

  cron.schedule('0 10 * * *', async () => {
    console.log('\n⏰ Cron: Проверка дней рождений');
    await birthday.runBirthdayCheck();
  }, { timezone: 'Asia/Almaty' });

  cron.schedule('0 12 * * 3', async () => {
    console.log('\n⏰ Cron: Синхронизация чатов');
    await reactivation.syncChatsToSheet();
  }, { timezone: 'Asia/Almaty' });

  cron.schedule('0 14 * * 5', async () => {
    console.log('\n⏰ Cron: Реактивация гостей');
    await reactivation.runReactivation();
  }, { timezone: 'Asia/Almaty' });

  console.log('✅ Все задачи запущены:');
  console.log('   • Проверка ДР: каждый день в 10:00');
  console.log('   • Синхронизация чатов: каждую среду в 12:00');
  console.log('   • Реактивация: каждую пятницу в 14:00');
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