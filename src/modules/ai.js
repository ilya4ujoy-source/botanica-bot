const LINK_SLEEPING  = 'https://www.instagram.com/reel/DXt8y2ViKqJ/?igsh=MTFxazByeThmNTZhcQ==';
const LINK_LOST      = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_VERY_OLD  = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_BIRTHDAY  = 'https://www.instagram.com/reel/DYmYNlnod_v/?igsh=cjQ2dWtxOHVvYmRs';

// Известные имена — для определения что есть имя, а что фамилия
const KNOWN_NAMES = new Set([
  'алёна','алена','юлия','юля','оля','анна','ольга','ирина','наталья','светлана',
  'екатерина','катя','кристина','дарья','даша','мария','маша','елена','лена',
  'александра','саша','анастасия','настя','виктория','вика','людмила','галина',
  'татьяна','таня','надежда','надя','валентина','полина','валерия','лера',
  'милена','алина','элина','регина','карина','марина','сабина','диана','арина',
  'ника','алиса','маргарита','ангелина','нина','жанна','инна','лика','лина',
  'мина','эльмира','яна','лиза','елизавета','ксения','ксюша','кира','олеся',
  'оксана','мира','вероника','женя','евгения','пелагея','раиса','таисия',
  'альбина','аделя','аделина','злата','варвара','дарина','василиса',
  'александр','алексей','андрей','антон','артем','артём','борис','вадим',
  'валерий','василий','виктор','владимир','влад','вячеслав','григорий',
  'даниил','данил','дмитрий','евгений','иван','ваня','игорь','илья','кирилл',
  'константин','леонид','максим','михаил','никита','николай','павел','паша',
  'роман','руслан','сергей','тимур','юрий','станислав','матвей','егор','стас',
  'артур','денис','богдан','владислав','олег','петр','глеб','захар',
  'айгерим','айдана','аяулым','асель','алуа','камила','мадина','динара',
  'амина','жанара','айнур','айнель','айгуль','гульмира','маржан','жания',
  'зарина','алия','арайлым','гульнара','индира','гаухар','дина','замира',
  'назира','нургуль','салтанат','шолпан','умида','жулдыз','айсана','айсулу',
  'айым','аима','айка','альмира','гульбахыт','кымбат','лейла','мейрам',
  'мерей','тогжан','фатима','шынар','венера','акбота','айдар','айбек',
  'алибек','аслан','даурен','ернар','ерлан','жандос','нурлан','расул',
  'санжар','темирлан','нурик','болат','дастан','абылай','азамат','алмас',
  'арман','бауыржан','даулет','ерасыл','жасулан','мади','нурбек','самат',
  'серик','султан','тлек','ерназар','боранбай','ержан','бекзат','алдияр',
  'аскар','берик','дархан','канат','кайрат','мурат','нуржан','рустем',
  'саят','улан','шамиль','ернур','мерхат','жанат','ислам','еламан',
  'алдосдаун','аспандияр','жанерке','сункар','таскын','адиль','жаслан',
  'мансур','магзум','адель','мархабат','ерсин','рахметолла','беатрис',
  'дарига','алсу','ескендр','нурадиль','ардаша','сайрин','тамила','нариман',
  'марлен','диас','мирас','ансар','жеңіс','ерканат','айман','рамина',
  'альфия','санди','мейрамгуль','набиоллаева','дилара','айжан','булат',
  'асет','назым','сара','гульдана','аяулым','рустем','жасмин','беатрис',
]);

const LASTNAME_SUFFIXES = [
  'ов','ова','ев','ева','ёв','ёва','ин','ина','ын','ына',
  'ский','ская','цкий','цкая',
  'енко','ченко','нко','ько','жко','зенко','ленко','ренко','сенко',
  'аев','иев','жанов','жанова','баев','баева','еков','екова',
  'жин','жина','зов','зова','дин','дина','тов','това',
  'нов','нова','ров','рова','чев','чева','жев','жева',
  'щев','щева','цев','цева','нев','нева','рев','рева',
  'хов','хова','шов','шова','лов','лова','пов','пова',
  'зин','зина','кин','кина','лин','лина','мин','мина',
  'еев','еева','чук','щук','нюк',
  'беков','бекова','диков','дикова','уков','укова',
];

/**
 * Извлекает имя из строки формата "Фамилия Имя" или "Имя Фамилия"
 * Работает с русскими, казахскими и латинскими именами
 */
