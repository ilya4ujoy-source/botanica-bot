const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.claude.apiKey });

async function generateSleepingMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const greeting = n ? `${n}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?`;
}

async function generateBirthdayMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?`;
}

module.exports = { generateSleepingMessage, generateBirthdayMessage };