/* Игры вдвоём в каждом шаге и вводный блок «Перед стартом».
   Всё по желанию: шаг засчитывается и без игры. Результат хранится только на этом устройстве.
   Психология: число — зеркало, а не оценка; отказ бьёт по предложению, а не по человеку. */
(function () {
  var LV = [["warm", "Разминка"], ["life", "Как в жизни"], ["hard", "Жёстко"]];

  var G = {
    1: {
      title: "Угадай заказчика",
      why: "Тренирует главное различие шага: «людям нужно» и «у человека есть чем заплатить».",
      you: "Взрослый читает пятерых по одному. Про каждого вслух: беру или нет — и по какому признаку: уже тратит деньги на это, делает это регулярно, видно, где сделано плохо.",
      lv: {
        warm: ["Соседка, которая каждую неделю продаёт вещи на Авито, фото тёмные", "Бабушка, которой нужна помощь с телефоном — платить за это она не собирается", "Шиномонтаж у дороги, вывеска написана от руки", "Друг, который «когда-нибудь откроет свой бизнес»", "Канал соседа про рыбалку, 2 тысячи подписчиков, продаёт снасти"],
        life: ["Кондитерская на дому, торты на заказ, в соцсети нет цен", "Одноклассник, которому хочется красивую аватарку", "Мастер маникюра, 15 клиенток в неделю, нет прайса", "Автомойка: в интернете старые фото и телефон, который не отвечает", "Репетитор английского, ученики есть, страницы нет"],
        hard: ["Блогер на 300 тысяч, обложки ему делает команда", "Магазин, который ещё не открылся — «скоро запуск»", "Сетевая кофейня у метро", "Человек, который продаёт один диван", "Крупный завод в вашем городе"]
      },
      secret: {
        warm: "Берётся: соседка с Авито, шиномонтаж, канал про рыбалку. Нет: бабушка (не платит за это), друг (ещё ничего не продаёт).",
        life: "Берётся: кондитерская, маникюр, автомойка, репетитор. Нет: одноклассник — у него нет денег.",
        hard: "Все пятеро — ловушки: у блогера и сети уже есть исполнители, магазин ещё не продаёт, диван продают один раз, завод не закажет у подростка."
      },
      num: "Совпадений из пяти",
      mean: "На настоящем заказчике та же ошибка стоила бы отказа и вечера. Здесь она не стоила ничего."
    },
    2: {
      title: "Дорого!",
      why: "Тренирует держать цену и объяснять, из чего она складывается.",
      you: "Назови конкретную работу и цену, например: «Переснять 8 карточек — 2400 ₽». Снизить цену можно один раз за игру. Дальше — только объяснять: сколько времени, что входит, что изменится у заказчика. Можно убрать часть работы вместо скидки.",
      lv: {
        warm: ["«Ой, а подешевле никак?»", "«Я думал, тысячи за всё хватит»", "«Ну ладно, а что входит в цену?»"],
        life: ["«Дорого»", "«А если без этой части?»", "«Давай 1500, и по рукам»"],
        hard: ["«Сосед сделает за полцены»", "«Я думал, ты просто поможешь, мы же знакомы»", "«Нет. Либо 1000, либо никак»"]
      },
      secret: { all: "Вы согласитесь на его цену, если он объяснит, что вы получите, — не что он сделает, а что изменится у вас: больше продаж, меньше вопросов, меньше вашего времени." },
      num: "На каком возражении удержал цену (1–3, или 4 — удержал до конца)",
      mean: "Цена, которую не можешь объяснить, падает от первого «дорого». Объяснённая — держится."
    },
    3: {
      title: "Пять отказов",
      why: "Главная игра программы. Снимает главную преграду — страх услышать «нет». Задача не убедить, а выдержать.",
      you: "Скажи своё предложение по схеме шага: что сделал → вот оно → сколько дальше → вопрос. На каждый отказ ответь спокойно и не уходи в «ну ладно, извините».",
      lv: {
        warm: ["«Спасибо, но пока не нужно»", "«Давай я подумаю и напишу»", "«Я как-то сам справляюсь»", "«А у тебя есть ещё примеры?»", "«Хм…» — и пауза пять секунд"],
        life: ["«Дорого. Следующий»", "«Давай потом»", "«Я сам сделаю»", "«А ты умеешь вообще?»", "Молчание десять секунд, взгляд в телефон"],
        hard: ["«С чего ты взял, что мне это надо?»", "«Мне сейчас вообще не до этого» — и отвернуться", "«Почему я должен платить тебе, а не взрослому мастеру?»", "«Это любой в телефоне сделает за пять минут»", "Молчание. Не отвечать совсем"]
      },
      secret: { all: "На пятом отказе, если подросток ни разу не извинился за игру, скажите: «Ладно, оставь контакт». Это единственное «да» в игре." },
      strong: ["«Дорого» → «Понимаю. Вот что входит. Можно начать с одной карточки и посмотреть разницу»", "«Потом» → «Конечно. Образец оставлю вам. Когда удобно напомнить — в пятницу?»", "«Сам сделаю» → «Можно. Сколько времени у вас на это уйдёт? Я сделаю за два дня»", "«А умеешь?» → показать образец, без оправданий", "Молчание → выдержать паузу: «Если не сейчас — оставлю контакт. Спасибо, что посмотрели»"],
      num: "Сколько отказов выдержал из пяти, не сдавшись и не извинившись",
      mean: "В жизни отказы будут мягче и реже, чем на сильном уровне. Худшее ты уже слышал."
    },
    4: {
      title: "Спор о времени",
      why: "Тренирует честно оценивать срок, а не только саму работу.",
      you: "Возьми маленькую настоящую задачу из своего заказа — одну карточку, одну обложку. Скажи вслух: «Это займёт … минут». Взрослый запишет свою оценку и не покажет. Засеките время.",
      lv: {
        warm: ["Без помех: просто засеките время"],
        life: ["Через 10 минут после начала: «А можно ещё вот это поправить?»"],
        hard: ["Через 10 минут: «А можно ещё вот это поправить?»", "Ещё через 5 минут: «А можно сегодня, а не завтра?»"]
      },
      secret: { all: "Запишите свою оценку времени до начала и не показывайте. Ближе к правде — тот и выиграл, вы или подросток." },
      num: "Разница между оценкой и фактом, в минутах",
      mean: "Эту разницу прибавляй к каждому сроку, который называешь заказчику. Она есть у всех, у взрослых тоже."
    },
    5: {
      title: "Делёж вслух",
      why: "Тренирует решать о деньгах заранее, а не по ходу трат.",
      you: "Настоящими деньгами, даже если их сто рублей: разложи на три части перед взрослым и вслух назови, на что каждая.",
      lv: {
        warm: ["Только слушать"],
        life: ["Один вопрос: «А почему на эту часть так много?»"],
        hard: ["Соблазн: «Слушай, давай всё на новые наушники, заработаешь ещё» — и выслушать ответ"]
      },
      secret: { all: "Не спорьте и не исправляйте распределение. Ваша роль — проверить, что он может объяснить своё решение. Объяснил — игра выиграна, какими бы ни были суммы." },
      num: "Три суммы, названные вслух (например: 300 / 150 / 50)",
      numText: true,
      mean: "Деньги, которым не назначили дело заранее, исчезают за три дня. Ты только что назначил."
    }
  };

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function css() {
    if (document.getElementById("para-css")) return;
    var s = document.createElement("style");
    s.id = "para-css";
    s.textContent =
      ".para,.pre{border:1px solid rgba(127,191,178,.35);margin:28px 0;background:rgba(127,191,178,.06)}" +
      ".para>summary,.pre>summary{cursor:pointer;padding:14px 16px;font-weight:700;list-style:none}" +
      ".para>summary::-webkit-details-marker,.pre>summary::-webkit-details-marker{display:none}" +
      ".para-tag{display:block;font-family:'JetBrains Mono',monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;opacity:.75;font-weight:400;margin-bottom:4px}" +
      ".para-in{padding:0 16px 16px}" +
      ".para-lv{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}" +
      ".para-lv button,.para-btn{border:1px solid currentColor;background:transparent;color:inherit;padding:9px 12px;cursor:pointer;font:inherit;font-size:.9rem}" +
      ".para-lv button.on{background:#F2B705;color:#22190A;border-color:#F2B705}" +
      ".para-card{border-left:3px solid #F2B705;padding:10px 14px;margin:12px 0;background:rgba(0,0,0,.12)}" +
      ".para-card ol{margin:8px 0 8px 18px;padding:0}.para-card li{margin-bottom:6px}" +
      ".para label{display:block;font-size:.9rem;margin:14px 0 6px;opacity:.85}" +
      ".para input,.para textarea,.pre input,.pre textarea{width:100%;box-sizing:border-box;padding:10px;font:inherit;background:transparent;color:inherit;border:1px solid rgba(127,191,178,.4)}" +
      ".para-mean{margin-top:10px;font-weight:700}.para-prev{font-size:.85rem;opacity:.75;margin-top:6px}" +
      ".pre-calc{display:grid;grid-template-columns:1fr 90px;gap:6px 10px;align-items:center;margin:10px 0}" +
      ".pre-left{font-weight:700;font-size:1.1rem;margin-top:6px}";
    document.head.appendChild(s);
  }

  function list(arr) { return "<ol>" + arr.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol>"; }

  window.PD_paraBlock = function (n) {
    var g = G[n];
    if (!g) return "";
    css();
    return '<details class="para" id="para' + n + '"><summary><span class="para-tag">Игра вдвоём · по желанию · 10–15 минут</span>' + esc(g.title) + "</summary>" +
      '<div class="para-in">' +
      "<p>" + esc(g.why) + " Это репетиция: завтра ты сделаешь это по-настоящему, а сегодня — там, где ошибка ничего не стоит.</p>" +
      '<p class="para-prev">Нужен один взрослый или друг. Рядом никого — подойдёт видеозвонок. Слово «стоп» останавливает игру без объяснений. Не хочешь сейчас — пропусти: шаг засчитывается и без игры.</p>' +
      '<div class="para-lv">' + LV.map(function (l) { return '<button type="button" data-lv="' + l[0] + '">' + l[1] + "</button>"; }).join("") + "</div>" +
      "<p><b>Что делаешь ты.</b> " + esc(g.you) + "</p>" +
      '<button type="button" class="para-btn" data-show>Передай телефон взрослому — карта для него</button>' +
      '<div class="para-card" hidden><p><b>Взрослому.</b> Вы играете роль, а не оцениваете. Говорите строго по карте: слишком мягко — игра бесполезна, слишком зло — подросток закроется. Отказ бьёт по предложению, а не по человеку: никаких слов про возраст, внешность, ум и «иди лучше учись».</p>' +
      '<div data-lines></div>' +
      '<details><summary>Секретная карта — откройте только после игры</summary><p data-secret></p></details></div>' +
      (g.strong ? "<details><summary>Сильные ответы — посмотри после игры, не до</summary>" + list(g.strong) + "</details>" : "") +
      "<p><b>В конце — смена ролей на один раунд:</b> теперь ты заказчик, взрослый предлагает. Потом спроси его: «Когда ты первый раз получил деньги не от родителей — за что?»</p>" +
      "<label>" + esc(g.num) + "</label>" +
      '<input ' + (g.numText ? 'type="text"' : 'type="number" inputmode="numeric" min="0"') + ' data-num>' +
      '<div class="para-prev" data-prev></div>' +
      '<p class="para-mean" data-mean hidden>' + esc(g.mean) + "</p>" +
      "<label>Какая фраза сработала и что скажешь в следующий раз</label><textarea rows=\"2\" data-note></textarea>" +
      "</div></details>";
  };

  window.PD_initPara = function (n) {
    var g = G[n], box = document.getElementById("para" + n);
    if (!g || !box) return;
    var key = "pd_para_" + n;
    var st = {};
    try { st = JSON.parse(get(key) || "{}") || {}; } catch (e) { st = {}; }
    var lv = st.lv || "warm";
    function save() { set(key, JSON.stringify(st)); }
    function draw() {
      Array.prototype.forEach.call(box.querySelectorAll("[data-lv]"), function (b) { b.classList.toggle("on", b.getAttribute("data-lv") === lv); });
      box.querySelector("[data-lines]").innerHTML = list(g.lv[lv]);
      box.querySelector("[data-secret]").textContent = g.secret.all || g.secret[lv];
    }
    Array.prototype.forEach.call(box.querySelectorAll("[data-lv]"), function (b) {
      b.addEventListener("click", function () { lv = b.getAttribute("data-lv"); st.lv = lv; save(); draw(); });
    });
    box.querySelector("[data-show]").addEventListener("click", function () {
      var c = box.querySelector(".para-card"); c.hidden = !c.hidden;
    });
    var num = box.querySelector("[data-num]"), note = box.querySelector("[data-note]");
    var prev = box.querySelector("[data-prev]"), mean = box.querySelector("[data-mean]");
    if (st.last) prev.textContent = "В прошлый раз: " + st.last + (st.lastLv ? " (" + (LV.filter(function (l) { return l[0] === st.lastLv; })[0] || ["", ""])[1] + ")" : "");
    if (st.note) note.value = st.note;
    num.addEventListener("change", function () {
      if (!num.value) return;
      if (st.cur && st.cur !== num.value) { st.last = st.cur; st.lastLv = st.curLv; }
      st.cur = num.value; st.curLv = lv; save();
      mean.hidden = false;
      if (st.last) prev.textContent = "Было: " + st.last + " → стало: " + st.cur;
    });
    note.addEventListener("input", function () { st.note = note.value; save(); });
    draw();
  };

  /* ---------- Перед стартом ---------- */
  window.PD_renderStart = function (list, anyDone) {
    if (!list || document.getElementById("preStart")) return;
    css();
    var d = document.createElement("details");
    d.className = "pre";
    d.id = "preStart";
    if (!anyDone) d.open = true;
    d.innerHTML =
      '<summary><span class="para-tag">Перед стартом · 15 минут · лучше вместе со взрослым</span>Смотри как хозяин</summary>' +
      '<div class="para-in">' +
      "<h3>Куда уходит сотня</h3>" +
      "<p>Возьми любую покупку вашей семьи на этой неделе: шаурму, стрижку, доставку. Ты заплатил сто рублей. Подставь, как они примерно делятся, — цифры у каждого дела свои, ниже только пример.</p>" +
      '<div class="pre-calc">' +
      "<span>Продукты и материалы</span><input type=\"number\" data-p value=\"35\">" +
      "<span>Человеку, который это сделал</span><input type=\"number\" data-p value=\"25\">" +
      "<span>Аренда места</span><input type=\"number\" data-p value=\"15\">" +
      "<span>Налоги, касса, свет</span><input type=\"number\" data-p value=\"10\">" +
      "</div>" +
      '<p class="pre-left" data-left></p>' +
      "<p>Работник получает твёрдую часть: отработал смену — получил, даже если покупателей почти не было. Хозяин получает остаток: в хороший месяц он больше, в плохой может уйти в минус. Он рискует — поэтому остаток его.</p>" +
      "<h3>Две честные позиции</h3>" +
      "<p>Работать по найму — не хуже. Хирург, инженер, учитель — профессионалы, на которых всё держится. Разница не в том, кто лучше, а в том, с какого места смотришь. Работник спрашивает «что мне сделать?». Хозяин спрашивает «что нужно людям и сколько они за это дадут?». Программа учит видеть со второго места — чтобы потом ты выбрал сам, а не оказался где-то по умолчанию.</p>" +
      "<h3>С чего начинается мысль хозяина</h3>" +
      "<p>Не с «что бы мне продать», а с «что у людей вокруг сломано, мешает, отнимает время». Но поломка — ещё не заказ. Заказ — когда у человека есть поломка <b>и</b> он уже тратит на это деньги. Как это отличать, научит шаг 1.</p>" +
      "<h3>Игра «Два кресла» — по желанию, 5 минут</h3>" +
      "<p>Маленькая пекарня. Утром не приехала мука, через три часа открытие, в субботу всегда очередь. Сначала взрослый — работник пекарни, ты — хозяин. Каждый отвечает: что я сейчас чувствую и что сделаю в ближайший час? Потом меняетесь. В конце один вопрос друг другу: в каком кресле было тревожнее, а в каком интереснее?</p>" +
      "<h3>Действие</h3>" +
      "<label>Три места рядом, где у людей что-то сломано: у продавцов, в магазинах на твоей улице, у знакомых взрослых</label>" +
      '<textarea rows="3" data-pre="a" placeholder="У магазина на углу в интернете нет часов работы&#10;Соседка продаёт вещи, фото тёмные&#10;..."></textarea>' +
      "<label>Строка взрослого: «Первый раз я заработал сам, когда…»</label>" +
      '<textarea rows="2" data-pre="b"></textarea>' +
      "<p class=\"para-prev\">Эти три места пригодятся сразу: в шаге 1 ты проверишь, у кого из них есть деньги на твою работу.</p>" +
      "</div>";
    list.parentNode.insertBefore(d, list);
    var inputs = d.querySelectorAll("[data-p]"), left = d.querySelector("[data-left]");
    function calc() {
      var s = 0;
      Array.prototype.forEach.call(inputs, function (i) { var v = parseFloat(i.value); if (!isNaN(v)) s += v; });
      var r = Math.round((100 - s) * 10) / 10;
      left.textContent = r >= 0 ? "Остаток хозяину: " + r + " ₽ из 100" : "Расходы больше сотни на " + (-r) + " ₽ — хозяин в минусе";
    }
    Array.prototype.forEach.call(inputs, function (i) { i.addEventListener("input", calc); });
    calc();
    Array.prototype.forEach.call(d.querySelectorAll("[data-pre]"), function (t) {
      var k = "pd_pre_" + t.getAttribute("data-pre");
      var v = get(k); if (v) t.value = v;
      t.addEventListener("input", function () { set(k, t.value); });
    });
  };
})();
