/**
 * utils/names.js
 * Извлечение имени из строки (Фамилия Имя / Имя Фамилия)
 */

const KNOWN_FIRST_NAMES = new Set([
  'алёна','алена','юлия','юля','оля','анна','ольга','ирина','наталья','светлана',
  'екатерина','катя','кристина','дарья','даша','мария','маша','елена','лена',
  'александра','саша','анастасия','настя','виктория','вика','людмила','галина',
  'татьяна','надежда','валентина','полина','валерия','лера','милена','алина',
  'элина','регина','карина','марина','сабина','диана','арина','ника','алиса',
  'маргарита','ангелина','нина','жанна','инна','лика','лина','мина','эльмира',
  'яна','лиза','елизавета','ксения','ксюша','кира','олеся','оксана','мира',
  'вероника','женя','евгения','альбина','аделина','злата','варвара','соня','рита',
  'александр','алексей','андрей','антон','артем','артём','борис','вадим',
  'валерий','василий','виктор','владимир','влад','вячеслав','григорий',
  'даниил','данил','дмитрий','евгений','иван','игорь','илья','кирилл',
  'константин','леонид','максим','михаил','никита','николай','павел',
  'роман','руслан','сергей','тимур','юрий','станислав','матвей','егор',
  'артур','денис','богдан','владислав','олег','петр','глеб','захар','стас',
  'айгерим','айдана','аяулым','асель','алуа','камила','мадина','динара',
  'амина','жанара','айнур','айнель','айгуль','гульмира','маржан','жания',
  'зарина','алия','арайлым','гульнара','индира','гаухар','замира','назира',
  'нургуль','салтанат','шолпан','умида','жулдыз','айсана','айым','аима',
  'айка','альмира','гульбахыт','кымбат','лейла','мейрам','мерей','тогжан',
  'фатима','шынар','венера','акбота','беатрис','дарига','алсу','ардаша',
  'айдар','айбек','алибек','аслан','даурен','ернар','ерлан','жандос',
  'нурлан','расул','санжар','темирлан','нурик','болат','дастан','абылай',
  'азамат','алмас','арман','бауыржан','даулет','ерасыл','жасулан','мади',
  'нурбек','самат','серик','султан','тлек','ерназар','ержан','бекзат',
  'алдияр','аскар','берик','дархан','канат','кайрат','мурат','нуржан',
  'рустем','саят','улан','шамиль','ернур','мерхат','жанат','ислам','булат',
]);

const LASTNAME_SUFFIXES = [
  'ов','ова','ев','ева','ёв','ёва','ин','ина','ын','ына',
  'ский','ская','цкий','цкая','енко','ченко','нко','ько',
  'аев','иев','баев','баева','еков','екова','тов','това',
  'нов','нова','ров','рова','чев','чева','щев','щева',
  'цев','цева','нев','нева','хов','хова','лов','лова',
  'зин','зина','кин','кина','еев','еева','чук','щук',
];

function capitalize(s) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function extractFirstName(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const str = raw.trim();
  if (!str) return null;
  const parts = str.split(/\s+/);
  if (parts.length === 1)
    return /^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(parts[0]) ? capitalize(parts[0]) : null;
  if (parts.length === 3 && parts[0].toUpperCase() === parts[2].toUpperCase())
    return capitalize(parts[1]);
  if (parts.length >= 3) {
    const last = parts[parts.length-1].toLowerCase();
    const isPat = ['вич','вна','евич','овна','евна','ович'].some(s=>last.endsWith(s));
    if (isPat) {
      for (const p of parts.slice(0,2))
        if (KNOWN_FIRST_NAMES.has(p.toLowerCase())) return capitalize(p);
      return capitalize(parts[1]);
    }
    for (const p of parts)
      if (KNOWN_FIRST_NAMES.has(p.toLowerCase())) return capitalize(p);
  }
  const w1=parts[0].toLowerCase().replace(/\.$/,'');
  const w2=parts[1].toLowerCase().replace(/\.$/,'');
  const hasCyr=/[а-яёА-ЯЁ]/.test(str);
  const firstCyr=/[а-яёА-ЯЁ]/.test(parts[0]);
  const lastCyr=/[а-яёА-ЯЁ]/.test(parts[parts.length-1]);
  if (!hasCyr) {
    const ls=['ov','ova','ev','eva','iev','off','enko','sky','ska','uk'];
    if (ls.some(s=>w1.endsWith(s))) return capitalize(parts[1]);
    if (ls.some(s=>w2.endsWith(s))) return capitalize(parts[0]);
    return capitalize(parts[0]);
  }
  if (!firstCyr && lastCyr) return capitalize(parts[parts.length-1]);
  const w1k=KNOWN_FIRST_NAMES.has(w1), w2k=KNOWN_FIRST_NAMES.has(w2);
  if (w1k && w2k) return capitalize(parts[0]);
  if (w2k && !w1k) return capitalize(parts[1]);
  if (w1k && !w2k) return capitalize(parts[0]);
  if (LASTNAME_SUFFIXES.some(s=>w1.endsWith(s)&&w1.length>s.length+1)) return capitalize(parts[1]);
  if (LASTNAME_SUFFIXES.some(s=>w2.endsWith(s)&&w2.length>s.length+1)) return capitalize(parts[0]);
  return /^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(parts[0]) ? capitalize(parts[0]) : null;
}

function validateProfileName(name) {
  if (!name || typeof name !== 'string') return null;
  const first = name.trim().split(/\s+/)[0];
  if (!/^[a-zA-Zа-яА-ЯёЁ]{2,20}$/.test(first)) return null;
  if (first.length <= 3 && first === first.toUpperCase() && /[А-ЯЁA-Z]/.test(first)) return null;
  return capitalize(first);
}

module.exports = { extractFirstName, validateProfileName, capitalize };