function extractFirstName(raw) {
  if (!raw) return null;
  const str = raw.trim();
  const parts = str.split(/\s+/);

  if (parts.length === 0) return null;
  if (parts.length === 1) {
    const w = parts[0];
    if (/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(w)) return capitalize(w);
    return null;
  }

  // "JET Илья JET" → Илья
  if (parts.length === 3 && parts[0].toUpperCase() === parts[2].toUpperCase()) {
    return capitalize(parts[1]);
  }

  // 3+ слов: ищем известное имя
  if (parts.length >= 3) {
    // ФИО: последнее слово — отчество
    const last = parts[parts.length - 1].toLowerCase();
    if (last.endsWith('вич') || last.endsWith('вна') || last.endsWith('евич') || last.endsWith('овна')) {
      for (const p of parts.slice(0, 2)) {
        if (KNOWN_NAMES.has(p.toLowerCase())) return capitalize(p);
      }
      return capitalize(parts[1]);
    }
    for (const p of parts) {
      if (KNOWN_NAMES.has(p.toLowerCase())) return capitalize(p);
    }
  }

  const w1 = parts[0].toLowerCase().replace(/\.$/,'');
  const w2 = parts[1].toLowerCase().replace(/\.$/,'');
  const noCyr = !/[а-яёА-ЯЁ]/.test(str);

  // Оба латиница
  if (noCyr) {
    const latSuf = ['ov','ova','ev','eva','iev','ieva','off','enko','sky','ska','uk'];
    if (latSuf.some(s => w1.endsWith(s))) return capitalize(parts[1]);
    if (latSuf.some(s => w2.endsWith(s))) return capitalize(parts[0]);
    return capitalize(parts[0]);
  }

  // Первое латиница, второе кириллица
  if (!/[а-яёА-ЯЁ]/.test(parts[0]) && /[а-яёА-ЯЁ]/.test(parts[parts.length - 1])) {
    return capitalize(parts[parts.length - 1]);
  }

  // Проверяем известные имена
  const w2known = KNOWN_NAMES.has(w2);
  const w1known = KNOWN_NAMES.has(w1);
  if (w2known && !w1known) return capitalize(parts[1]);
  if (w1known && !w2known) return capitalize(parts[0]);
  if (w1known && w2known) return capitalize(parts[0]);

  // Суффиксы фамилий
  if (LASTNAME_SUFFIXES.some(s => w1.endsWith(s) && w1.length > s.length + 1)) return capitalize(parts[1]);
  if (LASTNAME_SUFFIXES.some(s => w2.endsWith(s) && w2.length > s.length + 1)) return capitalize(parts[0]);

  // По умолчанию — первое слово
  const first = parts[0];
  if (/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(first)) return capitalize(first);
  return null;
}

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Для реактивации — валидирует имя из WhatsApp профиля
 * Принимает только буквы, длина 2-20
 */
function validateProfileName(name) {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0];
  if (/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(first)) return capitalize(first);
  return null;
}

async function generateSleepingMessage({ name }) {
  const n = validateProfileName(name);
  const greeting = n ? `${n}, споём?` : 'Споём?';
  return `${greeting} 🎤 Давно не видели тебя в Ботанике и уже соскучились!\n\nЗабронировать тебе столик?\n\n${LINK_SLEEPING}`;
}

async function generateLostMessage({ name }) {
  const n = validateProfileName(name);
  const hey = n ? `Эй, ${n}!` : 'Эй!';
  return `${hey} Давно тебя не видели в Ботанике — и правда соскучились 🌿\n\nСпециально для тебя дарим 3000 бонусов — просто так, без условий. Приходи, посидим, споём, как раньше 🎤\n\nЗабронировать столик?\n\n${LINK_LOST}`;
}

async function generateVeryOldMessage({ name }) {
  const n = validateProfileName(name);
  const hey = n ? `${n}, сколько времени прошло!` : 'Сколько времени прошло!';
  return `${hey} 🌿 Ботаника скучает по тебе.\n\nСпециально для тебя дарим 5000 бонусов на счёт — просто за то что вернёшься. Никаких условий.\n\nЗабронировать столик?\n\n${LINK_VERY_OLD}`;
}

async function generateBirthdayMessage({ name }) {
  // Для ДР берём имя из таблицы — оно может быть "Фамилия Имя", извлекаем умно
  const n = extractFirstName(name);
  const hi = n ? `Привет, ${n}!` : 'Привет!';
  return `${hi} 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников у нас особый подарок — бутылка шампанского, торжественное поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?\n\n${LINK_BIRTHDAY}`;
}

module.exports = { generateSleepingMessage, generateLostMessage, generateVeryOldMessage, generateBirthdayMessage };