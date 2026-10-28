const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { isValidPhone, fromChatId } = require('../utils/phone');
const { brunchMessage } = require('../utils/messages');

// Безопасный режим: чтобы WhatsApp не отвязывал бота
const DAILY_LIMIT = 30;       // не больше 30 сообщений в день
const PAUSE_DAYS = 30;        // не писать повторно раньше 30 дней
const MIN_DAYS = 30;          // гость не общался минимум 30 дней
const MAX_DAYS = 180;         // и не дольше полугода (холодную базу не трогаем)
const MIN_DELAY_MS = 120000;  // пауза 2–4 минуты между сообщениями
const MAX_DELAY_MS = 240000;
const STOP_MARK = 'STOP';
const STOP_RE = /^\s*(стоп|stop|отписаться|отписка)(?![а-яёa-z])/i;

// 15.10–28.10 WhatsApp был отвязан, сообщения не дошли — эти даты не считаем отправкой
const LOST_FROM = dayjs('15.10.2026', 'DD.MM.YYYY');
const LOST_TO = dayjs('28.10.2026', 'DD.MM.YYYY');

function getText(m) {
  return m.textMessage || m.extendedTextMessage?.text || m.extendedTextMessageData?.text || '';
}

function wasReallySent(dateStr) {
  const d = dayjs(dateStr, 'DD.MM.YYYY');
  if (!d.isValid()) return false;
  return d.isBefore(LOST_FROM, 'day') || d.isAfter(LOST_TO, 'day');
}

function createReactivationJob({ wa, db }) {
  async function processStops(allGuests) {
    const incoming = await wa.getIncomingMessages();
    const stopPhones = new Set(
      incoming.filter(m => STOP_RE.test(getText(m))).map(m => fromChatId(m.chatId || ''))
    );
    let marked = 0;
    for (const g of allGuests) {
      if (stopPhones.has(g.phone) && g.lastMessageSent !== STOP_MARK) {
        await db.markMessageSent(g.rowIndex, STOP_MARK);
        g.lastMessageSent = STOP_MARK;
        marked++;
      }
    }
    console.log('[Рассылка] Отписались (СТОП): ' + marked);
  }

  async function run() {
    console.log('[Рассылка] Запуск...');
    const status = await wa.getStatus();
    if (status !== 'authorized') {
      console.error('[Рассылка] ⛔ WhatsApp не авторизован (' + status + ') — рассылка отменена. Переподключите QR в Green API.');
      return { sent: 0, skipped: 0 };
    }

    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');
    const allGuests = await db.readGuests();

    try { await processStops(allGuests); }
    catch (err) { console.error('[Рассылка] Ошибка обработки СТОП: ' + err.message); }

    const candidates = allGuests.filter(g => {
      if (!isValidPhone(g.phone)) return false;
      if (g.lastMessageSent === STOP_MARK) return false;
      if (!g.lastVisit) return false;
      const daysSinceVisit = today.diff(dayjs(g.lastVisit, 'DD.MM.YYYY'), 'day');
      if (isNaN(daysSinceVisit) || daysSinceVisit < MIN_DAYS || daysSinceVisit > MAX_DAYS) return false;
      if (g.lastMessageSent && wasReallySent(g.lastMessageSent)) {
        const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
        if (daysSinceSent < PAUSE_DAYS) return false;
      }
      return true;
    });

    // Сначала те, кто общался недавно — они охотнее отвечают и реже жалуются
    candidates.sort((a, b) =>
      dayjs(b.lastVisit, 'DD.MM.YYYY').isBefore(dayjs(a.lastVisit, 'DD.MM.YYYY')) ? -1 : 1
    );

    const targets = candidates.slice(0, DAILY_LIMIT);
    console.log('[Рассылка] Кандидатов: ' + candidates.length + ' | Отправляем: ' + targets.length);

    let sent = 0, skipped = 0;
    for (const guest of targets) {
      try {
        const ok = await wa.sendMessage(guest.phone, brunchMessage());
        if (ok) {
          await db.markMessageSent(guest.rowIndex, todayStr);
          console.log('[Рассылка] OK ' + guest.phone);
          sent++;
        } else {
          skipped++;
          const st = await wa.getStatus();
          if (st !== 'authorized') {
            console.error('[Рассылка] ⛔ WhatsApp отвязался во время рассылки (' + st + ') — останавливаемся.');
            break;
          }
        }
        const pause = MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
        await new Promise(r => setTimeout(r, pause));
      } catch (err) {
        console.error('[Рассылка] Ошибка ' + guest.phone + ': ' + err.message);
        skipped++;
      }
    }
    console.log('[Рассылка] Завершено: ' + sent + ' отправлено, ' + skipped + ' пропущено');
    return { sent, skipped };
  }
  return { run };
}

module.exports = { createReactivationJob };
