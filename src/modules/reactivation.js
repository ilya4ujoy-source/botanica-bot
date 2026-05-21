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

    // Три статуса: active / sleeping / lost
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
  console.log(`[Реактивация] Запуск... лимит ${DAILY_LIMIT} чел/день`);
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }

  const today = dayjs().format('DD.MM.YYYY');

  const candidates = guests.filter(g => {
    if (!g.phone) return false;
    if (!['sleeping', 'lost'].includes(g.status)) return false;

    // Не писали 30+ дней (защита от дублей с ДР тоже здесь)
    if (g.lastMessageSent) {
      const daysSince = dayjs().diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
      if (daysSince < config.bot.reactivationPauseDays) return false;
    }
    return true;
  });

  // Сначала потерянные (60+ дней), потом спящие (30-60 дней)
  const lost = candidates.filter(g => g.status === 'lost');
  const sleeping = candidates.filter(g => g.status === 'sleeping');
  const targets = [...lost, ...sleeping].slice(0, DAILY_LIMIT);

  console.log(`[Реактивация] Потерянных: ${lost.length}, спящих: ${sleeping.length}, сегодня пишем: ${targets.length}`);

  for (const guest of targets) {
    try {
      let message;
      if (guest.status === 'lost') {
        message = await ai.generateLostMessage({ name: guest.name });
        console.log(`[Реактивация] 💤 Потерянный → ${guest.name || guest.phone}`);
      } else {
        message = await ai.generateSleepingMessage({ name: guest.name });
        console.log(`[Реактивация] 😴 Спящий → ${guest.name || guest.phone}`);
      }

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