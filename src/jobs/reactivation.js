const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { validateProfileName } = require('../utils/names');
const { isValidPhone } = require('../utils/phone');
const { brunchMessage } = require('../utils/messages');

const DAILY_LIMIT = 30;      // не больше 30 сообщений в день
const PAUSE_DAYS = 30;       // не писать повторно раньше 30 дней
const MIN_DAYS = 30;         // гость не общался минимум 30 дней
const MAX_DAYS = 180;        // и не дольше полугода (старые номера не трогаем)
const MIN_DELAY_MS = 30000;  // пауза 30–60 сек между сообщениями
const MAX_DELAY_MS = 60000;

function createReactivationJob({ wa, db }) {
  async function run() {
    console.log('[Рассылка] Запуск...');
    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');
    const allGuests = await db.readGuests();

    const candidates = allGuests.filter(g => {
      if (!isValidPhone(g.phone)) return false;
      if (!g.lastVisit) return false;
      const daysSinceVisit = today.diff(dayjs(g.lastVisit, 'DD.MM.YYYY'), 'day');
      if (isNaN(daysSinceVisit) || daysSinceVisit < MIN_DAYS || daysSinceVisit > MAX_DAYS) return false;
      if (g.lastMessageSent) {
        const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
        if (daysSinceSent < PAUSE_DAYS) return false;
      }
      return true;
    });

    // Сначала те, кто дольше всего не общался
    candidates.sort((a, b) =>
      dayjs(a.lastVisit, 'DD.MM.YYYY').isBefore(dayjs(b.lastVisit, 'DD.MM.YYYY')) ? -1 : 1
    );

    const targets = candidates.slice(0, DAILY_LIMIT);
    console.log('[Рассылка] Кандидатов: ' + candidates.length + ' | Отправляем: ' + targets.length);

    let sent = 0, skipped = 0;
    for (const guest of targets) {
      try {
        const profileName = await wa.getContactInfo(guest.phone);
        const name = validateProfileName(profileName) || null;
        const msg = brunchMessage(name);
        const ok = await wa.sendMessage(guest.phone, msg);
        if (ok) {
          await db.markMessageSent(guest.rowIndex, todayStr);
          console.log('[Рассылка] OK ' + (name || guest.phone));
          sent++;
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
