/* Помощник программы «Первые деньги».
   Разбор считает наш сервер — тот же, что отвечает боту.
   Здесь только показ: никакой второй копии правил. */
(function () {
  "use strict";

  var KEY_AUTH = "pd_auth";
  var PANEL_OPEN = "pd_pom_open";

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  var wrap, panel, btn, badge, bodyEl;
  var lastData = null;
  var pending = false;

  function css() {
    return '.pm-btn{position:fixed;right:16px;bottom:16px;z-index:60;display:inline-flex;align-items:center;gap:8px;' +
      'background:#052B2A;color:#F4EFE2;border:1px solid rgba(242,183,5,.5);padding:12px 16px;cursor:pointer;' +
      'font-family:"JetBrains Mono",monospace;font-size:.84rem;font-weight:700;border-radius:2px}' +
      '.pm-btn:hover{border-color:#F2B705}' +
      '.pm-badge{background:#F2B705;color:#22190A;padding:1px 7px;border-radius:2px;font-size:.78rem}' +
      '.pm-panel{position:fixed;right:16px;bottom:64px;z-index:61;width:min(380px,calc(100vw - 32px));' +
      'max-height:min(70vh,560px);overflow:auto;background:#FBF6EC;color:#16241F;border:1px solid #DCD2BC;' +
      'border-top:3px solid #0F6259;padding:18px 18px 16px;font-family:'PT Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:.95rem;line-height:1.55}' +
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

  function draw(d) {
    var html = "";
    if (!d) {
      html = '<p>Не получилось получить разбор. Проверь связь и открой панель ещё раз.</p>';
    } else if (d.finished) {
      html += '<p class="pm-head">Пять шагов отмечены пройденными.</p>';
      html += '<p>Проверь последнее: есть ли назначенный день второго предложения. Первый заказ — событие. Второй — уже способ.</p>';
    } else {
      html += '<p class="pm-head">Сейчас: шаг ' + d.step + ' — ' + esc(d.stepName) + '</p>';
    }

    if (d && d.blocks && d.blocks.length) {
      for (var i = 0; i < d.blocks.length; i++) {
        var b = d.blocks[i];
        html += '<div class="pm-block"><div class="pm-step">Шаг ' + b.step + '</div>';
        for (var j = 0; j < b.items.length; j++) {
          html += '<div class="pm-i pm-' + b.items[j].kind + '">' + esc(b.items[j].text) + "</div>";
        }
        html += "</div>";
      }
    } else if (d && !d.finished) {
      html += "<p>Открой шаг и заполни поля — я проверю, чего в них не хватает.</p>";
    }

    html += '<p class="pm-foot">Я не хвалю и не ставлю оценок. Оценку ставит тот, кто заплатил. Твои записи хранятся у нас и никому третьему не передаются.</p>';
    bodyEl.innerHTML = html;
  }

  function refresh(cb) {
    var code = read(KEY_AUTH) || "";
    if (!code) { draw(null); if (cb) cb(); return; }
    if (pending) return;
    pending = true;
    fetch("/pay/advice?code=" + encodeURIComponent(code))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        pending = false;
        if (d && d.valid) {
          lastData = d;
          badge.textContent = d.todo ? String(d.todo) : "";
          badge.hidden = !d.todo;
          if (panel && !panel.hidden) draw(d);
        }
        if (cb) cb();
      })
      .catch(function () {
        pending = false;
        if (panel && !panel.hidden) draw(lastData);
        if (cb) cb();
      });
  }

  function toggle(force) {
    var open = typeof force === "boolean" ? force : panel.hidden;
    panel.hidden = !open;
    write(PANEL_OPEN, open ? "1" : "0");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      if (lastData) draw(lastData);
      else bodyEl.innerHTML = "<p>Смотрю, что уже сделано…</p>";
      refresh();
    }
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
    bodyEl = wrap.querySelector(".pm-body");

    btn.addEventListener("click", function () { toggle(); });
    wrap.querySelector(".pm-close").addEventListener("click", function () { toggle(false); });

    var t = null;
    document.addEventListener("input", function (e) {
      if (e.target && /^f\d/.test(e.target.id || "")) {
        clearTimeout(t);
        t = setTimeout(function () { refresh(); }, 2600);
      }
    });
    document.addEventListener("click", function (e) {
      if (e.target && e.target.id === "doneBtn") setTimeout(function () { refresh(); }, 2200);
    });

    refresh(function () {
      if (read(PANEL_OPEN) === "1") toggle(true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
