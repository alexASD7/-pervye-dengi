(function(){
"use strict";

  /* ---------- Тренажёры: по одному на каждый шаг ---------- */
  var GAMES = {};

  function gameBlock(n){
    var g = GAMES[n];
    if(!g) return "";
    return '<div class="game">' +
      '<div class="game-head"><span class="game-label">Тренажёр</span><h3>' + g.title + '</h3></div>' +
      '<p class="game-intro">' + g.intro + '</p>' +
      '<div class="game-body" id="gameBody' + n + '"></div>' +
      '</div>';
  }

  function initGame(n){
    var g = GAMES[n];
    if(!g) return;
    var host = document.getElementById("gameBody" + n);
    if(!host) return;
    try{ g.start(host); }catch(e){ host.innerHTML = '<p class="g-sub">Тренажёр не запустился. Урок это не ломает — читай дальше.</p>'; }
  }

  function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

  /* ===== Шаг 1. Кто платит ===== */
  GAMES[1] = {
    title: "Кто платит",
    intro: "Двенадцать человек по одному. Реши про каждого: это твой заказчик, не твой или от этого надо уходить.",
    start: function(host){
      var CARDS = [
        { t:"Продавец термокружек на маркетплейсе. Главное фото снято дома на клеёнке, видно край тарелки. Отзывы приходят каждую неделю.", a:"my",
          why:"Продаёт прямо сейчас, регулярно, и поломка видна с первого взгляда. Каждая плохая фотография стоит ему продаж — он это понимает без объяснений." },
        { t:"Одноклассник. Собирается открыть магазин кроссовок, копит на первую партию.", a:"not",
          why:"Он ещё не продаёт, выручки нет. Начинать с тех, у кого нет денег, — самый быстрый способ решить, что никому ничего не нужно." },
        { t:"Кофейня в соседнем доме. В меню на двери нет цен, страница не обновлялась с прошлого года.", a:"my",
          why:"Работает каждый день, деньги идут, и сразу два места сделаны плохо. Плюс ты туда ходишь — с такого начинать легче всего." },
        { t:"Канал про рыбалку, 1800 подписчиков, продаёт снасти. Обложки роликов — случайный кадр из видео.", a:"my",
          why:"Мелкий канал, который уже продаёт. Обложки и оформление — вечная их беда, а делать некому." },
        { t:"Сообщение в игровом чате: «Дам 5000 ₽, если дашь свою карту на два дня. Деньги просто пройдут транзитом».", a:"bad",
          why:"Это дропперство. Человек, который так делает, становится участником схемы по отмыванию денег, со всеми последствиями. Карта, документы и коды из СМС — только твои." },
        { t:"Блогер, два миллиона подписчиков. Съёмка, монтаж и обложки сделаны студией.", a:"not",
          why:"Деньги у него есть, но всё уже вылизано — там работает кто-то другой. Ищи тех, у кого видно место, сделанное плохо." },
        { t:"Мастер маникюра. Двадцать активных объявлений, все фото сняты при жёлтой лампе на фоне обоев.", a:"my",
          why:"Двадцать активных объявлений — это уже маленький бизнес, просто он сам себя так не называет. И поломка названа конкретно." },
        { t:"«Подработка для школьников: принимаешь переводы на карту, десять процентов оставляешь себе».", a:"bad",
          why:"То же дропперство, только названо красиво. Ни одна честная работа не начинается с того, что тебе переводят чужие деньги." },
        { t:"Сосед. Говорит, что весной обязательно запустит своё дело.", a:"not",
          why:"«Планирую запуститься» — это не выручка. Тебе нужен тот, у кого продажи идут потоком уже сегодня." },
        { t:"Продавец чехлов. Триста отзывов, карточки сняты в студии, описание вычитано.", a:"not",
          why:"Деньги есть, поломки нет. Предлагать тут нечего — разве что то, чего у него пока нет совсем." },
        { t:"«Помогу вывести робуксы. Скинь номер карты и код из сообщения».", a:"bad",
          why:"Приманка. В январе 2025 около десяти московских школьников отдали мошенникам данные карт, выполняя такие «задания» в игре." },
        { t:"Шиномонтаж у дороги. Прайс написан от руки на листке, фотографий нет нигде.", a:"my",
          why:"Работает каждый день, деньги живые, а сделано плохо всё сразу. Начни с прайса в человеческом виде." }
      ];
      var i = 0, right = 0, answered = false;

      function draw(){
        if(i >= CARDS.length){ finish(); return; }
        var c = CARDS[i];
        host.innerHTML =
          '<div class="g-card">' + esc(c.t) + '</div>' +
          '<div class="g-btns">' +
            '<button class="g-btn" data-a="my">Мой заказчик</button>' +
            '<button class="g-btn" data-a="not">Не мой</button>' +
            '<button class="g-btn danger" data-a="bad">Опасно, ухожу</button>' +
          '</div>' +
          '<div class="g-verdict" id="gv1" hidden></div>' +
          '<div class="g-score"><span>Карточка ' + (i+1) + ' из ' + CARDS.length + '</span><span>Верно: ' + right + '</span></div>';
        answered = false;
        var btns = host.querySelectorAll(".g-btn");
        Array.prototype.forEach.call(btns, function(b){
          b.addEventListener("click", function(){ answer(b.getAttribute("data-a")); });
        });
      }

      function answer(a){
        if(answered) return;
        answered = true;
        var c = CARDS[i];
        var ok = (a === c.a);
        if(ok) right++;
        var names = { my:"мой заказчик", not:"не мой", bad:"опасно" };
        var v = document.getElementById("gv1");
        v.hidden = false;
        v.className = "g-verdict " + (ok ? "ok" : "no");
        v.innerHTML = '<b>' + (ok ? "Верно" : ("Не так. Правильно: " + names[c.a])) + '</b>' + esc(c.why);
        var btns = host.querySelectorAll(".g-btn");
        Array.prototype.forEach.call(btns, function(b){ b.disabled = true; });
        var next = document.createElement("button");
        next.className = "g-btn";
        next.style.marginTop = "12px";
        next.textContent = (i === CARDS.length - 1) ? "Посмотреть итог" : "Дальше";
        next.addEventListener("click", function(){ i++; draw(); });
        v.parentNode.insertBefore(next, v.nextSibling);
        next.focus();
      }

      function finish(){
        var msg;
        if(right >= 11) msg = "Ты различаешь заказчика с деньгами и видишь приманку. Это и есть весь первый шаг.";
        else if(right >= 8) msg = "Основное ты видишь. Перечитай в уроке три признака, что у человека есть деньги, и пройди ещё раз.";
        else msg = "Пока путаешь «человеку что-то нужно» и «человеку есть чем заплатить». Это самая частая ошибка, и урок ровно про неё. Перечитай начало шага.";
        host.innerHTML =
          '<div class="g-final"><b>' + right + ' из ' + CARDS.length + '</b>' + esc(msg) + '</div>' +
          '<button class="g-again">Пройти заново</button>';
        host.querySelector(".g-again").addEventListener("click", function(){ i = 0; right = 0; draw(); });
      }

      draw();
    }
  };

  /* ===== Шаг 2. Две границы ===== */
  GAMES[2] = {
    title: "Две границы",
    intro: "Подставь свои числа и увидишь обе границы сразу: ниже которой работать бессмысленно и выше которой заказчику невыгодно. Ползунок показывает, что будет при разной цене.",
    start: function(host){
      host.innerHTML =
        '<p class="g-sub" style="margin-bottom:10px"><b>Твоя сторона</b></p>' +
        '<div class="g-rows">' +
          '<div class="g-row"><label for="g2h">Часов на работу, вместе с перепиской и правками</label><input type="number" id="g2h" value="2.5" min="0.5" max="40" step="0.5"></div>' +
          '<div class="g-row"><label for="g2r">Сколько платят за час простой работы у вас</label><input type="number" id="g2r" value="250" min="0" max="5000" step="10"></div>' +
          '<div class="g-row"><label for="g2c">Расходы из своего кармана, ₽</label><input type="number" id="g2c" value="0" min="0" max="100000" step="50"></div>' +
        '</div>' +
        '<p class="g-sub" style="margin:18px 0 10px"><b>Сторона заказчика</b></p>' +
        '<div class="g-rows">' +
          '<div class="g-row"><label for="g2p">Сколько он зарабатывает с одной продажи, ₽</label><input type="number" id="g2p" value="300" min="0" max="100000" step="10"></div>' +
          '<div class="g-row"><label for="g2n">Продаж в день сейчас</label><input type="number" id="g2n" value="2" min="0" max="500" step="1"></div>' +
          '<div class="g-row"><label for="g2n2">Продаж в день, если сделать хорошо</label><input type="number" id="g2n2" value="3" min="0" max="500" step="1"></div>' +
        '</div>' +
        '<div class="g-out" id="g2out"></div>' +
        '<label class="g-sub" for="g2s" style="display:block;margin-top:16px">Твоя цена</label>' +
        '<input class="g-slider" type="range" id="g2s" min="0" max="100" value="30">' +
        '<div class="g-scale"><span id="g2lo">низ</span><span id="g2hi">верх</span></div>' +
        '<div class="g-out" id="g2res"></div>';

      var ids = ["g2h","g2r","g2c","g2p","g2n","g2n2"];
      function val(id){ var v = parseFloat(document.getElementById(id).value); return isNaN(v) ? 0 : v; }

      function calc(){
        var hours = Math.max(0.1, val("g2h"));
        var low = Math.round(hours * val("g2r") + val("g2c"));
        var gainDay = Math.max(0, (val("g2n2") - val("g2n")) * val("g2p"));
        var gainMonth = Math.round(gainDay * 30);

        document.getElementById("g2out").innerHTML =
          '<div class="g-out-line"><span>Нижняя граница: во что это обходится тебе</span><b>' + low + ' ₽</b></div>' +
          '<div class="g-out-line"><span>Заказчик получит сверху за месяц, если сделать хорошо</span><b>' + gainMonth + ' ₽</b></div>';

        var maxPrice = Math.max(low * 4, low + 100);
        var s = parseInt(document.getElementById("g2s").value, 10);
        var price = Math.round((low + (maxPrice - low) * s / 100) / 50) * 50;
        if(price < low) price = low;

        document.getElementById("g2lo").textContent = low + " ₽";
        document.getElementById("g2hi").textContent = maxPrice + " ₽";

        var perHour = Math.round(price / hours);
        var days = gainDay > 0 ? Math.ceil(price / gainDay) : null;

        var note;
        if(price < low) note = "Ниже своей себестоимости. На ошибки не останется ничего, а ошибки будут.";
        else if(perHour < val("g2r")) note = "Твоя ставка за час вышла ниже, чем за простую работу у вас. Это и есть та самая ловушка новичка.";
        else if(days !== null && days > 60) note = "Заказчику это окупится дольше чем за два месяца. Он почти наверняка откажется, и будет прав.";
        else if(days !== null) note = "Цена честная: ты зарабатываешь больше, чем на простой работе, а он возвращает вложенное за " + days + " дн. Такую цену можно спокойно защищать.";
        else note = "Прикинь сторону заказчика: сколько продаж у него станет, если сделать хорошо.";

        document.getElementById("g2res").innerHTML =
          '<div class="g-out-line"><span>Назначаю цену</span><b class="g-big">' + price + ' ₽</b></div>' +
          '<div class="g-out-line"><span>Твоя ставка за час</span><b>' + perHour + ' ₽/ч</b></div>' +
          '<div class="g-out-line"><span>За сколько дней окупится у заказчика</span><b>' + (days === null ? "не считается" : (days + " дн.")) + '</b></div>' +
          '<p class="g-sub" style="margin-top:10px">' + esc(note) + '</p>';
      }

      ids.forEach(function(id){ document.getElementById(id).addEventListener("input", calc); });
      document.getElementById("g2s").addEventListener("input", calc);
      calc();
    }
  };

  /* ===== Шаг 3. Разговор ===== */
  GAMES[3] = {
    title: "Разговор с заказчиком",
    intro: "Пять типичных ответов. Выбирай, что скажешь. Здесь можно ошибаться сколько угодно — в жизни попытка одна.",
    start: function(host){
      var ROUNDS = [
        { s:"Ты написал продавцу: «Здравствуйте, могу переснять ваши фотографии, недорого». Прошло три дня. Тишина.",
          o:[ { t:"Написать ещё раз то же самое", ok:false, why:"Он не ответил не потому, что не заметил. «Могу» — это обещание, а обещаний ему шлют каждый день." },
              { t:"Переделать его худшую карточку и прислать готовое с ценой", ok:true, why:"Именно так. Теперь ему не надо тебе верить: он просто смотрит и решает. Риска у него ноль." },
              { t:"Вычеркнуть и идти к следующему", ok:false, why:"Рано. Ты пока не показал ему ничего, кроме обещания. Сначала покажи работу." } ] },
        { s:"Ты прислал готовый образец. Ответ: «Ничего так. А сколько стоит?»",
          o:[ { t:"«Ну, договоримся»", ok:false, why:"Отсутствие цены портит предложение. Человек не любит гадать и уходит думать навсегда." },
              { t:"«300 ₽ за карточку, срок два дня. Делаем?»", ok:true, why:"Цена, срок и вопрос, на который можно ответить одним словом. Так разговаривают взрослые исполнители." },
              { t:"«А сколько вам не жалко?»", ok:false, why:"Ты только что отдал назначение цены человеку, который заинтересован платить меньше." } ] },
        { s:"«Дороговато. Давай за половину?»",
          o:[ { t:"«Ладно, давайте за половину»", ok:false, why:"Ты показал, что цена была выдумана. В следующий раз торговаться начнут сразу и сильнее." },
              { t:"«За половину — половина объёма: четыре фото вместо восьми, без замены фона»", ok:true, why:"Ты не уступил, а предложил другой объём за другие деньги. Это сразу видно и читается как взрослый подход." },
              { t:"«Нет» и закончить разговор", ok:false, why:"Цену ты отстоял, но потерял заказчика там, где можно было договориться." } ] },
        { s:"«Не сейчас, спасибо.»",
          o:[ { t:"Молча закрыть переписку", ok:false, why:"Так теряется половина пользы отказа. Отказавший часто не против подсказать, кому это нужно, — просто его никто не спросил." },
              { t:"«Понял, образец оставляю вам. А вы не знаете, кому это может быть нужно?»", ok:true, why:"Дверь осталась открытой, и ты задал вопрос, который стоит дороже самого заказа. У мелкого бизнеса почти всегда есть свои чаты и знакомые с той же бедой." },
              { t:"Объяснить, почему он неправ", ok:false, why:"Уговоры не работают и портят впечатление. Некоторые из отказавших возвращаются сами — но только если уйти красиво." } ] },
        { s:"«Давай! Когда начнёшь?»",
          o:[ { t:"Сразу сесть за работу, чтобы не терять время", ok:false, why:"Самое трудное не найти заказ, а не остаться без денег после того, как всё сделал. В исследовании про подростков-исполнителей договорённость на бумаге была у четверых из тринадцати." },
              { t:"Отправить четыре строки: что делаю, к какому сроку, за сколько, когда платят", ok:true, why:"Одно сообщение, две минуты — и половина будущих проблем исчезла. Взрослые делают так между собой всегда, и никто не обижается." },
              { t:"Попросить всю сумму вперёд", ok:false, why:"Незнакомому подростку полную предоплату почти никто не даст. Ты потеряешь заказ на ровном месте." } ] }
      ];
      var i = 0, right = 0, answered = false;

      function draw(){
        if(i >= ROUNDS.length){ finish(); return; }
        var r = ROUNDS[i];
        var html = '<div class="g-card">' + esc(r.s) + '</div><div class="g-btns" style="flex-direction:column">';
        r.o.forEach(function(o, k){ html += '<button class="g-btn" data-k="' + k + '" style="text-align:left">' + esc(o.t) + '</button>'; });
        html += '</div><div class="g-verdict" id="gv3" hidden></div>' +
          '<div class="g-score"><span>Ответ ' + (i+1) + ' из ' + ROUNDS.length + '</span><span>Верно: ' + right + '</span></div>';
        host.innerHTML = html;
        answered = false;
        Array.prototype.forEach.call(host.querySelectorAll(".g-btn"), function(b){
          b.addEventListener("click", function(){ answer(parseInt(b.getAttribute("data-k"), 10)); });
        });
      }

      function answer(k){
        if(answered) return;
        answered = true;
        var o = ROUNDS[i].o[k];
        if(o.ok) right++;
        var v = document.getElementById("gv3");
        v.hidden = false;
        v.className = "g-verdict " + (o.ok ? "ok" : "no");
        v.innerHTML = '<b>' + (o.ok ? "Так и надо" : "Так теряют заказ") + '</b>' + esc(o.why);
        Array.prototype.forEach.call(host.querySelectorAll(".g-btn"), function(b){ b.disabled = true; });
        var next = document.createElement("button");
        next.className = "g-btn";
        next.style.marginTop = "12px";
        next.textContent = (i === ROUNDS.length - 1) ? "Посмотреть итог" : "Дальше";
        next.addEventListener("click", function(){ i++; draw(); });
        v.parentNode.insertBefore(next, v.nextSibling);
        next.focus();
      }

      function finish(){
        var msg;
        if(right === 5) msg = "Все пять. Ты знаешь, что говорить в каждой из пяти ситуаций, которые точно случатся. Теперь напиши живому человеку.";
        else if(right >= 3) msg = "Большую часть держишь. Перечитай разбор там, где ошибся, и пройди ещё раз — это бесплатно, а в жизни попытка одна.";
        else msg = "Пока разговор уходит не туда. Вернись к разделу «Что говорить: точные слова» и пройди тренажёр заново.";
        host.innerHTML =
          '<div class="g-final"><b>' + right + ' из ' + ROUNDS.length + '</b>' + esc(msg) + '</div>' +
          '<button class="g-again">Пройти заново</button>';
        host.querySelector(".g-again").addEventListener("click", function(){ i = 0; right = 0; draw(); });
      }

      draw();
    }
  };

  /* ===== Шаг 4. Неделя заказа ===== */
  GAMES[4] = {
    title: "Неделя заказа",
    intro: "Ты обещал сдать в четверг. Работы на шесть часов. Распределяй по дням и смотри, что получится, когда вмешается жизнь.",
    start: function(host){
      var need = 6, doneH = 0, day = 0, extra = 0, lost = 0, tookSecond = false, log = [];
      var EVENTS = {
        1: "Заказчик прислал правку: просит поменять фон на двух фото. Плюс час работы.",
        2: "Ноутбук завис и не сохранил. Час работы пропал.",
        3: "Написал второй заказчик: готов заплатить 700 ₽, но нужно к пятнице."
      };

      function draw(){
        var left = Math.max(0, need + extra - doneH);
        var html = '<div class="g-days">';
        for(var d = 0; d < 5; d++){
          var names = ["Пн","Вт","Ср","Чт","Пт"];
          var cls = "g-day" + (d === day ? " now" : (d < day ? " past" : ""));
          html += '<div class="' + cls + '"><div class="g-day-n">' + names[d] + (d === 3 ? " · срок" : "") + '</div><div class="g-day-h">' + (log[d] === undefined ? "—" : (log[d] + " ч")) + '</div></div>';
        }
        html += '</div>';
        html += '<div class="g-out"><div class="g-out-line"><span>Сделано</span><b>' + doneH + ' из ' + (need + extra) + ' ч</b></div>' +
                '<div class="g-out-line"><span>Осталось</span><b>' + left + ' ч</b></div></div>';
        if(day > 0 && EVENTS[day]) html += '<div class="g-event">' + esc(EVENTS[day]) + '</div>';
        if(day === 3 && !tookSecond && EVENTS[3]){
          html += '<div class="g-btns"><button class="g-btn" data-sec="1">Взять второй заказ</button><button class="g-btn" data-sec="0">Отказаться до сдачи первого</button></div>';
        } else {
          html += '<div class="g-btns">';
          for(var h = 0; h <= 3; h++) html += '<button class="g-btn" data-h="' + h + '">' + h + ' ч</button>';
          html += '</div>';
          html += '<p class="g-sub" style="margin-top:8px">Сколько часов работаешь в ' + ["понедельник","вторник","среду","четверг","пятницу"][day] + '?</p>';
        }
        host.innerHTML = html;
        Array.prototype.forEach.call(host.querySelectorAll("[data-h]"), function(b){
          b.addEventListener("click", function(){ work(parseInt(b.getAttribute("data-h"), 10)); });
        });
        Array.prototype.forEach.call(host.querySelectorAll("[data-sec]"), function(b){
          b.addEventListener("click", function(){
            tookSecond = (b.getAttribute("data-sec") === "1");
            if(tookSecond) extra += 3;
            draw();
          });
        });
      }

      function work(h){
        log[day] = h;
        doneH += h;
        day++;
        if(day === 2){ extra += 1; }
        if(day === 3){ lost += 1; doneH = Math.max(0, doneH - 1); }
        if(day >= 5 || doneH >= need + extra){ finish(); return; }
        draw();
      }

      function finish(){
        var totalNeed = need + extra;
        var finishedDay = -1;
        var acc = 0;
        for(var d = 0; d < 5; d++){
          acc += (log[d] || 0);
          if(d === 2) acc = Math.max(0, acc - 1);
          if(acc >= totalNeed){ finishedDay = d; break; }
        }
        var inTime = (finishedDay >= 0 && finishedDay <= 3);
        var spent = 0;
        for(var k = 0; k < 5; k++) spent += (log[k] || 0);
        var price = tookSecond ? 1500 : 800;
        var rate = spent > 0 ? Math.round(price / spent) : 0;
        var head, msg;
        if(inTime){
          head = "Сдал в срок";
          msg = "Назвал четверг и сдал к четвергу. Такое запоминают, и именно из-за этого рекомендуют дальше. Настоящая ставка за час вышла " + rate + " ₽ при обещанных " + price + " ₽ за работу.";
        } else if(finishedDay >= 0){
          head = "Опоздал";
          msg = "Работа сделана, но позже обещанного. Подросток обычно проваливает не качество, а дату — потому что впервые считает время дела, которого раньше не делал. Правило простое: прикинь время и умножь на два. Ставка за час вышла " + rate + " ₽.";
        } else {
          head = "Не успел совсем";
          msg = "Неделя кончилась, работа не сдана. Это тот случай, когда лучше сразу написать заказчику и назвать новый срок, а не молчать.";
        }
        var notes = [];
        if(extra > 0 && !tookSecond) notes.push("Правка съела лишний час — поэтому в договорённости и пишут, сколько правок входит в цену.");
        if(lost > 0) notes.push("Час пропал из-за техники. Это не отговорка для заказчика: срок называешь ты.");
        if(tookSecond) notes.push("Второй заказ принёс денег, но растянул первый. Брать второй до сдачи первого — самая частая причина сорванного срока.");
        host.innerHTML =
          '<div class="g-final"><b>' + head + '</b>' + esc(msg) + '</div>' +
          (notes.length ? '<p class="g-sub" style="margin-top:12px">' + notes.map(esc).join(" ") + '</p>' : '') +
          '<button class="g-again">Пройти заново</button>';
        host.querySelector(".g-again").addEventListener("click", function(){
          need = 6; doneH = 0; day = 0; extra = 0; lost = 0; tookSecond = false; log = [];
          draw();
        });
      }

      draw();
    }
  };

  /* ===== Шаг 5. Три конверта ===== */
  GAMES[5] = {
    title: "Три конверта",
    intro: "Подвинь ползунки и посмотри, где ты окажешься через шесть заказов. Доля «в дело» поднимает цену следующих работ — это видно на горизонте.",
    start: function(host){
      host.innerHTML =
        '<div class="g-rows">' +
          '<div class="g-row"><label for="g5sum">Сколько получил за заказ, ₽</label><input type="number" id="g5sum" value="800" min="100" max="100000" step="50"></div>' +
          '<div class="g-row"><label for="g5goal">Цена твоей цели, ₽</label><input type="number" id="g5goal" value="6000" min="500" max="500000" step="500"></div>' +
        '</div>' +
        '<label class="g-sub" for="g5a" style="display:block;margin-top:16px">Трачу свободно</label>' +
        '<input class="g-slider" type="range" id="g5a" min="0" max="100" value="50">' +
        '<label class="g-sub" for="g5b" style="display:block;margin-top:8px">Откладываю на цель</label>' +
        '<input class="g-slider" type="range" id="g5b" min="0" max="100" value="30">' +
        '<div class="g-bar" id="g5bar"><span class="s1"></span><span class="s2"></span><span class="s3"></span></div>' +
        '<div class="g-legend">' +
          '<span><i style="background:#F2B705"></i>трачу <b id="g5la"></b></span>' +
          '<span><i style="background:#0F6259"></i>в цель <b id="g5lb"></b></span>' +
          '<span><i style="background:#6BA292"></i>в дело <b id="g5lc"></b></span>' +
        '</div>' +
        '<div class="g-out" id="g5out"></div>';

      function calc(){
        var sum = parseFloat(document.getElementById("g5sum").value) || 0;
        var goal = parseFloat(document.getElementById("g5goal").value) || 1;
        var a = parseInt(document.getElementById("g5a").value, 10);
        var b = parseInt(document.getElementById("g5b").value, 10);
        if(a + b > 100){ b = 100 - a; document.getElementById("g5b").value = b; }
        var c = 100 - a - b;

        document.getElementById("g5bar").innerHTML =
          '<span class="s1" style="width:' + a + '%"></span>' +
          '<span class="s2" style="width:' + b + '%"></span>' +
          '<span class="s3" style="width:' + c + '%"></span>';
        document.getElementById("g5la").textContent = a + "%";
        document.getElementById("g5lb").textContent = b + "%";
        document.getElementById("g5lc").textContent = c + "%";

        var price = sum, saved = 0, earned = 0, reached = 0;
        for(var i = 1; i <= 6; i++){
          earned += price;
          saved += price * b / 100;
          if(reached === 0 && saved >= goal) reached = i;
          if(c >= 15) price = Math.round(price * 1.15 / 10) * 10;
        }
        saved = Math.round(saved);
        earned = Math.round(earned);

        var note;
        if(c < 15 && b > 0) note = "В дело уходит меньше пятнадцати процентов — цена заказов не растёт, ты шесть раз работаешь за одни и те же деньги.";
        else if(a === 0) note = "Ты не оставил себе ничего. Так работа теряет смысл в твоих же глазах, и всё бросается недели через две.";
        else if(b === 0) note = "На цель не откладывается ничего. Через полгода будет десять выполненных заказов и ноль на руках.";
        else if(reached > 0) note = "Цель закрывается на " + reached + "-м заказе. Привычка складывается на маленьких деньгах, а работает потом на больших.";
        else note = "За шесть заказов до цели не дойти. Либо подними долю «в цель», либо возьми цель поменьше — она должна быть достижима, иначе не работает.";

        document.getElementById("g5out").innerHTML =
          '<div class="g-out-line"><span>Заработано за шесть заказов</span><b>' + earned + ' ₽</b></div>' +
          '<div class="g-out-line"><span>Накоплено на цель</span><b class="g-big">' + saved + ' ₽</b></div>' +
          '<div class="g-out-line"><span>Цена шестого заказа</span><b>' + price + ' ₽</b></div>' +
          '<p class="g-sub" style="margin-top:10px">' + esc(note) + '</p>';
      }

      ["g5sum","g5goal","g5a","g5b"].forEach(function(id){ document.getElementById(id).addEventListener("input", calc); });
      calc();
    }
  };


window.PD_gameBlock = gameBlock;
window.PD_initGame = initGame;
})();
