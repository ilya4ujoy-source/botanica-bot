const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { isValidPhone, fromChatId } = require('../utils/phone');
const { brunchMessage } = require('../utils/messages');

const DAILY_LIMIT = 60;      // сообщений в день
const PAUSE_DAYS = 30;       // не писать повторно раньше 30 дней
const MIN_DAYS = 30;         // не писать тем, кто общался меньше 30 дней назад
const MIN_DELAY_MS = 30000;  // пауза 30–60 сек между сообщениями
const MAX_DELAY_MS = 60000;
const STOP_MARK = 'STOP';    // метка отписки в колонке «Дата сообщения»
const STOP_RE = /^\s*(стоп|stop|отписаться|отписка)(?![а-яёa-z])/i;

function getText(m) {
  return m.textMessage || m.extendedTextMessage?.text || m.extendedTextMessageData?.text || '';
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
    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');
    const allGuests = await db.readGuests();

    try { await processStops(allGuests); }
    catch (err) { console.error('[Рассылка] Ошибка обработки СТОП: ' + err.message); }

    const candidates = allGuests.filter(g => {
      if (!isValidPhone(g.phone)) return false;
      if (g.lastMessageSent === STOP_MARK) return false;
      if (g.lastVisit) {
        const daysSinceVisit = today.diff(dayjs(g.lastVisit, 'DD.MM.YYYY'), 'day');
        if (!isNaN(daysSinceVisit) && daysSinceVisit < MIN_DAYS) return false;
      }
      if (g.lastMessageSent) {
        const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
        if (daysSinceSent < PAUSE_DAYS) return false;
      }
      return true;
    });

    // Сначала контакты с датой общения (от недавних к старым), без даты — в конце
    candidates.sort((a, b) => {
      if (a.lastVisit && b.lastVisit) {
        return dayjs(b.lastVisit, 'DD.MM.YYYY').isBefore(dayjs(a.lastVisit, 'DD.MM.YYYY')) ? -1 : 1;
      }
      if (a.lastVisit) return -1;
      if (b.lastVisit) return 1;
      return 0;
    });

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
