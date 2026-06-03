const { extractFirstName, validateProfileName } = require('../../src/utils/names');
describe('extractFirstName — Фамилия Имя', () => {
  test('Аманбаева Алёна', () => expect(extractFirstName('Аманбаева Алёна')).toBe('Алёна'));
  test('Калюга Вероника', () => expect(extractFirstName('Калюга Вероника')).toBe('Вероника'));
  test('Воронюк Эльмира', () => expect(extractFirstName('Воронюк Эльмира')).toBe('Эльмира'));
  test('Сергеев Дмитрий', () => expect(extractFirstName('Сергеев Дмитрий')).toBe('Дмитрий'));
});
describe('extractFirstName — Имя Фамилия', () => {
  test('Матвей Лобко', () => expect(extractFirstName('Матвей Лобко')).toBe('Матвей'));
  test('Алёна Фоменко', () => expect(extractFirstName('Алёна Фоменко')).toBe('Алёна'));
  test('Андрей Слободенюк', () => expect(extractFirstName('Андрей Слободенюк')).toBe('Андрей'));
});
describe('extractFirstName — спецслучаи', () => {
  test('JET Илья JET', () => expect(extractFirstName('JET Илья JET')).toBe('Илья'));
  test('Santana Санжар', () => expect(extractFirstName('Santana Санжар')).toBe('Санжар'));
  test('крупин никита андреевич', () => expect(extractFirstName('крупин никита андреевич')).toBe('Никита'));
  test('null', () => expect(extractFirstName(null)).toBeNull());
  test('цифры', () => expect(extractFirstName('77051234567')).toBeNull());
});
describe('validateProfileName', () => {
  test('Алина', () => expect(validateProfileName('Алина')).toBe('Алина'));
  test('АЛИНА нормализация', () => expect(validateProfileName('АЛИНА')).toBe('Алина'));
  test('эмодзи', () => expect(validateProfileName('🔥Настя🔥')).toBeNull());
  test('цифры', () => expect(validateProfileName('77051234567')).toBeNull());
  test('ИП аббревиатура', () => expect(validateProfileName('ИП Иванов')).toBeNull());
  test('null', () => expect(validateProfileName(null)).toBeNull());
});