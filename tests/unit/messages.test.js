const { sleepingMessage, lostMessage, veryOldMessage, birthdayMessage, LINKS } = require('../../src/utils/messages');
const has = (str, sub) => str.includes(sub);
describe('sleepingMessage', () => {
  test('с именем', () => expect(has(sleepingMessage('Алина'), 'Алина, споём?')).toBe(true));
  test('без имени', () => expect(sleepingMessage(null).startsWith('Споём?')).toBe(true));
  test('нет null в тексте', () => expect(has(sleepingMessage(null), 'null')).toBe(false));
  test('ссылка', () => expect(has(sleepingMessage('Алина'), LINKS.sleeping)).toBe(true));
  test('🎤', () => expect(has(sleepingMessage('Алина'), '🎤')).toBe(true));
  test('забронировать', () => expect(has(sleepingMessage('Алина'), 'Забронировать столик?')).toBe(true));
});
describe('lostMessage', () => {
  test('с именем', () => expect(has(lostMessage('Максим'), 'Эй, Максим!')).toBe(true));
  test('без имени', () => expect(lostMessage(null).startsWith('Эй!')).toBe(true));
  test('3000 бонусов', () => expect(has(lostMessage('Максим'), '3000 бонусов')).toBe(true));
  test('ссылка', () => expect(has(lostMessage('Максим'), LINKS.lost)).toBe(true));
  test('нет null в тексте', () => expect(has(lostMessage(null), 'null')).toBe(false));
});
describe('veryOldMessage', () => {
  test('с именем', () => expect(has(veryOldMessage('Айгерим'), 'Айгерим, сколько времени прошло!')).toBe(true));
  test('без имени', () => expect(veryOldMessage(null).startsWith('Сколько времени прошло!')).toBe(true));
  test('5000 бонусов', () => expect(has(veryOldMessage('Айгерим'), '5000 бонусов')).toBe(true));
  test('ссылка', () => expect(has(veryOldMessage('Айгерим'), LINKS.veryOld)).toBe(true));
  test('нет null в тексте', () => expect(has(veryOldMessage(null), 'null')).toBe(false));
});
describe('birthdayMessage', () => {
  test('с именем', () => expect(has(birthdayMessage('Дарья'), 'Привет, Дарья! 🎉')).toBe(true));
  test('без имени', () => expect(birthdayMessage(null).startsWith('Привет! 🎉')).toBe(true));
  test('шампанское', () => expect(has(birthdayMessage('Дарья'), 'шампанского')).toBe(true));
  test('скидка 15%', () => expect(has(birthdayMessage('Дарья'), '15%')).toBe(true));
  test('ссылка', () => expect(has(birthdayMessage('Дарья'), LINKS.birthday)).toBe(true));
  test('нет null в тексте', () => expect(has(birthdayMessage(null), 'null')).toBe(false));
});
describe('LINKS', () => {
  test('все instagram reel', () => Object.values(LINKS).forEach(l => expect(l.startsWith('https://www.instagram.com/reel/')).toBe(true)));
  test('4 ссылки', () => expect(Object.keys(LINKS)).toHaveLength(4));
});