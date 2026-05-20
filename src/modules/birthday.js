const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

const BIRTHDAY_GIFT = process.env.BIRTHDAY_GIFT || null;

async function runBirthdayCheck() {
  console.log('[ДР] Запуск проверки дней рождений...');
  const today = dayjs();
  const currentYear = today.year();
  let guests;
  try {
    guests = await sheets.getBirthdays();
  } catch (e) {
    console.error('[ДР] Ошибка чтения таблицы:', e.message);
    return;
  }
  for (const guest of guests) {
    if (!guest.phone || !guest.birthday) continue;
    let bday = dayjs(guest.birthday, ['DD.MM.YYYY', 'DD.MM'], true);
    if (!bday.isValid()) { console.warn(`[ДР] Неверная дата у ${guest.name}: ${guest.birthday}`); continue; }
    bday = bday.year(currentYear);
    const diff = bday.diff(today, 'day');
    if (diff !== config.bot.birthdayDaysBefore) continue;
    if (String(guest.lastMessageYear) === String(currentYear)) {
      console.log(`[ДР] Уже писали ${guest.name} в ${currentYear}, пропуск`);
      continue;
    }
    console.log(`[ДР] Отправляем поздравление: ${guest.name} (${guest.phone})`);
    try {
      const message = await ai.generateBirthdayMessage({ name: guest.name, giftDescription: BIRTHDAY_GIFT });
      const sent = await whatsapp.sendMessage(guest.phone, message);
      if (sent) {
        await sheets.updateBirthdayLastMessage(guest.rowIndex, currentYear);
        console.log(`[ДР] ✅ Отправлено ${guest.name}`);
      }
      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`[ДР] Ошибка для ${guest.name}:`, e.message);
    }
  }
  console.log('[ДР] Проверка завершена');
}

module.exports = { runBirthdayCheck };