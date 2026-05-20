const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.claude.apiKey });

async function generateReactivationMessage({ name, status, visitCount, lastVisit }) {
  const statusText = {
    sleeping: `раньше бывал(а) у нас ${visitCount} раз(а), последний раз был(а) ${lastVisit}`,
    lost: `был(а) у нас несколько раз, давно`,
    once: `был(а) у нас однажды, давно`,
  }[status] || 'давно не заходил(а)';

  const prompt = `Ты — дружелюбный администратор карaоке-бара "Ботаника". 
Напиши короткое тёплое WhatsApp-сообщение гостю по имени ${name || 'гость'}.
Гость ${statusText}.
Пригласи вернуться. Упомяни что у нас живая атмосфера, вкусная еда, кальяны и конечно каоке.
Не будь навязчивым. Сообщение должно быть живым, не как шаблон.
Длина: 2-3 предложения максимум. Только текст.`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content[0].text.trim();
}

async function generateBirthdayMessage({ name, giftDescription }) {
  const giftPart = giftDescription
    ? `Упомяни наш подарок для именинников: ${giftDescription}.`
    : 'Намекни что у нас есть приятный сюрприз для именинников.';

  const prompt = `Ты — дружелюбный администратор карaоке-бара "Ботаника".
Напиши тёплое WhatsApp-сообщение гостю по имени ${name || 'дорогой гость'} — у него/неё день рождения через неделю.
Поздравь заранее. Пригласи отметить день рождения у нас в Ботанике.
${giftPart}
Атмосфера: живая музыка, каоке, вкусная еда, кальяны, уютно.
Сообщение живое, тёплое, не шаблонное. 3-4 предложения.`;

  const res = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 400,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.content[0].text.trim();
}

module.exports = { generateReactivationMessage, generateBirthdayMessage };