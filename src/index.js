const cron=require('node-cron');
const config=require('./config');
const{createClient}=require('./wa/client');
const{createSheetsClient}=require('./db/sheets');
const{createSyncJob}=require('./jobs/sync');
const{createBirthdayJob}=require('./jobs/birthday');
const{createReactivationJob}=require('./jobs/reactivation');
async function main(){console.log('🌿 Бот Ботаника v2.0');const wa=createClient(config.whatsapp);const db=createSheetsClient(config.sheets);const status=await wa.getStatus();if(status!=='authorized'){console.error(`[Init] Не авторизован: ${status}`);process.exit(1);}console.log(`[Init] WhatsApp: ${status} ✅`);const syncJob=createSyncJob({wa,db});const birthdayJob=createBirthdayJob({wa,db});const reactivationJob=createReactivationJob({wa,db});const{timezone}=config.schedule;cron.schedule(config.schedule.birthday,()=>{console.log('[Cron] 13:00');birthdayJob.run().catch(e=>console.error(e.message));},{timezone});cron.schedule(config.schedule.sync,()=>{console.log('[Cron] 15:00');syncJob.run().catch(e=>console.error(e.message));},{timezone});cron.schedule(config.schedule.reactivation,()=>{console.log('[Cron] 16:00');reactivationJob.run().catch(e=>console.error(e.message));},{timezone});console.log('✅ 13:00 ДР | 15:00 синхронизация | 16:00 рассылка (20+20+10)');}
main().catch(e=>{console.error(e.message);process.exit(1);});