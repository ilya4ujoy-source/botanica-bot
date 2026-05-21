const config = require('../config');

// Спящий гость — не было 30-60 дней
async function generateSleepingMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const greeting = n ? `${n}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?`;
}

// Потерянный гость — не было 60+ дней → дарим бонусы
async function generateLostMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hey = n ? `Эй, ${n}!` : 'Эй!';
  return `${hey} Тебя давно не было в Ботанике — мы скучаем 🌿\n\nДарим тебе 3000 бонусов — просто так, чтобы ты вернулся(ась)! Ими можно оплатить часть счёта при следующем визите 🎁\n\nЗабронировать столик?`;
}

// День рождения
async function generateBirthdayMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?`;
}

module.exports = { generateSleepingMessage, generateLostMessage, generateBirthdayMessage };