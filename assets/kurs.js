
(function(){
  "use strict";

  var KEY_AUTH = "pd_auth";
  var KEY_DONE = "pd_done";
  var KEY_FIELD = "pd_f_";
  var KEY_PID = "pd_pid";

  function store(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }
  function read(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }

  /* ---------- Тост ---------- */
  var pdToastEl = null, pdToastTimer = null;
  function pdToast(msg){
    if(!pdToastEl){
      pdToastEl = document.createElement("div");
      pdToastEl.className = "pd-toast";
      document.body.appendChild(pdToastEl);
    }
    pdToastEl.textContent = msg;
    pdToastEl.classList.add("show");
    clearTimeout(pdToastTimer);
    var hold = Math.min(6000, Math.max(1400, msg.length * 55));
    pdToastTimer = setTimeout(function(){ pdToastEl.classList.remove("show"); }, hold);
  }

  /* ---------- Появление при прокрутке ---------- */
  function pdInitReveal(root){
    var els = (root || document).querySelectorAll(".reveal:not(.in)");
    if(!("IntersectionObserver" in window)){
      Array.prototype.forEach.call(els, function(el){ el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    Array.prototype.forEach.call(els, function(el){ io.observe(el); });
  }

  /* ---------- Уроки ---------- */
  var LESSONS = [];

  /* ---------- Состояние ---------- */
  function getDone(){
    try{ return JSON.parse(read(KEY_DONE) || "[]"); }catch(e){ return []; }
  }
  function setDone(arr){ store(KEY_DONE, JSON.stringify(arr)); }

  var gate = document.getElementById("gate");
  var app = document.getElementById("app");
  var dash = document.getElementById("dash");
  var reader = document.getElementById("reader");
  var current = null;

  /* ---------- Вход ---------- */
  function unlock(){
    gate.hidden = true;
    app.hidden = false;
    var codeEl = document.getElementById("codeDisplay");
    if(codeEl) codeEl.textContent = read(KEY_AUTH) || "";
    var refundEl = document.getElementById("refundLink");
    var pid = read(KEY_PID);
    if(refundEl && pid){
      refundEl.innerHTML = '<a href="https://pervye-dengi.com/pay/refund?payment_id=' + encodeURIComponent(pid) + '" style="color:inherit">Оформить возврат</a>';
    }
    if(LESSONS.length){ renderDash(); return; }
    loadLessons();
  }

  /* Содержание шагов хранится не в этой странице, а у нас на сервере
     и выдаётся только по действующему коду доступа. */
  function loadLessons(){
    var listEl = document.getElementById("lessonList");
    if(listEl) listEl.innerHTML = '<p style="color:var(--ink-soft)">Загружаем шаги…</p>';
    fetch("/pay/kurs-content?code=" + encodeURIComponent(read(KEY_AUTH) || ""))
      .then(function(r){ return r.json(); })
      .then(function(d){
        if(d && d.lessons && d.lessons.length){
          LESSONS = d.lessons;
          renderDash();
        } else {
          lessonsFailed();
        }
      })
      .catch(lessonsFailed);
  }
  function lessonsFailed(){
    var listEl = document.getElementById("lessonList");
    if(listEl){
      listEl.innerHTML =
        '<p><strong>Не получилось загрузить шаги.</strong></p>' +
        '<p style="color:var(--ink-soft)">Проверь связь и обнови страницу. Если не помогает — напиши в поддержку, код входа у тебя останется: ' +
        '<a href="https://t.me/ervyedengi_support_bot">@ervyedengi_support_bot</a></p>';
    }
  }
  function verifyCode(code, onValid, onInvalid){
    fetch("/pay/verify?code=" + encodeURIComponent(code))
      .then(function(r){ return r.json(); })
      .then(function(data){ if(data.valid) onValid(); else onInvalid(); })
      .catch(onInvalid);
  }
  function tryCode(){
    var v = (document.getElementById("code").value || "").trim().toUpperCase();
    var btn = document.getElementById("enterBtn");
    btn.disabled = true;
    document.getElementById("gateErr").textContent = "";
    verifyCode(v, function(){
      btn.disabled = false;
      store(KEY_AUTH, v);
      unlock();
    }, function(){
      btn.disabled = false;
      document.getElementById("gateErr").textContent = "Такой код не подходит. Проверь раскладку и дефис.";
    });
  }
  document.getElementById("enterBtn").addEventListener("click", tryCode);
  document.getElementById("code").addEventListener("keydown", function(e){
    if(e.key === "Enter") tryCode();
  });
  document.getElementById("exitBtn").addEventListener("click", function(){
    store(KEY_AUTH, "");
    app.hidden = true;
    gate.hidden = false;
    document.getElementById("code").value = "";
  });

  /* ---------- Дашборд ---------- */
  function renderDash(){
    var done = getDone();
    var list = document.getElementById("lessonList");
    list.innerHTML = "";

    LESSONS.forEach(function(les){
      var isDone = done.indexOf(les.n) !== -1;
      var card = document.createElement("button");
      card.className = "lesson-card reveal" + (isDone ? " done" : "");
      card.innerHTML =
        '<span class="l-num">' + (isDone ? "✓" : les.n) + '</span>' +
        '<span class="l-body">' +
          '<span class="l-title">' + les.title + '</span>' +
          '<span class="l-meta">' + les.meta + '</span>' +
        '</span>' +
        '<span class="l-status">' + (isDone ? "Пройден" : "Открыть") + '</span>';
      card.addEventListener("click", function(){ openLesson(les.n); });
      list.appendChild(card);
    });

    document.getElementById("doneCount").textContent = done.length;

    var trackEl = document.getElementById("cycleTrack");
    trackEl.innerHTML = LESSONS.map(function(les){
      var isDone = done.indexOf(les.n) !== -1;
      return '<div class="cycle-node' + (isDone ? " done" : "") + '">' +
        '<span class="cycle-dot">' + (isDone ? "✓" : les.n) + '</span>' +
        '<span class="cycle-verb">' + les.verb + '</span>' +
      '</div>';
    }).join("");

    var certBlock = document.getElementById("certBlock");
    if(isCertQualified()){
      certBlock.hidden = false;
      certBlock.innerHTML =
        '<div class="cert-cta reveal"><h2 class="display">У тебя есть первая сделка</h2>' +
        '<p>Нашёл клиента, посчитал цену, предложил, сделал и получил деньги — это то, что реально умеет не каждый взрослый. Забери карточку: что сделал, сколько получил, когда.</p>' +
        '<button class="btn" id="certBtn">Получить карточку сделки</button></div>';
      document.getElementById("certBtn").addEventListener("click", openCertificate);
    } else {
      certBlock.hidden = true;
      certBlock.innerHTML = "";
    }

    var nextBlock = document.getElementById("nextBlock");
    var allFive = [1,2,3,4,5].every(function(n){ return done.indexOf(n) !== -1; });
    if(allFive){
      nextBlock.hidden = false;
      nextBlock.innerHTML =
        '<div class="next-step reveal">' +
        '<div class="kick">Ступень 2 · открыта частично</div>' +
        '<h2 class="display">Первый капитал</h2>' +
        '<div class="price">Первые три модуля бесплатно · дальше семь, 2900 ₽ · с 14 лет</div>' +
        '<p>Первый заказ — событие. Второй, третий и четвёртый показывают то, чего с первого раза не видно.</p>' +
        '<ul>' +
        '<li>сколько на самом деле стоит твой час — со всей перепиской, переделками и ожиданием;</li>' +
        '<li>на какой цене тебе говорят «нет» — граница твоего сегодняшнего рынка;</li>' +
        '<li>сколько дней проходит, прежде чем заказчик напишет сам.</li>' +
        '</ul>' +
        '<a class="go" href="/pervyy-kapital/">Открыть три бесплатных модуля →</a>' +
        '<p class="after">Начинать стоит, когда за спиной хотя бы три выполненных заказа: по одному ставку считать нельзя.</p>' +
        '</div>';
    } else {
      nextBlock.hidden = true;
      nextBlock.innerHTML = "";
    }

    dash.hidden = false;
    reader.hidden = true;
    pdInitReveal(dash);
  }

  /* ---------- Сертификат ---------- */
  function isCertQualified(){
    var done = getDone();
    var allDone = [1,2,3,4,5].every(function(n){ return done.indexOf(n) !== -1; });
    if(!allDone) return false;
    var what = read(KEY_FIELD + "f4a");
    var earned = read(KEY_FIELD + "f4c");
    var a = read(KEY_FIELD + "f5a"), b = read(KEY_FIELD + "f5b"), c = read(KEY_FIELD + "f5c");
    return !!(what && what.trim()) && !!(earned && earned.trim()) && !!(a && a.trim()) && !!(b && b.trim()) && !!(c && c.trim());
  }

  function openCertificate(){
    dash.hidden = true;
    reader.hidden = true;
    document.getElementById("certView").hidden = false;
    document.getElementById("certResult").hidden = true;
    var saved = read("pd_cert_name");
    if(saved) document.getElementById("certName").value = saved;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  function pdWrapLines(ctx, text, maxWidth){
    var words = text.split(" ");
    var line = "", lines = [];
    for(var i = 0; i < words.length; i++){
      var test = line + words[i] + " ";
      if(ctx.measureText(test).width > maxWidth && line !== ""){
        lines.push(line.trim());
        line = words[i] + " ";
      } else {
        line = test;
      }
    }
    lines.push(line.trim());
    return lines;
  }

  function drawCertificate(name){
    var canvas = document.getElementById("certCanvas");
    var ctx = canvas.getContext("2d");
    var W = canvas.width, H = canvas.height;

    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0F6259");
    grad.addColorStop(1, "#052B2A");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "left";
    ctx.fillStyle = "#F2B705";
    ctx.font = "700 24px 'JetBrains Mono', monospace";
    ctx.fillText("ПЕРВЫЕ ДЕНЬГИ · ПЕРВАЯ СДЕЛКА", 90, 110);

    ctx.fillStyle = "#FBF6EC";
    ctx.font = "800 54px 'Unbounded', sans-serif";
    var nameLines = pdWrapLines(ctx, name, W - 180);
    nameLines.slice(0, 1).forEach(function(l, i){ ctx.fillText(l, 90, 190 + i * 62); });
    var y = 190 + 56;

    var whatRaw = (read(KEY_FIELD + "f4a") || "").trim();
    var earnedRaw = (read(KEY_FIELD + "f4c") || "").trim();

    ctx.fillStyle = "#8FB3AC";
    ctx.font = "700 18px 'JetBrains Mono', monospace";
    ctx.fillText("ЧТО СДЕЛАЛ", 90, y + 30);
    ctx.fillStyle = "#FBF6EC";
    ctx.font = "400 30px 'PT Sans', sans-serif";
    var whatLines = pdWrapLines(ctx, whatRaw, W - 180).slice(0, 2);
    whatLines.forEach(function(l, i){ ctx.fillText(l, 90, y + 70 + i * 38); });
    y = y + 70 + whatLines.length * 38;

    ctx.fillStyle = "#8FB3AC";
    ctx.font = "700 18px 'JetBrains Mono', monospace";
    ctx.fillText("ПОЛУЧИЛ", 90, y + 26);
    ctx.fillStyle = "#F2B705";
    ctx.font = "800 40px 'Unbounded', sans-serif";
    ctx.fillText(pdWrapLines(ctx, earnedRaw, W - 180)[0] || "", 90, y + 72);

    var stepY = y + 175;
    var stepX = 90, trackW = W - 180;
    var gap = trackW / LESSONS.length;
    ctx.textAlign = "center";
    LESSONS.forEach(function(les, i){
      var cx = stepX + gap * i + gap / 2;
      if(i < LESSONS.length - 1){
        ctx.strokeStyle = "#3C665F";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + 28, stepY);
        ctx.lineTo(cx + gap - 28, stepY);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(cx, stepY, 26, 0, Math.PI * 2);
      ctx.fillStyle = "#F2B705";
      ctx.fill();
      ctx.fillStyle = "#052B2A";
      ctx.font = "700 22px 'JetBrains Mono', monospace";
      ctx.fillText(String(les.n), cx, stepY + 8);
      ctx.fillStyle = "#F4EFE2";
      ctx.font = "700 17px 'JetBrains Mono', monospace";
      ctx.fillText(les.verb, cx, stepY + 55);
    });

    ctx.textAlign = "left";
    var today = new Date();
    var pad2 = function(n){ return (n < 10 ? "0" : "") + n; };
    var dateStr = pad2(today.getDate()) + "." + pad2(today.getMonth() + 1) + "." + today.getFullYear();
    ctx.fillStyle = "#CFE3DD";
    ctx.font = "400 22px 'JetBrains Mono', monospace";
    ctx.fillText(dateStr + " · pervye-dengi.com", 90, H - 60);

    document.getElementById("certDownload").href = canvas.toDataURL("image/png");
  }

  document.getElementById("certBackBtn").addEventListener("click", function(){
    document.getElementById("certView").hidden = true;
    renderDash();
  });
  document.getElementById("certDrawBtn").addEventListener("click", function(){
    var name = (document.getElementById("certName").value || "").trim();
    if(!name){ document.getElementById("certName").focus(); return; }
    store("pd_cert_name", name);
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function(){
      drawCertificate(name);
      document.getElementById("certResult").hidden = false;
    });
  });

  /* ---------- Карточка со скриптами (Шаг 3) ---------- */
  window.pdDownloadScriptCard = function(){
    var canvas = document.createElement("canvas");
    canvas.width = 1000; canvas.height = 1560;
    var ctx = canvas.getContext("2d");
    var fontsReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
    fontsReady.then(function(){
      ctx.fillStyle = "#FBF6EC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#0F6259";
      ctx.font = "700 22px 'JetBrains Mono', monospace";
      ctx.fillText("ПЕРВЫЕ ДЕНЬГИ · ШПАРГАЛКА", 60, 80);

      ctx.fillStyle = "#16241F";
      ctx.font = "800 42px 'Unbounded', sans-serif";
      ctx.fillText("Что написать заказчику", 60, 150);
      ctx.fillStyle = "#4E5D56";
      ctx.font = "400 24px 'PT Sans', sans-serif";
      ctx.fillText("Сначала покажи готовое, потом договорись письменно.", 60, 190);

      var blocks = [
        { label: "ПРОДАВЦУ НА МАРКЕТПЛЕЙСЕ", text: "«Здравствуйте. Переделал главное фото вашей термокружки — вот как стало. Остальные карточки сделаю по 300 ₽ за штуку, срок — два дня. Делаем?»" },
        { label: "МЕСТНОМУ БИЗНЕСУ", text: "«Здравствуйте. Я Саша, живу в соседнем доме, часто у вас беру кофе. Собрал ваше меню в нормальном виде — вот, посмотрите с телефона. Если нравится, распечатаю и сделаю версию для интернета, 800 ₽. Нужно?»" },
        { label: "КАНАЛУ ИЛИ БЛОГУ", text: "«Здравствуйте. Сделал обложку к вашему последнему ролику — вот она. Дальше могу делать по 250 ₽ за штуку, в день выхода. Интересно?»" },
        { label: "ПОСЛЕ «ДА» — ДО НАЧАЛА РАБОТЫ", text: "«Договорились: делаю ... . Сдам ... . Стоимость — ... , оплата ... . Всё верно?»" },
        { label: "ЕСЛИ ОТКАЗАЛИ", text: "«Понял, спасибо. Образец оставляю вам, пользуйтесь. А вы не знаете, кому это может быть нужно?»" }
      ];
      var y = 270;
      blocks.forEach(function(b){
        ctx.fillStyle = "#0F6259";
        ctx.font = "700 19px 'JetBrains Mono', monospace";
        ctx.fillText(b.label, 60, y);
        y += 18;
        ctx.strokeStyle = "#E4DBC8";
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(60, y + 14); ctx.lineTo(940, y + 14); ctx.stroke();
        y += 46;
        ctx.fillStyle = "#16241F";
        ctx.font = "italic 400 26px 'PT Sans', sans-serif";
        var lines = pdWrapLines(ctx, b.text, 880);
        lines.forEach(function(l){ ctx.fillText(l, 60, y); y += 37; });
        y += 42;
      });

      ctx.fillStyle = "#4E5D56";
      ctx.font = "400 19px 'JetBrains Mono', monospace";
      ctx.fillText("Замени имя, услугу и цену на свои. pervye-dengi.com", 60, canvas.height - 50);

      var a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "pervye-dengi-skripty.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
  };

  /* ---------- Памятка о договорённости (Шаг 4) ---------- */
  function bindMemo(){
    var btn = document.getElementById("memoBtn");
    if(!btn) return;

    btn.addEventListener("click", function(){
      var v = function(id){ return (document.getElementById(id).value || "").trim(); };
      var what = v("f4m1"), when = v("f4m2"), price = v("f4m3"), pay = v("f4m4");

      if(!what || !when || !price){
        pdToast("Заполни хотя бы что делаешь, когда сдашь и сколько стоит.");
        return;
      }

      var text = "Договорились: " + what + ". Сдам " + when + ". Стоимость — " + price +
        (pay ? ", оплата " + pay : "") + ". Всё верно?";

      var out = document.getElementById("memoOut");
      document.getElementById("memoText").value = text;
      out.hidden = false;
    });

    var copyBtn = document.getElementById("memoCopy");
    if(copyBtn){
      copyBtn.addEventListener("click", function(){
        var ta = document.getElementById("memoText");
        ta.select();
        var ok = false;
        try{ ok = document.execCommand("copy"); }catch(e){}
        if(navigator.clipboard && navigator.clipboard.writeText){
          navigator.clipboard.writeText(ta.value).then(function(){ pdToast("Скопировано ✓"); }, function(){
            if(!ok) pdToast("Не вышло скопировать — выдели текст и скопируй вручную.");
          });
        } else {
          pdToast(ok ? "Скопировано ✓" : "Не вышло скопировать — выдели текст и скопируй вручную.");
        }
      });
    }
  }

  /* ---------- Смена роли: «теперь платишь ты» (Шаг 2) ---------- */
  function pdEsc(s){
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function roundTo50(n){ return Math.max(50, Math.round(n / 50) * 50); }

  var roleSwapAnswered = false;

  function renderRoleSwap(){
    var host = document.getElementById("roleSwap");
    if(!host) return;
    if(roleSwapAnswered) return;

    var service = (read(KEY_FIELD + "f2a1") || "").trim();
    var priceRaw = (read(KEY_FIELD + "f2e1") || "").trim();

    if(!service || !priceRaw){
      host.innerHTML = '<div class="decision"><p class="decision-q">Сначала заполни первую строку таблицы выше — услугу и цену. Тогда здесь появится <strong>твоё собственное предложение</strong> рядом с двумя другими, и ты увидишь его глазами того, кто платит.</p></div>';
      return;
    }

    var p = parseNum(priceRaw);
    var cheapPrice = isNaN(p) ? "дешевле тебя" : roundTo50(p * 0.6) + " ₽";
    var proPrice = isNaN(p) ? "дороже тебя" : roundTo50(p * 1.25) + " ₽";
    var myPrice = isNaN(p) ? pdEsc(priceRaw) : (Math.round(p) + " ₽");

    host.innerHTML =
      '<div class="decision">' +
        '<div class="offer"><span class="offer-tag">Исполнитель А</span>' +
          '<p class="offer-line"><strong>' + cheapPrice + '</strong> — «' + pdEsc(service) + '», сделаю недорого, там по ходу разберёмся.</p></div>' +
        '<button type="button" class="opt-btn" onclick="window.pdRoleChoice &amp;&amp; window.pdRoleChoice(this,\'a\')">Выбираю А</button>' +
        '<div class="decision-answer" hidden><p>Так почти никто не выбирает, когда платит свои деньги. Дешевле — это ещё и риск: непонятно, что именно получишь и когда. Экономия небольшая, а неизвестность полная.</p></div>' +

        '<div class="offer offer-mine"><span class="offer-tag">Исполнитель Б — это ты</span>' +
          '<p class="offer-line"><strong>' + myPrice + '</strong> — «' + pdEsc(service) + '»</p></div>' +
        '<button type="button" class="opt-btn" onclick="window.pdRoleChoice &amp;&amp; window.pdRoleChoice(this,\'b\')">Выбираю себя</button>' +
        '<div class="decision-answer" hidden><p>Хорошо, но проверь честно, глазами человека с деньгами: по твоей строчке понятно, <strong>что именно</strong> он получит и <strong>когда</strong>? Есть хоть одно доказательство, что ты это уже делал? Если нет — ты сейчас выглядишь как исполнитель А, только дороже.</p></div>' +

        '<div class="offer"><span class="offer-tag">Исполнитель В</span>' +
          '<p class="offer-line"><strong>' + proPrice + '</strong> — «' + pdEsc(service) + '», сделаю к субботе, две правки входят в цену. Делал уже пятерым — покажу, как было и как стало.</p></div>' +
        '<button type="button" class="opt-btn" onclick="window.pdRoleChoice &amp;&amp; window.pdRoleChoice(this,\'v\')">Выбираю В</button>' +
        '<div class="decision-answer" hidden><p>Так выбирает большинство — и это не про деньги. В дороже, но он снял риск: назвал срок, показал, что уже делал это, и пообещал доказательство. Человек платит не за низкую цену, а за спокойствие.</p></div>' +

        '<div class="decision-final" hidden><p><strong>Вывод.</strong> Выигрывает не самая низкая цена, а самое понятное предложение с доказательством. Вернись к своей строке в таблице и допиши в неё то, чего не хватает: срок, объём, доказательство.</p></div>' +
      '</div>';
  }

  window.pdRoleChoice = function(btn, key){
    roleSwapAnswered = true;
    var box = btn.parentNode;
    var opts = box.querySelectorAll(".opt-btn");
    Array.prototype.forEach.call(opts, function(b){ b.disabled = true; });
    btn.classList.add("opt-chosen");
    if(btn.nextElementSibling) btn.nextElementSibling.hidden = false;
    var fin = box.querySelector(".decision-final");
    if(fin) fin.hidden = false;
  };

  /* ---------- Калькулятор цены (Шаг 2) ---------- */
  function parseNum(s){
    if(!s) return NaN;
    var n = parseFloat(String(s).replace(",", "."));
    return isNaN(n) ? NaN : n;
  }
  function bindCalc(){
    [1,2,3].forEach(function(i){
      var timeEl = document.getElementById("f2b" + i);
      var rateEl = document.getElementById("f2c" + i);
      var expEl = document.getElementById("f2d" + i);
      var calcEl = document.getElementById("f2calc" + i);
      if(!timeEl || !rateEl || !expEl || !calcEl) return;
      function update(){
        var t = parseNum(timeEl.value), r = parseNum(rateEl.value), e = parseNum(expEl.value);
        if(isNaN(e)) e = 0;
        calcEl.textContent = (!isNaN(t) && !isNaN(r)) ? ("≈ " + Math.round(t * r + e) + " ₽") : "—";
      }
      [timeEl, rateEl, expEl].forEach(function(el){ el.addEventListener("input", update); });
      update();
    });

    /* строка 1 кормит блок «теперь платишь ты» */
    ["f2a1", "f2e1"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener("input", function(){ renderRoleSwap(); });
    });
  }

  /* ---------- Урок ---------- */

/* trenazhery vynesdeny v kurs-igry.js */
function gameBlock(n){ return window.PD_gameBlock ? window.PD_gameBlock(n) : ""; }
function initGame(n){ if(window.PD_initGame) window.PD_initGame(n); }

  function openLesson(n){
    var les = LESSONS.filter(function(l){ return l.n === n; })[0];
    if(!les) return;
    current = n;

    var pid = read(KEY_PID);
    if(pid){
      try{ fetch("/pay/track?pid=" + encodeURIComponent(pid), { method: "POST", keepalive: true }); }catch(e){}
    }

    document.getElementById("lessonContent").innerHTML =
      '<h1>Шаг ' + les.n + '. ' + les.title + '</h1>' +
      '<div class="lesson-meta">' + les.meta + ' · в конце у тебя будет: ' + les.result + '</div>' +
      les.html +
      gameBlock(les.n) +
      '<div class="task"><span class="task-label">Задание</span>' + les.task +
      '<div class="save-hint">Всё, что ты пишешь здесь, сохраняется автоматически на этом устройстве.</div></div>' +
      '<div class="parents"><h3>Родителям</h3>' + les.parents + '</div>';

    restoreFields();
    bindFields();
    bindCalc();
    roleSwapAnswered = false;
    renderRoleSwap();
    bindMemo();
    initGame(les.n);

    var revealTargets = document.querySelectorAll("#lessonContent .callout, #lessonContent .decision, #lessonContent .task, #lessonContent .parents");
    Array.prototype.forEach.call(revealTargets, function(el){ el.classList.add("reveal"); });
    pdInitReveal(document.getElementById("reader"));

    var done = getDone();
    var btn = document.getElementById("doneBtn");
    var isDone = done.indexOf(n) !== -1;
    btn.textContent = isDone ? "✓ Шаг пройден" : "Отметить пройденным";
    btn.className = "btn done-btn" + (isDone ? " is-done" : "");

    document.getElementById("nextBtn").hidden = (n >= LESSONS.length);

    dash.hidden = true;
    reader.hidden = false;
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  /* ---------- Сохранение полей ---------- */
  function bindFields(){
    var fields = reader.querySelectorAll("input[type='text'], textarea");
    Array.prototype.forEach.call(fields, function(el){
      if(!el.id) return;
      var saveTimer;
      el.addEventListener("input", function(){
        store(KEY_FIELD + el.id, el.value);
        clearTimeout(saveTimer);
        saveTimer = setTimeout(function(){ pdToast("Сохранено ✓"); }, 500);
      });
    });
  }
  function restoreFields(){
    var fields = reader.querySelectorAll("input[type='text'], textarea");
    Array.prototype.forEach.call(fields, function(el){
      if(!el.id) return;
      var saved = read(KEY_FIELD + el.id);
      if(saved !== null) el.value = saved;
    });
  }

  /* ---------- Шаг закрывается результатом, а не прочтением ---------- */
  var PROOF = {
    1: { field: "f1a", msg: "Шаг закрывается результатом. Впиши конкретных заказчиков — со ссылкой или адресом и названной поломкой." },
    2: { field: "f2e1", msg: "Шаг закрывается результатом. Посчитай хотя бы одну цену в таблице." },
    3: { field: "f3a1", msg: "Это главный шаг. Он закрывается, когда ты показал готовый образец живому человеку — впиши, кому именно." },
    4: { field: "f4c", msg: "Шаг закрывается, когда деньги получены. Впиши, сколько получил." },
    5: { field: "f5a", msg: "Шаг закрывается, когда деньги разделены. Впиши, сколько оставляешь на траты." }
  };
  function proofMissing(n){
    var rule = PROOF[n];
    if(!rule) return null;
    var v = read(KEY_FIELD + rule.field);
    return (v && v.trim()) ? null : rule;
  }

  /* ---------- Кнопки урока ---------- */
  document.getElementById("doneBtn").addEventListener("click", function(){
    var done = getDone();
    var i = done.indexOf(current);

    if(i === -1){
      var missing = proofMissing(current);
      if(missing){
        pdToast(missing.msg);
        var el = document.getElementById(missing.field);
        if(el){
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          el.classList.add("need-proof");
          setTimeout(function(){ el.classList.remove("need-proof"); }, 2600);
          el.focus({ preventScroll: true });
        }
        return;
      }
      done.push(current);
    } else {
      done.splice(i, 1);
    }
    setDone(done);
    openLesson(current);
  });
  document.getElementById("backBtn").addEventListener("click", renderDash);
  document.getElementById("nextBtn").addEventListener("click", function(){
    if(current < LESSONS.length) openLesson(current + 1);
  });

  /* ---------- Автовход ---------- */
  var urlParams = new URLSearchParams(location.search);
  var urlCode = (urlParams.get("code") || "").trim().toUpperCase();
  var urlPid = urlParams.get("pid");
  if(urlPid) store(KEY_PID, urlPid);

  function trySaved(){
    var saved = read(KEY_AUTH);
    if(saved) verifyCode(saved, unlock, function(){});
  }

  if(urlCode){
    verifyCode(urlCode, function(){
      store(KEY_AUTH, urlCode);
      unlock();
    }, trySaved);
  } else {
    trySaved();
  }
})();