const dayjs = require('dayjs');
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

const DAILY_LIMIT = 25; // максимум сообщений в день

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
    const lastVisit = lastIncoming ? dayjs.unix(lastIncoming.timestamp).format('DD.MM.YYYY') : '';
    const daysSinceLast = lastIncoming
      ? dayjs().diff(dayjs.unix(lastIncoming.timestamp), 'day') : 999;

    let status = 'active';
    if (daysSinceLast > config.bot.sleepingAfterDays) {
      status = uniqueDays <= 1 ? 'once' : 'sleeping';
    }

    await sheets.upsertGuest({
      phone, name: chat.name || '', lastVisit, visitCount: uniqueDays, status,
    });
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Реактивация] Синхронизация завершена');
}

async function runReactivation() {
  console.log('[Реактивация] Запуск...');
  let guests;
  try { guests = await sheets.getGuests(); }
  catch (e) { console.error('[Реактивация] Ошибка:', e.message); return; }

  const today = dayjs().format('DD.MM.YYYY');

  // Фильтруем кандидатов
  const candidates = guests.filter(g => {
    if (!g.phone) return false;
    if (!['sleeping', 'once'].includes(g.status)) return false;

    // Проверяем паузу 30 дней
    if (g.lastMessageSent) {
      const daysSince = dayjs().diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
      if (daysSince < config.bot.reactivationPauseDays) return false;
    }
    return true;
  });

  // Лимит 25 в день
  const targets = candidates.slice(0, DAILY_LIMIT);
  console.log(`[Реактивация] Кандидатов: ${candidates.length}, отправляем: ${targets.length}`);

  for (const guest of targets) {
    try {
      let message;

      if (guest.status === 'once') {
        // Разовый гость — запрашиваем фидбек
        message = await ai.generateFeedbackMessage({ name: guest.name });
        console.log(`[Реактивация] Фидбек → ${guest.name || guest.phone}`);
      } else {
        // Засыпающий — зовём обратно
        message = await ai.generateSleepingMessage({ name: guest.name });
        console.log(`[Реактивация] Реактивация → ${guest.name || guest.phone}`);
      }

      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateGuestMessageSent(guest.rowIndex, today);
        console.log(`[Реактивация] ✅ ${guest.name || guest.phone}`);
      }

      // 5 секунд между сообщениями — защита от спам-фильтров
      await new Promise(r => setTimeout(r, 5000));
    } catch (e) {
      console.error(`[Реактивация] Ошибка ${guest.phone}:`, e.message);
    }
  }
  console.log('[Реактивация] Завершено');
}

// Обработка входящего ответа от гостя (webhook)
async function handleGuestReply(phone, text) {
  console.log(`[Ответ] Сообщение от ${phone}: ${text}`);
  const guests = await sheets.getGuests();
  const guest = guests.find(g => g.phone === phone || phone.includes(g.phone));

  if (!guest || guest.status !== 'once') return;

  const lower = text.toLowerCase();

  // Определяем: был ли гость у нас
  const wasNotThere = lower.match(/(не был|не дошел|не дошла|не добрался|не добралась|передумал|передумала|не получилось|не смог|не смогла)/);

  if (wasNotThere) {
    const reply = await ai.generateNotVisitedMessage({ name: guest.name });
    await whatsapp.sendMessage(phone, reply);
    await sheets.updateGuestStatus(guest.rowIndex, 'invited');
    console.log(`[Ответ] Не был(а) → отправили приглашение ${guest.name}`);
  } else {
    // Был у нас — благодарим за фидбек
    const n = guest.name ? guest.name.split(' ')[0] : '';
    const thanks = `Спасибо за отзыв${n ? `, ${n}` : ''}! 🙏 Очень рады, что ты был(а) у нас. Твои 3000 бонусов уже начислены — ждём тебя снова в Ботанике 🌿`;
    await whatsapp.sendMessage(phone, thanks);
    await sheets.updateGuestStatus(guest.rowIndex, 'feedback_done');
    console.log(`[Ответ] Фидбек получен → ${guest.name}`);
  }
}

module.exports = { syncChatsToSheet, runReactivation, handleGuestReply };