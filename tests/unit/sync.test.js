const dayjs = require('dayjs');
const { createSyncJob, getSegment, extractLastIncoming } = require('../../src/jobs/sync');

describe('getSegment', () => {
  test('0 → active',    () => expect(getSegment(0)).toBe('active'));
  test('29 → active',   () => expect(getSegment(29)).toBe('active'));
  test('30 → sleeping', () => expect(getSegment(30)).toBe('sleeping'));
  test('60 → lost',     () => expect(getSegment(60)).toBe('lost'));
  test('120 → very_old',() => expect(getSegment(120)).toBe('very_old'));
  test('365 → dead',    () => expect(getSegment(365)).toBe('dead'));
  test('999 → dead',    () => expect(getSegment(999)).toBe('dead'));
});

describe('extractLastIncoming', () => {
  const now = dayjs('2026-06-04');
  test('входящее — возвращает дату', () => {
    const { lastVisit, daysSinceLastIncoming } = extractLastIncoming({ lastMessage:{ type:'incoming', timestamp:dayjs('2026-05-04').unix() } }, now);
    expect(lastVisit).toBe('04.05.2026'); expect(daysSinceLastIncoming).toBe(31);
  });
  test('исходящее — пустой lastVisit', () => {
    const { lastVisit } = extractLastIncoming({ lastMessage:{ type:'outgoing', timestamp:dayjs('2026-05-04').unix() } }, now);
    expect(lastVisit).toBe('');
  });
  test('нет lastMessage — пустой', () => { expect(extractLastIncoming({ lastMessage:null }, now).lastVisit).toBe(''); });
});

describe('createSyncJob', () => {
  let wa, db, sync;
  beforeEach(() => {
    wa = { getChats: jest.fn() }; db = { readGuests: jest.fn(), upsertGuest: jest.fn() };
    sync = createSyncJob({ wa, db });
    db.readGuests.mockResolvedValue([]); db.upsertGuest.mockResolvedValue();
  });
  test('пропускает невалидные номера', async () => {
    wa.getChats.mockResolvedValue([{ id:'0@c.us',name:'Bad' },{ id:'77051234567@c.us',name:'Алина',lastMessage:{ type:'incoming',timestamp:dayjs().subtract(5,'day').unix() } }]);
    const r = await sync.run(); expect(db.upsertGuest).toHaveBeenCalledTimes(1); expect(r.skipped).toBe(1);
  });
  test('обновляет существующего гостя', async () => {
    const ex = { rowIndex:2, phone:'77051234567', name:'Алина', lastVisit:'01.04.2026', visitCount:5, lastMessageSent:'10.05.2026', status:'lost' };
    db.readGuests.mockResolvedValue([ex]);
    wa.getChats.mockResolvedValue([{ id:'77051234567@c.us',name:'Алина',lastMessage:{ type:'incoming',timestamp:dayjs().subtract(10,'day').unix() } }]);
    const r = await sync.run(); expect(r.updated).toBe(1); expect(r.created).toBe(0);
    expect(db.upsertGuest).toHaveBeenCalledWith(ex, expect.objectContaining({ status:'active' }));
  });
  test('создаёт нового гостя', async () => {
    wa.getChats.mockResolvedValue([{ id:'77059999999@c.us',name:'Новый',lastMessage:{ type:'incoming',timestamp:dayjs().subtract(40,'day').unix() } }]);
    const r = await sync.run(); expect(r.created).toBe(1);
    expect(db.upsertGuest).toHaveBeenCalledWith(null, expect.objectContaining({ status:'sleeping' }));
  });
  test('возвращает статистику', async () => {
    wa.getChats.mockResolvedValue([{ id:'0@c.us',name:'Bad' },{ id:'77051234567@c.us',name:'A',lastMessage:{ type:'incoming',timestamp:dayjs().subtract(5,'day').unix() } }]);
    expect(await sync.run()).toEqual({ updated:0, created:1, skipped:1 });
  });
});