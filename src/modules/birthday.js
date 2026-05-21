const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
dayjs.extend(customParseFormat);
const fs = require('fs');
const path = require('path');
const sheets = require('./sheets');
const whatsapp = require('./whatsapp');
const ai = require('./ai');
const config = require('../config');

// Читаем фото один раз при старте
let birthdayImageBase64 = null;
try {
  const imgPath = path.join(__dirname, '../../assets/birthday.jpg');
  birthdayImageBase64 = fs.readFileSync(imgPath).toString('base64');
  console.log('[ДР] Фото загружено');
} catch (e) {
  console.warn('[ДР] Фото не найдено, будет отправлен только текст:', e.message);
}

async function runBirthdayCheck() {
  console.log('[ДР] Запуск проверки...');
  const today = dayjs();
  const todayStr = today.format('DD.MM.YYYY');
  const currentYear = today.year();

  let guests;
  try { guests = await sheets.getBirthdays(); }
  catch (e) { console.error('[ДР] Ошибка чтения:', e.message); return; }

  for (const guest of guests) {
    if (!guest.phone || !guest.birthday) continue;

    let bday = dayjs(guest.birthday, ['DD.MM.YYYY', 'DD.MM'], true);
    if (!bday.isValid()) continue;

    bday = bday.year(currentYear);
    if (bday.diff(today, 'day') !== config.bot.birthdayDaysBefore) continue;

    console.log(`[ДР] Отправляем: ${guest.name} (${guest.phone})`);
    try {
      const message = await ai.generateBirthdayMessage({ name: guest.name });
      let sent;

      if (birthdayImageBase64) {
        // Отправляем фото с текстом как подпись
        sent = await whatsapp.sendFileByBase64(
          guest.phone,
          birthdayImageBase64,
          'birthday.jpg',
          message
        );
      } else {
        sent = await whatsapp.sendMessage(guest.phone, message);
      }

      if (sent) {
        await sheets.updateBirthdayLastMessage(guest.rowIndex, currentYear);
        await sheets.markGuestContacted(guest.phone, guest.name, todayStr);
        console.log(`[ДР] ✅ ${guest.name}`);
      }

      await new Promise(r => setTimeout(r, 3000));
    } catch (e) {
      console.error(`[ДР] Ошибка для ${guest.name}:`, e.message);
    }
  }
  console.log('[ДР] Проверка завершена');
}

module.exports = { runBirthdayCheck };