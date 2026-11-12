/* Отзывы участников практикумов: оценка каждого шага и комментарий в конце.
   Пишет в кассу POST /pay/otzyv, владелец читает /pay/otzyvy?key=...
   Сам находит шаги (кнопка «Шаг выполнен» .dn[data-n]) и финал (#fin), в том числе подгруженные позже. */
(function () {
  var path = location.pathname, P = null;
  if (path.indexOf("/pervye-dengi/") === 0) P = "p2";
  else if (path.indexOf("/praktikum/nastroyka-myshleniya") === 0) P = "p1";
  if (!P) return;
  var API = "/pay/otzyv", LS = "otz-" + P;

  function rid() { return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4); }
  function load() { try { return JSON.parse(localStorage.getItem(LS) || "{}") || {}; } catch (e) { return {}; } }
  function save(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {} }
  function goal(n) { if (typeof ym === "function") { try { ym(111682005, "reachGoal", n); } catch (e) {} } }
  function send(d) {
    d.p = P;
    try {
      return fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), keepalive: true })
        .then(function (r) { return r.ok; }, function () { return false; });
    } catch (e) { return { then: function (f) { f(false); } }; }
  }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  var css = ".otz{margin:18px 0 0;padding:16px 18px;border:1px dashed var(--ln,#ccc);border-radius:4px}" +
    ".otz-q{margin:0 0 10px;font-weight:600}" +
    ".otz-b{display:flex;flex-wrap:wrap;gap:8px}" +
    ".otz-b button,.otz-n button{font:inherit;font-size:15px;padding:8px 14px;border:1px solid currentColor;background:none;color:inherit;border-radius:4px;cursor:pointer;opacity:.85}" +
    ".otz-b button[aria-pressed=true],.otz-n button[aria-pressed=true]{background:var(--ac,#b8893f);border-color:var(--ac,#b8893f);color:#fff;opacity:1}" +
    ".otz textarea,.otz-fin textarea,.otz-fin input[type=text]{display:block;width:100%;box-sizing:border-box;margin-top:6px;font:inherit;font-size:16px;padding:10px 12px;border:1px solid #bbb;border-radius:4px;background:#fff;color:#1a1a1a}" +
    ".otz label,.otz-fin label{display:block;margin-top:12px}" +
    ".otz-send{margin-top:10px;font:inherit;font-weight:600;padding:10px 18px;border:0;border-radius:4px;background:var(--ac,#b8893f);color:#fff;cursor:pointer}" +
    ".otz-ok{margin:10px 0 0;color:var(--ac,#b8893f);font-weight:600}" +
    ".otz-fin{margin:34px 0 10px;padding:22px;border:1px solid var(--ac,#b8893f);border-radius:4px}" +
    ".otz-fin h3{margin:0 0 10px}" +
    ".otz-n{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.otz-n button{min-width:42px;padding:8px 0}" +
    ".otz-r{display:flex;gap:18px;flex-wrap:wrap;margin-top:8px}.otz-r label,.otz-fin .otz-c{display:flex;gap:8px;align-items:flex-start;margin-top:8px}" +
    ".otz-note{font-size:14px;opacity:.8;margin-top:10px}.otz-err{color:#d55;min-height:1.2em;margin:8px 0 0}" +
    ".otz-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------- оценка шага ---------- */
  function stepWidget(dn) {
    var n = parseInt(dn.getAttribute("data-n"), 10); if (!n) return;
    var ck = dn.closest(".ck") || dn.parentNode; if (!ck || ck.getAttribute("data-otz")) return;
    ck.setAttribute("data-otz", "1");
    var w = el("div", "otz",
      '<p class="otz-q">Как тебе этот шаг?</p>' +
      '<div class="otz-b"><button type="button" data-r="ok" aria-pressed="false">Понятно и полезно</button>' +
      '<button type="button" data-r="hard" aria-pressed="false">Было трудно</button>' +
      '<button type="button" data-r="unclear" aria-pressed="false">Непонятно</button></div>' +
      '<div class="otz-more" hidden><label>Что поправить в этом шаге? Можно пропустить.<textarea rows="3" maxlength="2000"></textarea></label>' +
      '<button type="button" class="otz-send">Отправить</button></div>' +
      '<p class="otz-ok" hidden>Спасибо! По таким ответам мы дорабатываем практикум.</p>');
    ck.parentNode.insertBefore(w, ck.nextSibling);
    var bs = w.querySelectorAll(".otz-b button"), more = w.querySelector(".otz-more"), ok = w.querySelector(".otz-ok"), ta = w.querySelector("textarea");
    var all = load(), mine = all["s" + n] || null;
    function mark(r) { [].forEach.call(bs, function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-r") === r ? "true" : "false"); }); }
    if (mine) { mark(mine.r); ok.hidden = !mine.sent; }
    [].forEach.call(bs, function (b) {
      b.addEventListener("click", function () {
        var r = b.getAttribute("data-r"), a = load(), m = a["s" + n] || { rid: rid() };
        m.r = r; a["s" + n] = m; save(a); mark(r);
        send({ s: n, r: r, rid: m.rid, f: m.text ? { text: m.text } : {} });
        goal("otz-" + P + "-" + r);
        more.hidden = false; ok.hidden = true; ta.focus();
      });
    });
    w.querySelector(".otz-send").addEventListener("click", function () {
      var a = load(), m = a["s" + n] || { rid: rid(), r: "" }, t = (ta.value || "").trim();
      m.text = t; m.sent = 1; a["s" + n] = m; save(a);
      send({ s: n, r: m.r || "", rid: m.rid, f: t ? { text: t } : {} });
      more.hidden = true; ok.hidden = false;
    });
  }

  /* ---------- отзыв в конце практикума ---------- */
  function finForm(fin) {
    var box = fin.querySelector(".w") || fin; if (box.getAttribute("data-otz")) return;
    box.setAttribute("data-otz", "1");
    var nums = ""; for (var i = 0; i <= 10; i++) nums += '<button type="button" data-v="' + i + '" aria-pressed="false">' + i + "</button>";
    var f = el("div", "otz-fin",
      "<h3>Оставь комментарий</h3>" +
      "<p>По твоим комментариям мы улучшаем и дорабатываем практикум. Пиши честно: что получилось, что нет, что было непонятно или скучно. Нам важен любой ответ, и критика тоже.</p>" +
      '<label>Что тебе дал практикум больше всего?<textarea name="dal" rows="3" maxlength="2000"></textarea></label>' +
      '<label>Где было трудно, скучно или непонятно?<textarea name="trudno" rows="3" maxlength="2000"></textarea></label>' +
      '<label>Что бы ты изменил или добавил?<textarea name="izmenit" rows="3" maxlength="2000"></textarea></label>' +
      '<div style="margin-top:14px">Насколько ты посоветуешь этот практикум другу? 0 — точно нет, 10 — точно да.<div class="otz-n">' + nums + "</div></div>" +
      '<div class="otz-r"><label><input type="radio" name="otz-kto" value="подросток"> Я подросток</label><label><input type="radio" name="otz-kto" value="родитель"> Я родитель</label></div>' +
      '<label class="otz-c"><input type="checkbox" name="pub"> Можно показать мой отзыв на сайте (только имя, без фамилии)</label>' +
      '<div class="otz-pubf" hidden><label>Имя<input type="text" name="imya" maxlength="40"></label>' +
      '<label>Возраст<input type="text" name="vozrast" maxlength="10"></label></div>' +
      '<div class="otz-hp"><input type="text" name="hp" tabindex="-1" autocomplete="off"></div>' +
      '<p class="otz-note">Не пиши фамилию, телефон, адрес и названия заказчиков.</p>' +
      '<button type="button" class="otz-send">Отправить комментарий</button><p class="otz-err"></p>' +
      '<p class="otz-ok" hidden>Спасибо! Мы прочитаем твой комментарий и учтём его, когда будем дорабатывать практикум.</p>');
    var last = box.querySelector(".last");
    if (last) box.insertBefore(f, last); else box.appendChild(f);
    var nps = "", a0 = load();
    var nb = f.querySelectorAll(".otz-n button");
    [].forEach.call(nb, function (b) {
      b.addEventListener("click", function () {
        nps = b.getAttribute("data-v");
        [].forEach.call(nb, function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      });
    });
    var pub = f.querySelector("[name=pub]"), pubf = f.querySelector(".otz-pubf");
    pub.addEventListener("change", function () { pubf.hidden = !pub.checked; });
    var ok = f.querySelector(".otz-ok"), err = f.querySelector(".otz-err"), btn = f.querySelector(".otz-send");
    if (a0.fin) { ok.hidden = false; }
    btn.addEventListener("click", function () {
      var v = function (n) { var e = f.querySelector("[name=" + n + "]"); return e ? (e.value || "").trim() : ""; };
      var kto = f.querySelector("[name=otz-kto]:checked");
      var data = { dal: v("dal"), trudno: v("trudno"), izmenit: v("izmenit"), nps: nps, kto: kto ? kto.value : "" };
      if (pub.checked) { data.pub = "да"; data.imya = v("imya"); data.vozrast = v("vozrast"); }
      if (!data.dal && !data.trudno && !data.izmenit && nps === "") { err.textContent = "Напиши хотя бы один ответ или поставь оценку."; return; }
      err.textContent = ""; btn.disabled = true;
      var a = load(); var id = (a.fin && a.fin.rid) || rid();
      send({ s: 0, r: "", rid: id, hp: v("hp"), f: data }).then(function (good) {
        btn.disabled = false;
        if (!good) { err.textContent = "Не получилось отправить. Проверь интернет и нажми ещё раз."; return; }
        var b = load(); b.fin = { rid: id, t: Date.now() }; save(b);
        ok.hidden = false; goal("otz-" + P + "-fin");
      });
    });
  }

  function scan() {
    [].forEach.call(document.querySelectorAll(".dn[data-n]"), stepWidget);
    var fin = document.getElementById("fin"); if (fin) finForm(fin);
  }
  scan();
  if ("MutationObserver" in window) {
    var t = null;
    new MutationObserver(function () { clearTimeout(t); t = setTimeout(scan, 150); })
      .observe(document.body, { childList: true, subtree: true });
  }
})();
