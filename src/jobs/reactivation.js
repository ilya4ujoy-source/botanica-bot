const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { validateProfileName } = require('../utils/names');
const { isValidPhone } = require('../utils/phone');
const { brunchMessage } = require('../utils/messages');

const DAILY_LIMIT = 50;
const PAUSE_DAYS = 30;

function createReactivationJob({ wa, db, delayMs = 5000 }) {
  async function run() {
    console.log('[Рассылка] Запуск...');
    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');
    const allGuests = await db.readGuests();

    const candidates = allGuests.filter(g => {
      if (!isValidPhone(g.phone)) return false;
      if (g.lastMessageSent) {
        const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
        if (daysSinceSent < PAUSE_DAYS) return false;
      }
      return true;
    });

    // Sort: contacts WITH lastVisit first (oldest visit first), then contacts WITHOUT lastVisit last
    candidates.sort((a, b) => {
      const hasA = !!a.lastVisit;
      const hasB = !!b.lastVisit;
      if (hasA && hasB) {
        const dateA = dayjs(a.lastVisit, 'DD.MM.YYYY');
        const dateB = dayjs(b.lastVisit, 'DD.MM.YYYY');
        return dateA.isBefore(dateB) ? -1 : 1;
      }
      if (hasA && !hasB) return -1; // a has visit, b doesn't -> a goes first
      if (!hasA && hasB) return 1;  // b has visit, a doesn't -> b goes first
      return 0;
    });

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
        await new Promise(r => setTimeout(r, delayMs));
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
