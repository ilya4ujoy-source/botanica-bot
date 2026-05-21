const config = require('../config');

const LINK_SLEEPING = 'https://www.instagram.com/reel/DXt8y2ViKqJ/?igsh=MTFxazByeThmNTZhcQ==';
const LINK_LOST = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';

async function generateSleepingMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const greeting = n ? `${n}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?\n\n${LINK_SLEEPING}`;
}

async function generateLostMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hey = n ? `Эй, ${n}!` : 'Эй!';
  return `${hey} Давно тебя не видели в Ботанике — и правда соскучились 🌿\n\nСпециально для тебя дарим 3000 бонусов — просто так, без условий. Приходи, посидим, споём, как раньше 🎤\n\nЗабронировать столик?\n\n${LINK_LOST}`;
}

async function generateBirthdayMessage({ name }) {
  const n = name ? name.split(' ')[0] : null;
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?`;
}

module.exports = { generateSleepingMessage, generateLostMessage, generateBirthdayMessage };