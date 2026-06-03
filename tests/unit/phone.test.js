const { isValidPhone, toChatId, fromChatId } = require('../../src/utils/phone');
describe('isValidPhone', () => {
  test('казахский номер', () => expect(isValidPhone('77051234567')).toBe(true));
  test('российский номер', () => expect(isValidPhone('79001234567')).toBe(true));
  test('номер со спецсимволами', () => expect(isValidPhone('+7 705 123-45-67')).toBe(true));
  test('13 цифр', () => expect(isValidPhone('9999999999999')).toBe(true));
  test('undefined', () => expect(isValidPhone(undefined)).toBe(false));
  test('null', () => expect(isValidPhone(null)).toBe(false));
  test('пустая строка', () => expect(isValidPhone('')).toBe(false));
  test('ноль', () => expect(isValidPhone('0')).toBe(false));
  test('группа @g.us', () => expect(isValidPhone('77051234567@g.us')).toBe(false));
  test('broadcast', () => expect(isValidPhone('1777639288@broadcast')).toBe(false));
  test('9 цифр', () => expect(isValidPhone('123456789')).toBe(false));
  test('14 цифр', () => expect(isValidPhone('99999999999999')).toBe(false));
});
describe('toChatId', () => {
  test('добавляет @c.us', () => expect(toChatId('77051234567')).toBe('77051234567@c.us'));
  test('убирает +', () => expect(toChatId('+7-705-123-45-67')).toBe('77051234567@c.us'));
});
describe('fromChatId', () => {
  test('убирает @c.us', () => expect(fromChatId('77051234567@c.us')).toBe('77051234567'));
  test('убирает @g.us', () => expect(fromChatId('77051234567@g.us')).toBe('77051234567'));
});