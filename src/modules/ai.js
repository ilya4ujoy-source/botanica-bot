const LINK_SLEEPING  = 'https://www.instagram.com/reel/DXt8y2ViKqJ/?igsh=MTFxazByeThmNTZhcQ==';
const LINK_LOST      = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_VERY_OLD  = 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==';
const LINK_BIRTHDAY  = 'https://www.instagram.com/reel/DYmYNlnod_v/?igsh=cjQ2dWtxOHVvYmRs';

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
  'зарина','алия','арайлым','гульнара','индира','гаухар','замира','назира',
  'нургуль','салтанат','шолпан','умида','жулдыз','айсана','айсулу','айым',
  'аима','айка','альмира','гульбахыт','кымбат','лейла','мейрам','мерей',
  'тогжан','фатима','шынар','венера','акбота','айдар','айбек','алибек',
  'аслан','даурен','ернар','ерлан','жандос','нурлан','расул','санжар',
  'темирлан','нурик','болат','дастан','абылай','азамат','алмас','арман',
  'бауыржан','даулет','ерасыл','жасулан','мади','нурбек','самат','серик',
  'султан','тлек','ерназар','боранбай','ержан','бекзат','алдияр','аскар',
  'берик','дархан','канат','кайрат','мурат','нуржан','рустем','саят',
  'улан','шамиль','ернур','мерхат','жанат','ислам','еламан','алдосдаун',
  'аспандияр','жанерке','сункар','таскын','адиль','жаслан','мансур',
  'магзум','адель','мархабат','ерсин','беатрис','дарига','алсу','ескендр',
  'нурадиль','ардаша','нариман','марлен','мирас','ансар','ерканат','айман',
  'рамина','альфия','санди','мейрамгуль','дилара','айжан','булат','асет',
  'назым','сара','гульдана','рустем','жасмин',
]);

const LASTNAME_SUFFIXES = [
  'ов','ова','ев','ева','ёв','ёва','ин','ина','ын','ына',
  'ский','ская','цкий','цкая',
  'енко','ченко','нко','ько','жко','зенко','ленко','ренко','сенко',
  'аев','иев','жанов','жанова','баев','баева','еков','екова',
  'жин','жина','зов','зова','дин','дина','тов','това',
  'нов','нова','ров','рова','чев','чева','жев','жева',
  'щев','щева','цев','цева','нев','нева','хов','хова',
  'лов','лова','пов','пова','зин','зина','кин','кина',
  'еев','еева','чук','щук','беков','бекова','уков','укова',
];

function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s; }

function extractFirstName(raw) {
  if (!raw || !raw.trim()) return null;
  const str = raw.trim();
  const parts = str.split(/\s+/);
  if (parts.length === 1) {
    return /^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(parts[0]) ? cap(parts[0]) : null;
  }
  if (parts.length === 3 && parts[0].toUpperCase() === parts[2].toUpperCase()) return cap(parts[1]);
  if (parts.length >= 3) {
    const last = parts[parts.length-1].toLowerCase();
    if (last.endsWith('вич')||last.endsWith('вна')||last.endsWith('евич')||last.endsWith('овна')) {
      for (const p of parts.slice(0,2)) if (KNOWN_NAMES.has(p.toLowerCase())) return cap(p);
      return cap(parts[1]);
    }
    for (const p of parts) if (KNOWN_NAMES.has(p.toLowerCase())) return cap(p);
  }
  const w1 = parts[0].toLowerCase().replace(/\.$/,'');
  const w2 = parts[1].toLowerCase().replace(/\.$/,'');
  const noCyr = !/[а-яёА-ЯЁ]/.test(str);
  if (noCyr) {
    const ls = ['ov','ova','ev','eva','iev','ieva','off','enko','sky','ska','uk'];
    if (ls.some(s => w1.endsWith(s))) return cap(parts[1]);
    if (ls.some(s => w2.endsWith(s))) return cap(parts[0]);
    return cap(parts[0]);
  }
  if (!/[а-яёА-ЯЁ]/.test(parts[0]) && /[а-яёА-ЯЁ]/.test(parts[parts.length-1]))
    return cap(parts[parts.length-1]);
  const w2k = KNOWN_NAMES.has(w2), w1k = KNOWN_NAMES.has(w1);
  if (w2k && !w1k) return cap(parts[1]);
  if (w1k && !w2k) return cap(parts[0]);
  if (w1k && w2k) return cap(parts[0]);
  if (LASTNAME_SUFFIXES.some(s => w1.endsWith(s) && w1.length > s.length+1)) return cap(parts[1]);
  if (LASTNAME_SUFFIXES.some(s => w2.endsWith(s) && w2.length > s.length+1)) return cap(parts[0]);
  return /^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(parts[0]) ? cap(parts[0]) : null;
}

function validateProfileName(name) {
  if (!name) return null;
  const first = name.trim().split(/\s+/)[0];
  if (/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(first)) return cap(first);
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
  const n = extractFirstName(name);
  const withName = n
    ? `Привет, ${n}! 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!`
    : `Привет! 🎉 Слышали, у тебя скоро день рождения — поздравляем заранее!`;
  return `${withName}\n\nХотим пригласить тебя отметить этот день в Ботанике 🌿 Для именинников — бутылка шампанского, поздравление от всего персонала и скидка 15% на весь счёт.\n\nБудем рады встретить тебя! Забронировать столик?\n\n${LINK_BIRTHDAY}`;
}

module.exports = { generateSleepingMessage, generateLostMessage, generateVeryOldMessage, generateBirthdayMessage };