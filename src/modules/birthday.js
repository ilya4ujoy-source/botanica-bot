const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

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
    if (!bday.isValid()) {
      console.warn(`[ДР] Неверная дата у ${guest.name}: ${guest.birthday}`);
      continue;
    }

    // Проверяем ДР в текущем году
    bday = bday.year(currentYear);
    const diff = bday.diff(today, 'day');

    // Пишем всем у кого ДР через 7 дней — без проверки писали ли раньше
    if (diff !== config.bot.birthdayDaysBefore) continue;

    console.log(`[ДР] Отправляем поздравление: ${guest.name} (${guest.phone})`);
    try {
      const message = await ai.generateBirthdayMessage({ name: guest.name });
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