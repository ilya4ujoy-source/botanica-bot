const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');

const LIMIT_SLEEPING = 20;
const LIMIT_LOST     = 20;
const LIMIT_VERY_OLD = 10;
const PAUSE_SLEEPING = 45;
const PAUSE_LOST     = 60;
const PAUSE_VERY_OLD = 90;

function isValidPhone(p) {
  if (!p || p.includes('@') || p === '0') return false;
  const d = p.replace(/\D/g,''); return d.length>=10 && d.length<=13;
}
function getSegment(days) {
  if (days<30) return 'active'; if (days<60) return 'sleeping';
  if (days<120) return 'lost'; if (days<365) return 'very_old'; return 'dead';
}
function getRealSegment(g) {
  if (!g.lastVisit) return g.status||'unknown';
  return getSegment(dayjs().diff(dayjs(g.lastVisit,'DD.MM.YYYY'),'day'));
}

async function syncChatsToSheet() {
  console.log('[Синхронизация] Запуск...');
  const chats = await whatsapp.getChats();
  console.log(`[Синхронизация] Найдено чатов: ${chats.length}`);
  for (const chat of chats) {
    const phone = chat.id.replace('@c.us','');
    if (!isValidPhone(phone)) continue;
    // Берём lastMessage из getChats — без getChatHistory, без 429
    const lm = chat.lastMessage;
    let lastVisit = '', daysSince = 999;
    if (lm?.timestamp && lm?.type === 'incoming') {
      lastVisit = dayjs.unix(lm.timestamp).format('DD.MM.YYYY');
      daysSince = dayjs().diff(dayjs.unix(lm.timestamp),'day');
    }
    await sheets.upsertGuest({ phone, name: chat.name||'', lastVisit, visitCount: 1, status: getSegment(daysSince) });
  }
  console.log('[Синхронизация] Завершена');
}

async function runReactivation() {
  console.log('[Рассылка] Запуск...');
  let guests;
  try { guests = await sheets.getGuests(); }
  catch(e) { console.error('[Рассылка] Ошибка:', e.message); return; }
  const today = dayjs(); const todayStr = today.format('DD.MM.YYYY');
  function isEligible(g, pause) {
    if (!isValidPhone(g.phone)) return false;
    if (!g.lastMessageSent) return true;
    const d = today.diff(dayjs(g.lastMessageSent,'DD.MM.YYYY'),'day');
    if (d < pause) { console.log(`[Фильтр] ${g.name||g.phone} — пропуск, писали ${d} дн.`); return false; }
    return true;
  }
  const sleeping = guests.filter(g=>getRealSegment(g)==='sleeping' && isEligible(g,PAUSE_SLEEPING)).slice(0,LIMIT_SLEEPING);
  const lost     = guests.filter(g=>getRealSegment(g)==='lost'     && isEligible(g,PAUSE_LOST)).slice(0,LIMIT_LOST);
  const veryOld  = guests.filter(g=>getRealSegment(g)==='very_old' && isEligible(g,PAUSE_VERY_OLD)).slice(0,LIMIT_VERY_OLD);
  console.log(`[Рассылка] Спящих: ${sleeping.length} | Потерянных: ${lost.length} | Очень давних: ${veryOld.length}`);
  async function send(g, msgFn, label) {
    try {
      // Двойная проверка — только 20 сообщений истории, не 50
      const hist = await whatsapp.getChatHistory(whatsapp.formatChatId(g.phone), 20);
      const inc = (hist||[]).filter(m=>m.type==='incoming').sort((a,b)=>b.timestamp-a.timestamp);
      if (inc.length>0 && dayjs().diff(dayjs.unix(inc[0].timestamp),'day')<30) {
        console.log(`[Двойная проверка] ${g.name||g.phone} — активен, пропускаем`); return;
      }
      const profileName = await whatsapp.getContactInfo(g.phone);
      const msg = await msgFn({ name: profileName||g.name||'' });
      const sent = await whatsapp.sendMessage(g.phone, msg);
      if (sent) { await sheets.updateGuestMessageSent(g.rowIndex, todayStr); console.log(`[Рассылка] ${label} ✅ ${profileName||g.name||g.phone}`); }
      await new Promise(r=>setTimeout(r,5000));
    } catch(e) { console.error(`[Рассылка] Ошибка ${g.phone}:`, e.message); }
  }
  for (const g of veryOld)  await send(g, ai.generateVeryOldMessage,  '🧊 Очень давний');
  for (const g of lost)     await send(g, ai.generateLostMessage,     '💤 Потерянный');
  for (const g of sleeping) await send(g, ai.generateSleepingMessage, '😴 Спящий');
  console.log('[Рассылка] Завершено');
}

module.exports = { syncChatsToSheet, runReactivation };