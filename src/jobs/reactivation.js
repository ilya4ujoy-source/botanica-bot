const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const { validateProfileName } = require('../utils/names');
const { isValidPhone } = require('../utils/phone');
const { sleepingMessage, lostMessage, veryOldMessage } = require('../utils/messages');

const RULES = {
  sleeping: { limit: 20, msgFn: sleepingMessage, label: '😴 Спящий' },
  lost:     { limit: 20, msgFn: lostMessage,     label: '💤 Потерянный' },
  very_old: { limit: 10, msgFn: veryOldMessage,  label: '🧊 Очень давний' },
};

const PAUSE_DAYS = 30;

function createReactivationJob({ wa, db, delayMs = 5000 }) {
  async function run() {
    console.log('[Рассылка] Запуск...');
    const today = dayjs();
    const todayStr = today.format('DD.MM.YYYY');

    const allGuests = await db.readGuests();
    const targets = {};

    for (const seg of Object.keys(RULES)) {
      targets[seg] = allGuests
        .filter(g => {
          if (!isValidPhone(g.phone)) return false;
          if (g.status !== seg) return false;
          if (g.lastMessageSent) {
            const daysSinceSent = today.diff(dayjs(g.lastMessageSent, 'DD.MM.YYYY'), 'day');
            if (daysSinceSent < PAUSE_DAYS) return false;
          }
          return true;
        })
        .slice(0, RULES[seg].limit);
    }

    console.log(`[Рассылка] Спящих: ${targets.sleeping.length} | Потерянных: ${targets.lost.length} | Очень давних: ${targets.very_old.length}`);

    let sent = 0, skipped = 0;

    for (const seg of ['very_old', 'lost', 'sleeping']) {
      const rule = RULES[seg];
      for (const guest of targets[seg]) {
        try {
          const profileName = await wa.getContactInfo(guest.phone);
          const name = validateProfileName(profileName) || null;
          const msg = rule.msgFn(name);
          const ok = await wa.sendMessage(guest.phone, msg);
          if (ok) {
            await db.markMessageSent(guest.rowIndex, todayStr);
            console.log(`[Рассылка] ${rule.label} ✅ ${name || guest.phone}`);
            sent++;
          }
          await new Promise(r => setTimeout(r, delayMs));
        } catch (err) {
          console.error(`[Рассылка] Ошибка ${guest.phone}:`, err.message);
          skipped++;
        }
      }
    }

    console.log(`[Рассылка] Завершено: отправлено ${sent}, пропущено ${skipped}`);
    return { sent, skipped };
  }

  return { run };
}

module.exports = { createReactivationJob };