/* Помощник программы «Первые деньги».
   Работает целиком внутри страницы: ничего никуда не отправляет,
   читает только то, что ученик сам записал в свои поля. */
(function () {
  "use strict";

  var FP = "pd_f_";
  var DONE = "pd_done";
  var PANEL_OPEN = "pd_pom_open";

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function field(id) { return (read(FP + id) || "").trim(); }

  function done() {
    try {
      var a = JSON.parse(read(DONE) || "[]");
      return Object.prototype.toString.call(a) === "[object Array]" ? a : [];
    } catch (e) { return []; }
  }
  function isDone(n) { return done().indexOf(n) !== -1; }

  /* строки, в которых есть хоть что-то осмысленное */
  function lines(v) {
    var out = [], parts = v.split(/[\n;]+/), i, t;
    for (i = 0; i < parts.length; i++) {
      t = parts[i].replace(/\s+/g, " ").trim();
      if (t.length >= 4) out.push(t);
    }
    return out;
  }

  /* первое число в тексте: «800 ₽», «800р», «1 200» */
  function num(v) {
    var m = v.replace(/ /g, " ").match(/(\d[\d\s]*)([.,]\d+)?/);
    if (!m) return null;
    var n = parseFloat((m[1] + "").replace(/\s/g, "") + (m[2] ? m[2].replace(",", ".") : ""));
    return isNaN(n) ? null : n;
  }

  /* время в часах: «3 ч 50 мин», «2.5 часа», «180 минут» */
  function hours(v) {
    var s = v.toLowerCase().replace(/ /g, " ");
    var h = 0, got = false, m;
    m = s.match(/(\d+(?:[.,]\d+)?)\s*(?:ч|час)/);
    if (m) { h += parseFloat(m[1].replace(",", ".")); got = true; }
    m = s.match(/(\d+)\s*(?:м|мин)/);
    if (m) { h += parseInt(m[1], 10) / 60; got = true; }
    if (!got) {
      m = s.match(/(\d+(?:[.,]\d+)?)/);
      if (m) { h = parseFloat(m[1].replace(",", ".")); got = true; }
    }
    return got ? h : null;
  }

  function money(n) {
    return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " ₽";
  }

  /* ---------- правила проверки ---------- */

  function checkStep1() {
    var out = [];
    var a = lines(field("f1a"));
    var b = field("f1b");
    var c = lines(field("f1c"));

    if (a.length === 0) {
      out.push(["todo", "Список пуст. Первое задание — найти пятерых, у кого идут продажи и есть что сделать лучше."]);
    } else if (a.length < 5) {
      out.push(["todo", "В списке " + a.length + " из пяти. Вывод по трём строкам делать рано: попадётся один удачный — и решишь, что так будет всегда."]);
    } else {
      out.push(["ok", "Пятеро записаны."]);
    }
    if (a.length > 0) {
      var noLink = 0, i;
      for (i = 0; i < a.length; i++) {
        if (!/(http|www\.|@|\.ru|\.com|ул\.|улиц|дом|адрес)/i.test(a[i])) noLink++;
      }
      if (noLink > 0) {
        out.push(["warn", "В " + noLink + " строках нет ни ссылки, ни адреса. Без этого ты не найдёшь их завтра, когда сядешь писать."]);
      }
    }
    if (!b || b.length < 12) {
      out.push(["todo", "Не записано, что из найденных поломок ты берёшься чинить. Пока это не названо, непонятно, что предлагать."]);
    }
    if (c.length < 3) {
      out.push(["todo", "Выбрано " + c.length + " из троих, к кому пойдёшь первыми."]);
    }
    return out;
  }

  function checkStep2() {
    var out = [];
    var s = field("f2a1");
    var p = field("f2e1");
    if (!s) {
      out.push(["todo", "Не названа услуга, на которую считаешь цену."]);
    }
    if (!p) {
      out.push(["todo", "Цена не посчитана. Нужны две границы: снизу — твоё время, сверху — выгода заказчика."]);
    } else {
      var n = num(p);
      if (n === null) out.push(["warn", "В цене нет числа. Напиши цифрами, иначе её нельзя ни защитить, ни сравнить."]);
      else if (n < 100) out.push(["warn", "Цена " + money(n) + ". Проверь нижнюю границу: посчитай своё время вместе с перепиской и переделками."]);
      else out.push(["ok", "Цена посчитана: " + money(n) + "."]);
    }
    return out;
  }

  function checkStep4() {
    var out = [];
    var what = field("f4a");
    var time = field("f4b");
    var got = field("f4c");
    var plan = field("f4d");

    if (!what) out.push(["todo", "Не записано, что именно ты сделал."]);
    if (!got) {
      out.push(["todo", "Не записана полученная сумма. Это главное число шага."]);
    } else {
      var g = num(got);
      if (g === null) out.push(["warn", "Сумма записана без цифр. Впиши числом."]);
    }
    if (!time) {
      out.push(["todo", "Не записано время. Без него нельзя посчитать, сколько стоил твой час."]);
    }

    var g2 = num(got), h2 = hours(time);
    if (g2 !== null && h2 !== null && h2 > 0) {
      var rate = g2 / h2;
      out.push(["num", "Твой час в этом заказе: " + money(rate) + ". Считано от всего времени, которое ты записал."]);
      if (rate < 150) {
        out.push(["warn", "Это меньше, чем платят за простую работу рядом с домом. Не повод бросать: первая цифра почти у всех такая. Повод поднять цену на следующем заказе."]);
      }
    }
    if (!plan) out.push(["todo", "Не отмечено, совпало ли с расчётом. Это и есть проверка второго шага."]);
    if (!field("f4f")) out.push(["warn", "Не записано, что пошло не по плану. Именно эта строка потом экономит время."]);
    return out;
  }

  function checkStep5() {
    var out = [];
    var a = num(field("f5a")), b = num(field("f5b")), c = num(field("f5c"));
    var got = num(field("f4c"));
    if (a === null && b === null && c === null) {
      out.push(["todo", "Деньги не разделены. Делить надо в день получения: остатка не бывает почти ни у кого."]);
      return out;
    }
    var sum = (a || 0) + (b || 0) + (c || 0);
    out.push(["num", "Разложено: " + money(sum) + "."]);
    if (got !== null) {
      var diff = Math.abs(sum - got);
      if (diff > Math.max(1, got * 0.02)) {
        out.push(["warn", "На четвёртом шаге записано " + money(got) + ", а разложено " + money(sum) + ". Разница " + money(diff) + " — проверь, куда она делась."]);
      } else {
        out.push(["ok", "Сходится с полученной суммой."]);
      }
    }
    if (b === null || b === 0) out.push(["todo", "Часть «в цель» не заполнена. Без названной цели откладывать не получается почти ни у кого."]);
    return out;
  }

  var STEPS = [
    { n: 1, name: "Найди заказчика", check: checkStep1 },
    { n: 2, name: "Посчитай цену", check: checkStep2 },
    { n: 3, name: "Предложи и договорись", check: null },
    { n: 4, name: "Сделай и получи оплату", check: checkStep4 },
    { n: 5, name: "Раздели и назначь следующий", check: checkStep5 }
  ];

  function current() {
    for (var i = 0; i < STEPS.length; i++) if (!isDone(STEPS[i].n)) return STEPS[i];
    return null;
  }

  /* ---------- отрисовка ---------- */

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function body() {
    var cur = current();
    var html = "";

    if (!cur) {
      html += '<p class="pm-head">Пять шагов отмечены пройденными.</p>';
      html += '<p>Проверь последнее: есть ли назначенный день второго предложения. Первый заказ — событие. Второй — уже способ.</p>';
    } else {
      html += '<p class="pm-head">Сейчас: шаг ' + cur.n + ' — ' + esc(cur.name) + '</p>';
    }

    var shown = 0, i, s, res, j, kind, text;
    for (i = 0; i < STEPS.length; i++) {
      s = STEPS[i];
      if (!s.check) continue;
      if (cur && s.n > cur.n) continue;
      res = s.check();
      if (!res.length) continue;
      html += '<div class="pm-block"><div class="pm-step">Шаг ' + s.n + '</div>';
      for (j = 0; j < res.length; j++) {
        kind = res[j][0];
        text = esc(res[j][1]);
        html += '<div class="pm-i pm-' + kind + '">' + text + '</div>';
      }
      html += "</div>";
      shown++;
    }

    if (!shown) {
      html += '<p>Открой шаг и заполни поля — я проверю, чего в них не хватает.</p>';
    }

    html += '<p class="pm-foot">Я не хвалю и не ставлю оценок. Оценку ставит тот, кто заплатил. Всё, что ты записал, остаётся в твоём браузере и никуда не отправляется.</p>';
    return html;
  }

  function counts() {
    var bad = 0, i, s, res, j;
    var cur = current();
    for (i = 0; i < STEPS.length; i++) {
      s = STEPS[i];
      if (!s.check) continue;
      if (cur && s.n > cur.n) continue;
      res = s.check();
      for (j = 0; j < res.length; j++) if (res[j][0] === "todo") bad++;
    }
    return bad;
  }

  var wrap, panel, btn, badge;

  function render() {
    if (!panel) return;
    panel.querySelector(".pm-body").innerHTML = body();
    var n = counts();
    badge.textContent = n ? String(n) : "";
    badge.hidden = !n;
  }

  function toggle(force) {
    var open = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !open;
    write(PANEL_OPEN, open ? "1" : "0");
    if (open) render();
  }

  function css() {
    return '.pm-btn{position:fixed;right:16px;bottom:16px;z-index:60;display:inline-flex;align-items:center;gap:8px;' +
      'background:#052B2A;color:#F4EFE2;border:1px solid rgba(242,183,5,.5);padding:12px 16px;cursor:pointer;' +
      'font-family:"JetBrains Mono",monospace;font-size:.84rem;font-weight:700;border-radius:2px}' +
      '.pm-btn:hover{border-color:#F2B705}' +
      '.pm-badge{background:#F2B705;color:#22190A;padding:1px 7px;border-radius:2px;font-size:.78rem}' +
      '.pm-panel{position:fixed;right:16px;bottom:64px;z-index:61;width:min(380px,calc(100vw - 32px));' +
      'max-height:min(70vh,560px);overflow:auto;background:#FBF6EC;color:#16241F;border:1px solid #DCD2BC;' +
      'border-top:3px solid #0F6259;padding:18px 18px 16px;font-family:"PT Sans",sans-serif;font-size:.95rem;line-height:1.55}' +
      '.pm-title{font-family:"Unbounded",sans-serif;font-weight:800;font-size:1rem;margin:0 0 4px}' +
      '.pm-sub{font-family:"JetBrains Mono",monospace;font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:#68736D;margin-bottom:14px}' +
      '.pm-head{font-weight:700;margin:0 0 12px}' +
      '.pm-block{border-top:1px solid #EBE3D2;padding-top:10px;margin-top:12px}' +
      '.pm-step{font-family:"JetBrains Mono",monospace;font-size:.72rem;letter-spacing:.12em;text-transform:uppercase;color:#68736D;margin-bottom:6px}' +
      '.pm-i{padding:6px 0 6px 14px;border-left:3px solid #DCD2BC;margin-bottom:6px}' +
      '.pm-todo{border-left-color:#A33F1C}' +
      '.pm-warn{border-left-color:#9C7403}' +
      '.pm-ok{border-left-color:#0F6259;color:#4E5D56}' +
      '.pm-num{border-left-color:#0F6259;font-family:"JetBrains Mono",monospace;font-size:.9rem;font-weight:700}' +
      '.pm-foot{margin:16px 0 0;font-size:.82rem;color:#68736D;border-top:1px solid #EBE3D2;padding-top:10px}' +
      '.pm-close{position:absolute;right:10px;top:8px;background:none;border:0;cursor:pointer;font-size:1.1rem;color:#68736D;line-height:1}' +
      '@media (prefers-color-scheme:dark){.pm-panel{background:#10221F;color:#EDEAE2;border-color:#20342F}' +
      '.pm-sub,.pm-step,.pm-foot,.pm-ok{color:#B7C4BD}.pm-block,.pm-foot{border-color:#20342F}}';
  }

  function build() {
    var st = document.createElement("style");
    st.textContent = css();
    document.head.appendChild(st);

    wrap = document.createElement("div");
    wrap.innerHTML =
      '<button class="pm-btn" type="button" aria-expanded="false">Помощник <span class="pm-badge" hidden></span></button>' +
      '<section class="pm-panel" hidden aria-label="Помощник">' +
      '<button class="pm-close" type="button" aria-label="Закрыть">&times;</button>' +
      '<p class="pm-title">Помощник</p>' +
      '<div class="pm-sub">Первые деньги</div>' +
      '<div class="pm-body"></div>' +
      "</section>";
    document.body.appendChild(wrap);

    btn = wrap.querySelector(".pm-btn");
    panel = wrap.querySelector(".pm-panel");
    badge = wrap.querySelector(".pm-badge");

    btn.addEventListener("click", function () {
      toggle();
      btn.setAttribute("aria-expanded", panel.hidden ? "false" : "true");
    });
    wrap.querySelector(".pm-close").addEventListener("click", function () { toggle(false); });

    document.addEventListener("input", function (e) {
      if (e.target && /^f\d/.test(e.target.id || "")) {
        clearTimeout(build._t);
        build._t = setTimeout(render, 400);
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "doneBtn") setTimeout(render, 200);
    });

    render();
    if (read(PANEL_OPEN) === "1") toggle(true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
