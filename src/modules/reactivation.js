const dayjs = require('dayjs');
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

async function syncChatsToSheet() {
  console.log('[Реактивация] Синхронизация чатов...');
  const chats = await whatsapp.getChats();
  console.log(`[Реактивация] Найдено чатов: ${chats.length}`);
  for (const chat of chats) {
    const phone = chat.id.replace('@c.us', '');
    const history = await whatsapp.getChatHistory(chat.id, 200);
    const guestMessages = history.filter(m => m.type === 'incoming');
    const uniqueDays = new Set(guestMessages.map(m => dayjs.unix(m.timestamp).format('YYYY-MM-DD'))).size;
    const lastIncoming = guestMessages.sort((a, b) => b.timestamp - a.timestamp)[0];
    const lastVisit = lastIncoming ? dayjs.unix(lastIncoming.timestamp).format('DD.MM.YYYY') : '';
    const daysSinceLast = lastIncoming ? dayjs().diff(dayjs.unix(lastIncoming.timestamp), 'day') : 999;
    let status = 'active';
    if (daysSinceLast > config.bot.lostAfterDays) {
      status = uniqueDays <= 1 ? 'once' : 'lost';
    } else if (daysSinceLast > config.bot.sleepingAfterDays) {
      status = 'sleeping';
    }
    await sheets.upsertGuest({ phone, name: chat.name || '', lastVisit, visitCount: uniqueDays, status });
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Реактивация] Синхронизация завершена');
}

async function runReactivation() {
  console.log('[Реактивация] Запуск...');
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }
  const targets = guests.filter(g => {
    if (!g.phone) return false;
    if (!['sleeping','lost','once'].includes(g.status)) return false;
    if (g.lastMessageSent) {
      const daysSince = dayjs().diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
      if (daysSince < config.bot.reactivationPauseDays) return false;
    }
    return true;
  });
  console.log(`[Реактивация] Гостей для сообщений: ${targets.length}`);
  for (const guest of targets) {
    try {
      const message = await ai.generateReactivationMessage({ name: guest.name, status: guest.status, visitCount: guest.visitCount, lastVisit: guest.lastVisit });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, dayjs().format('DD.MM.YYYY'));
        console.log(`[Реактивация] ✅ Отправлено ${guest.name || guest.phone}`);
      }
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) { console.error(`[Реактивация] Ошибка для ${guest.phone}:`, e.message); }
  }
  console.log('[Реактивация] Завершено');
}

module.exports = { syncChatsToSheet, runReactivation };