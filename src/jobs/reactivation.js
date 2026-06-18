const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { validateProfileName } = require('../utils/names');
const { isValidPhone } = require('../utils/phone');
const { lostMessage } = require('../utils/messages');

const DAILY_LIMIT = 60;
const PAUSE_DAYS = 30;

function createReactivationJob({ wa, db, delayMs = 5000 }) {
  async function run() {
    console.log('[Рассылка] Запуск...');
    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');

    const allGuests = await db.readGuests();

    // Фильтруем: валидный номер + пауза 30 дней прошла
    const candidates = allGuests.filter(g => {
      if (!isValidPhone(g.phone)) return false;
      if (g.lastMessageSent) {
        const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
        if (daysSinceSent < PAUSE_DAYS) return false;
      }
      return true;
    });

    // Сортируем — сначала самые давние (у кого lastVisit пустой — в начало)
    candidates.sort((a, b) => {
      if (!a.lastVisit && !b.lastVisit) return 0;
      if (!a.lastVisit) return -1;
      if (!b.lastVisit) return 1;
      const dateA = dayjs(a.lastVisit, 'DD.MM.YYYY');
      const dateB = dayjs(b.lastVisit, 'DD.MM.YYYY');
      return dateA.isBefore(dateB) ? -1 : 1;
    });

    // Берём первые 60
    const targets = candidates.slice(0, DAILY_LIMIT);

    console.log(`[Рассылка] Кандидатов: ${candidates.length} | Отправляем: ${targets.length}`);

    let sent = 0, skipped = 0;

    for (const guest of targets) {
      try {
        const profileName = await wa.getContactInfo(guest.phone);
        const name = validateProfileName(profileName) || null;
                const msg = lostMessage(name);
        const ok = await wa.sendMessage(guest.phone, msg);
        if (ok) {
          await db.markMessageSent(guest.rowIndex, todayStr);
          console.log(`[Рассылка] ✅ ${name || guest.phone}`);
          sent++;
        }
        await new Promise(r => setTimeout(r, delayMs));
      } catch (err) {
        console.error(`[Рассылка] Ошибка ${guest.phone}:`, err.message);
        skipped++;
      }
    }

    console.log(`[Рассылка] Завершено: отправлено ${sent}, пропущено ${skipped}`);
    return { sent, skipped };
  }

  return { run };
}

module.exports = { createReactivationJob };