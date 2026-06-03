const cron=require('node-cron');
const {runBirthdayCheck}=require('./modules/birthday');
const {syncChatsToSheet,runReactivation}=require('./modules/reactivation');
const {getStatus}=require('./modules/whatsapp');

async function main(){
  console.log('🌿 Бот Ботаника запускается...');
  const status=await getStatus();
  console.log(`[Init] WhatsApp: ${status==='authorized'?status+' ✅':status}`);
  console.log('✅ 13:00 ДР | 15:00 синхронизация | 16:00 рассылка');
  cron.schedule('0 13 * * *',()=>{console.log('[Cron] 13:00');runBirthdayCheck();},{timezone:'Asia/Almaty'});
  cron.schedule('0 15 * * *',()=>{console.log('[Cron] 15:00');syncChatsToSheet();},{timezone:'Asia/Almaty'});
  cron.schedule('0 16 * * *',()=>{console.log('[Cron] 16:00');runReactivation();},{timezone:'Asia/Almaty'});
}
main();