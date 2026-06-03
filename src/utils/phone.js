/**
 * utils/phone.js
 * Валидация и форматирование телефонных номеров
 */

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  if (phone.includes('@')) return false;
  if (phone.trim() === '0') return false;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 13;
}

function toChatId(phone) {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
}

function fromChatId(chatId) {
  return chatId.replace(/@c\.us$/, '').replace(/@g\.us$/, '');
}

module.exports = { isValidPhone, toChatId, fromChatId };