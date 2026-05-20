const dayjs = require('dayjs');
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

const DAILY_LIMIT = 25;

async function syncChatsToSheet() {
  console.log('[Реактивация] Синхронизация чатов...');
  const chats = await whatsapp.getChats();
  console.log(`[Реактивация] Найдено чатов: ${chats.length}`);

  for (const chat of chats) {
    const phone = chat.id.replace('@c.us', '');
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

    const status = daysSinceLast > config.bot.sleepingAfterDays ? 'sleeping' : 'active';

    await sheets.upsertGuest({
      phone, name: chat.name || '', lastVisit, visitCount: uniqueDays, status,
    });
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Реактивация] Синхронизация завершена');
}

async function runReactivation() {
  console.log(`[Реактивация] Запуск... лимит ${DAILY_LIMIT} чел/день`);
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }

  const today = dayjs().format('DD.MM.YYYY');

  const candidates = guests.filter(g => {
    if (!g.phone) return false;
    if (g.status !== 'sleeping') return false;
    if (g.lastMessageSent) {
      const daysSince = dayjs().diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
      if (daysSince < config.bot.reactivationPauseDays) return false;
    }
    return true;
  });

  const targets = candidates.slice(0, DAILY_LIMIT);
  console.log(`[Реактивация] Кандидатов: ${candidates.length}, сегодня: ${targets.length}`);

  for (const guest of targets) {
    try {
      const message = await ai.generateSleepingMessage({ name: guest.name });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, today);
        console.log(`[Реактивация] ✅ ${guest.name || guest.phone}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[Реактивация] Ошибка ${guest.phone}:`, e.message);
    }
  }
  console.log('[Реактивация] Завершено');
}

module.exports = { syncChatsToSheet, runReactivation };