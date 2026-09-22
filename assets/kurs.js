
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
          o:[ { t:"«Ну, договоримся»", ok:false, why:"Отсутствие цены убивает предложение. Человек не любит гадать и уходит думать навсегда." },
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
        else if(reached > 0) note = "Цель закрывается на " + reached + "-м заказе. Привычка ставится на маленьких деньгах, а работает потом на больших.";
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
