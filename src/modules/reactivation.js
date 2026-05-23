const dayjs = require('dayjs');
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

const LIMIT_SLEEPING = 15;
const LIMIT_LOST = 15;

// Фильтр мусорных контактов
function isValidPhone(phone) {
  if (!phone) return false;
  if (phone.includes('@')) return false;       // broadcast, группы
  if (phone === '0') return false;             // WhatsApp Business
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10 || digits.length > 13) return false; // не телефон
  return true;
}

async function syncChatsToSheet() {
  console.log('[Реактивация] Синхронизация чатов...');
  const chats = await whatsapp.getChats();
  console.log(`[Реактивация] Найдено чатов: ${chats.length}`);

  for (const chat of chats) {
    const phone = chat.id.replace('@c.us', '');
    if (!isValidPhone(phone)) continue;

    const history = await whatsapp.getChatHistory(chat.id, 200);
    const guestMessages = history.filter(m => m.type === 'incoming');
    const uniqueDays = new Set(
      guestMessages.map(m => dayjs.unix(m.timestamp).format('YYYY-MM-DD'))
    ).size;
    const lastIncoming = guestMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
    const lastVisit = lastIncoming
      ? dayjs.unix(lastIncoming.timestamp).format('DD.MM.YYYY') : '';
    const daysSinceLast = lastIncoming
      ? dayjs().diff(dayjs.unix(lastIncoming.timestamp), 'day') : 999;

    let status = 'active';
    if (daysSinceLast >= config.bot.lostAfterDays) {
      status = 'lost';
    } else if (daysSinceLast >= config.bot.sleepingAfterDays) {
      status = 'sleeping';
    }

    await sheets.upsertGuest({
      phone, name: chat.name || '', lastVisit, visitCount: uniqueDays, status,
    });
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Реактивация] Синхронизация завершена');
}

async function runReactivation() {
  console.log(`[Реактивация] Запуск... лимит: ${LIMIT_SLEEPING} спящих + ${LIMIT_LOST} потерянных`);
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }

  const today = dayjs().format('DD.MM.YYYY');

  const eligible = guests.filter(g => {
    if (!isValidPhone(g.phone)) return false;
    if (!['sleeping', 'lost'].includes(g.status)) return false;
    if (g.lastMessageSent) {
      const daysSince = dayjs().diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
      if (daysSince < config.bot.reactivationPauseDays) {
        console.log(`[Фильтр] ${g.name || g.phone} — пропуск, писали ${daysSince} дн. назад`);
        return false;
      }
    }
    return true;
  });

  const sleepingTargets = eligible.filter(g => g.status === 'sleeping').slice(0, LIMIT_SLEEPING);
  const lostTargets = eligible.filter(g => g.status === 'lost').slice(0, LIMIT_LOST);

  console.log(`[Реактивация] К отправке: ${sleepingTargets.length} спящих, ${lostTargets.length} потерянных`);

  for (const guest of lostTargets) {
    try {
      const message = await ai.generateLostMessage({ name: guest.name });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, today);
        console.log(`[Реактивация] 💤 Потерянный ✅ ${guest.name || guest.phone}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[Реактивация] Ошибка ${guest.phone}:`, e.message);
    }
  }

  for (const guest of sleepingTargets) {
    try {
      const message = await ai.generateSleepingMessage({ name: guest.name });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, today);
        console.log(`[Реактивация] 😴 Спящий ✅ ${guest.name || guest.phone}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[Реактивация] Ошибка ${guest.phone}:`, e.message);
    }
  }

  console.log('[Реактивация] Завершено');
}

module.exports = { syncChatsToSheet, runReactivation };