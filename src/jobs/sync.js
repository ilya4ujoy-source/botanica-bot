const dayjs = require('dayjs');
const { isValidPhone } = require('../utils/phone');

const SEGS = [
  { name:'active',   min:0,   max:30  },
  { name:'sleeping', min:30,  max:60  },
  { name:'lost',     min:60,  max:90  },
  { name:'very_old', min:90,  max:365 },
  { name:'dead',     min:365, max:Infinity },
];

function getSegment(days) {
  return (SEGS.find(s => days >= s.min && days < s.max) || SEGS[4]).name;
}

function extractLastContact(chat, now) {
  const lm = chat.lastMessage;
  if (!lm?.timestamp) return { lastVisit: '', daysSinceLastContact: 999 };
  return {
    lastVisit: dayjs.unix(lm.timestamp).format('DD.MM.YYYY'),
    daysSinceLastContact: now.diff(dayjs.unix(lm.timestamp), 'day'),
  };
}

function createSyncJob({ wa, db }) {
  async function run() {
    console.log('[Синхронизация] Запуск...');
    const now = dayjs();
    const chats = await wa.getChats();
    console.log(`[Синхронизация] Чатов: ${chats.length}`);

    const existingGuests = await db.readGuests();
    const idx = new Map(existingGuests.map(g => [g.phone, g]));
    console.log(`[Синхронизация] В таблице: ${existingGuests.length}`);

    let skipped = 0;
    const batchUpdates = [];

    for (const chat of chats) {
      const phone = chat.id?.replace('@c.us', '') || '';
      if (!isValidPhone(phone)) { skipped++; continue; }

      const { lastVisit, daysSinceLastContact } = extractLastContact(chat, now);
      const status = getSegment(daysSinceLastContact);
      const existing = idx.get(phone) || null;

      batchUpdates.push({
        existing,
        updates: {
          phone,
          name: chat.name || '',
          lastVisit,
          visitCount: existing ? existing.visitCount : 1,
          status,
        }
      });
    }

    const toUpdate = batchUpdates.filter(u => u.existing);
    const toCreate = batchUpdates.filter(u => !u.existing);

    console.log(`[Синхронизация] Обновляем: ${toUpdate.length}, добавляем: ${toCreate.length}, пропускаем: ${skipped}`);

    await db.batchUpdateGuests(batchUpdates);

    console.log('[Синхронизация] Готово');
    return { updated: toUpdate.length, created: toCreate.length, skipped };
  }

  return { run };
}

module.exports = { createSyncJob, getSegment, extractLastContact };