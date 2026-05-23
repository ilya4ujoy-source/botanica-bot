const LINK_SLEEPING  = 'https://www.instagram.com/reel/DXt8y2ViKqJ/?igsh=MTFxazByeThmNTZhcQ==';
const LINK_LOST      = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_VERY_OLD  = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_BIRTHDAY  = 'https://www.instagram.com/reel/DYmYNlnod_v/?igsh=cjQ2dWtxOHVvYmRs';

// Берём первое слово имени, проверяем что это реальное имя
// Принимаем только буквы кириллицы или латиницы, длина 2–20
function extractFirstName(name) {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0];
  if (/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(first)) return first;
  return null;
}

async function generateSleepingMessage({ name }) {
  const n = extractFirstName(name);
  const greeting = n ? `${n}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?\n\n${LINK_SLEEPING}`;
}

async function generateLostMessage({ name }) {
  const n = extractFirstName(name);
  const hey = n ? `Эй, ${n}!` : 'Эй!';
  return `${hey} Давно тебя не видели в Ботанике — и правда соскучились 🌿\n\nСпециально для тебя дарим 3000 бонусов — просто так, без условий. Приходи, посидим, споём, как раньше 🎤\n\nЗабронировать столик?\n\n${LINK_LOST}`;
}

async function generateVeryOldMessage({ name }) {
  const n = extractFirstName(name);
  const hey = n ? `${n}, сколько времени прошло!` : 'Сколько времени прошло!';
  return `${hey} 🌿 Ботаника скучает по тебе.\n\nСпециально для тебя дарим 5000 бонусов на счёт — просто за то что вернёшься. Никаких условий.\n\nЗабронировать столик?\n\n${LINK_VERY_OLD}`;
}

async function generateBirthdayMessage({ name }) {
  const n = extractFirstName(name);
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?\n\n${LINK_BIRTHDAY}`;
}

module.exports = { generateSleepingMessage, generateLostMessage, generateVeryOldMessage, generateBirthdayMessage };