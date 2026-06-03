const dayjs = require('dayjs');
const { isValidPhone } = require('../utils/phone');

const SEGMENTS = [
  { name:'active',   min:0,   max:30  },
  { name:'sleeping', min:30,  max:60  },
  { name:'lost',     min:60,  max:120 },
  { name:'very_old', min:120, max:365 },
  { name:'dead',     min:365, max:Infinity },
];

function getSegment(days) {
  return (SEGMENTS.find(s => days >= s.min && days < s.max) || SEGMENTS[4]).name;
}

function extractLastIncoming(chat, now) {
  const lm = chat.lastMessage;
  if (!lm?.timestamp || lm?.type !== 'incoming') return { lastVisit:'', daysSinceLastIncoming:999 };
  return { lastVisit: dayjs.unix(lm.timestamp).format('DD.MM.YYYY'), daysSinceLastIncoming: now.diff(dayjs.unix(lm.timestamp),'day') };
}

function createSyncJob({ wa, db }) {
  async function run() {
    console.log('[Синхронизация] Запуск...');
    const now = dayjs();
    const chats = await wa.getChats();
    console.log(`[Синхронизация] Чатов: ${chats.length}`);
    const existingGuests = await db.readGuests();
    const guestIndex = new Map(existingGuests.map(g => [g.phone, g]));
    console.log(`[Синхронизация] В таблице: ${existingGuests.length}`);
    let updated=0, created=0, skipped=0;
    for (const chat of chats) {
      const phone = chat.id?.replace('@c.us','') || '';
      if (!isValidPhone(phone)) { skipped++; continue; }
      const { lastVisit, daysSinceLastIncoming } = extractLastIncoming(chat, now);
      const status = getSegment(daysSinceLastIncoming);
      const existing = guestIndex.get(phone) || null;
      await db.upsertGuest(existing, { phone, name:chat.name||'', lastVisit, visitCount:existing?existing.visitCount:1, status });
      if (existing) { updated++; guestIndex.set(phone,{...existing,lastVisit:lastVisit||existing.lastVisit,status}); }
      else { created++; guestIndex.set(phone,{phone,name:chat.name||'',lastVisit,visitCount:1,lastMessageSent:'',status}); }
    }
    console.log(`[Синхронизация] Готово: обновлено ${updated}, добавлено ${created}, пропущено ${skipped}`);
    return { updated, created, skipped };
  }
  return { run };
}

module.exports = { createSyncJob, getSegment, extractLastIncoming };