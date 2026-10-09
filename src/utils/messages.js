const LINKS = {
  brunch: 'https://www.instagram.com/reel/DeRWZ-VMtSs/?cplk=MWYzZjhwdG91bXc3',
  birthday: 'https://www.instagram.com/reel/DYmYNlnod_v/?igsh=cjQ2dWtxOHVvYmRs',
};

function brunchMessage(name) {
  const greeting = name ? `${name}, привет! 👋` : 'Привет! 👋';
  return [
    greeting,
    '',
    'Мы запустили акцию 1+1 на обеденное меню — больше поводов заглянуть к нам 🌿',
    '',
    'Комбо-обеды 1+1 — 3 290 ₸',
    'Вафли 1+1 — 1 590 ₸',
    'Боулы 1+1 — 2 590 ₸',
    '',
    'Зовите коллег, друзей или вторую половинку — выбирайте любимые блюда и наслаждайтесь обедом вместе!',
    '',
    'Акция действует каждый день до 18:00.',
    '',
    'Ждём вас на обед 🍽',
    '',
    LINKS.brunch,
  ].join('\n');
}

function birthdayMessage(name) {
  const greeting = name ? `Привет, ${name}! 🎉` : `Привет! 🎉`;
  return [
    `${greeting} Слышали, у тебя скоро день рождения — поздравляем заранее!`,
    '',
    'Хотим пригласить тебя отметить этот день в Ботанике 🌿',
    'Для именинников — бутылка шампанского, поздравление от всего персонала и скидка 15% на весь счёт.',
    '',
    'Будем рады встретить тебя! Забронировать столик?',
    '',
    LINKS.birthday,
  ].join('\n');
}

module.exports = { brunchMessage, birthdayMessage, LINKS };
