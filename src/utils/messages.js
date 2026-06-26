const LINKS = {
    sleeping: 'https://www.instagram.com/reel/DXt8y2ViKqJ/?igsh=MTFxazByeThmNTZhcQ==',
      lost: 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==',
        veryOld: 'https://www.instagram.com/reel/DYer8osoRDO/?igsh=MXcyaWptcDYxNGIydw==',
          birthday: 'https://www.instagram.com/reel/DYmYNlnod_v/?igsh=cjQ2dWtxOHVvYmRs',
          };

          function sleepingMessage(name) {
            const greeting = name ? `${name}, споём?` : 'Споём?';
              return [`${greeting} 🎤`, `Давно не видели тебя в Ботанике — и уже соскучились!`, ``, `Забронировать столик?`, ``, LINKS.sleeping].join('\n');
              }

              function lostMessage(name) {
                const greeting = name ? `Эй, ${name}!` : 'Эй!';
                  return [`${greeting}`, `Давно тебя не видели в Ботанике — и правда соскучились 🌿`, ``, `Специально для тебя дарим 3000 бонусов — просто так, без условий.`, `Приходи, посидим, споём, как раньше 🎤`, ``, `Забронировать столик?`, ``, LINKS.lost].join('\n');
                  }

                  function veryOldMessage(name) {
                    const greeting = name ? `${name}, сколько времени прошло!` : 'Сколько времени прошло!';
                      return [`${greeting} 🌿`, `Ботаника скучает по тебе.`, ``, `Специально для тебя дарим 5000 бонусов на счёт — просто за то что вернёшься. Никаких условий.`, ``, `Забронировать столик?`, ``, LINKS.veryOld].join('\n');
                      }

                      function birthdayMessage(name) {
                        const greeting = name ? `Привет, ${name}! 🎉` : `Привет! 🎉`;
                          return [`${greeting} Слышали, у тебя скоро день рождения — поздравляем заранее!`, ``, `Хотим пригласить тебя отметить этот день в Ботанике 🌿`, `Для именинников — бутылка шампанского, поздравление от всего персонала и скидка 15% на весь счёт.`, ``, `Будем рады встретить тебя! Забронировать столик?`, ``, LINKS.birthday].join('\n');
                          }

                          module.exports = { sleepingMessage, lostMessage, veryOldMessage, birthdayMessage, LINKS };
