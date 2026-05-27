const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');

const LIMIT_SLEEPING  = 20;
const LIMIT_LOST      = 20;
const LIMIT_VERY_OLD  = 10;

const PAUSE_SLEEPING  = 45;
const PAUSE_LOST      = 60;
const PAUSE_VERY_OLD  = 90;

function isValidPhone(phone) {
  if (!phone) return false;
  if (phone.includes('@')) return false;
  if (phone === '0') return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return false;
  return true;
}

function getSegment(days) {
  if (days < 30)  return 'active';
  if (days < 60)  return 'sleeping';
  if (days < 120) return 'lost';
  if (days < 365) return 'very_old';
  return 'dead';
}

// Считаем реальный сегмент по дате последнего визита
// НЕ доверяем полю status — оно могло устареть
function getRealSegment(guest) {
  if (!guest.lastVisit) return guest.status || 'unknown';
  const days = dayjs().diff(dayjs(guest.lastVisit, 'DD.MM.YYYY'), 'day');
  return getSegment(days);
}

async function getLastIncomingDaysAgo(phone) {
  try {
    const chatId = whatsapp.formatChatId(phone);
    const history = await whatsapp.getChatHistory(chatId, 50);
    const incoming = history
      .filter(m => m.type === 'incoming')
      .sort((a, b) => b.timestamp - a.timestamp);
    if (!incoming.length) return 999;
    return dayjs().diff(dayjs.unix(incoming[0].timestamp), 'day');
  } catch (e) {
    return 999;
  }
}

async function syncChatsToSheet() {
  console.log('[Реактивация] Синхронизация чатов...');
  const chats = await whatsapp.getChats();
  console.log(`[Реактивация] Найдено чатов: ${chats.length}`);
  for (const chat of chats) {
    const phone = chat.id.replace('@c.us', '');
    if (!isValidPhone(phone)) continue;
    const profileName = await whatsapp.getContactInfo(phone);
    await new Promise(r => setTimeout(r, 300));
    const history = await whatsapp.getChatHistory(chat.id, 200);
    const guestMessages = history.filter(m => m.type === 'incoming');
    const uniqueDays = new Set(guestMessages.map(m => dayjs.unix(m.timestamp).format('YYYY-MM-DD'))).size;
    const lastIncoming = guestMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
    const lastVisit = lastIncoming ? dayjs.unix(lastIncoming.timestamp).format('DD.MM.YYYY') : '';
    const daysSinceLast = lastIncoming ? dayjs().diff(dayjs.unix(lastIncoming.timestamp), 'day') : 999;
    await sheets.upsertGuest({ phone, name: profileName || '', lastVisit, visitCount: uniqueDays, status: getSegment(daysSinceLast) });
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Реактивация] Синхронизация завершена');
}

async function runReactivation() {
  console.log('[Реактивация] Запуск...');
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }

  const today = dayjs();
  const todayStr = today.format('DD.MM.YYYY');

  function isEligible(g, pauseDays) {
    if (!isValidPhone(g.phone)) return false;
    if (!g.lastMessageSent) return true;
    const daysSince = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
    if (daysSince < pauseDays) {
      console.log(`[Фильтр] ${g.name || g.phone} — пропуск, писали ${daysSince} дн. назад`);
      return false;
    }
    return true;
  }

  const sleepingTargets = guests.filter(g => getRealSegment(g) === 'sleeping'  && isEligible(g, PAUSE_SLEEPING)).slice(0, LIMIT_SLEEPING);
  const lostTargets     = guests.filter(g => getRealSegment(g) === 'lost'      && isEligible(g, PAUSE_LOST)).slice(0, LIMIT_LOST);
  const veryOldTargets  = guests.filter(g => getRealSegment(g) === 'very_old'  && isEligible(g, PAUSE_VERY_OLD)).slice(0, LIMIT_VERY_OLD);

  console.log(`[Реактивация] Спящих: ${sleepingTargets.length} | Потерянных: ${lostTargets.length} | Очень давних: ${veryOldTargets.length}`);

  async function send(guest, msgFn, label) {
    try {
      const daysAgo = await getLastIncomingDaysAgo(guest.phone);
      if (daysAgo < 30) {
        console.log(`[Двойная проверка] ${guest.name || guest.phone} — написал ${daysAgo} дн. назад, пропускаем`);
        return;
      }
      const message = await msgFn({ name: guest.name });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, todayStr);
        console.log(`[Реактивация] ${label} ✅ ${guest.name || guest.phone}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[Реактивация] Ошибка ${guest.phone}:`, e.message);
    }
  }

  for (const g of veryOldTargets)  await send(g, ai.generateVeryOldMessage,  '🧊 Очень давний');
  for (const g of lostTargets)     await send(g, ai.generateLostMessage,     '💤 Потерянный');
  for (const g of sleepingTargets) await send(g, ai.generateSleepingMessage, '😴 Спящий');

  console.log('[Реактивация] Завершено');
}

module.exports = { syncChatsToSheet, runReactivation };