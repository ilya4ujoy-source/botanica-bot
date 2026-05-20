const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const client = new Anthropic({ apiKey: config.claude.apiKey });

// Сообщение засыпающим гостям
async function generateSleepingMessage({ name }) {
  const greeting = name ? `${name.split(' ')[0]}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?`;
}

// Сообщение для запроса фидбека (разовые гости)
async function generateFeedbackMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} Помним, что ты заглядывал(а) к нам в Ботанику 🌿\n\nНам важно знать — всё ли понравилось? Напиши пару слов о своём вечере у нас, и мы начислим тебе 3000 бонусных баллов — ими можно оплатить до 50% следующего визита 🎁\n\nКак провели вечер?`;
}

// Сообщение если гость ответил что не добрался
async function generateNotVisitedMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const sorry = n ? `Жаль, ${n}, что не получилось добраться!` : 'Жаль, что не получилось добраться!';
  return `${sorry} Бывает 😊\n\nТогда приглашаем прийти в первый раз — твои 3000 бонусов уже ждут тебя. Это реальные баллы, которыми можно оплатить часть счёта.\n\nЗабронировать тебе столик? Выбери удобный день и мы всё подготовим 🌿`;
}

// Сообщение на день рождения
async function generateBirthdayMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?`;
}

module.exports = {
  generateSleepingMessage,
  generateFeedbackMessage,
  generateNotVisitedMessage,
  generateBirthdayMessage,
};