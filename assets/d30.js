(function(){
  var KEY='d30-done', ALL=7;
  function get(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
  function set(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  function goal(n){ try{ if(window.ym) ym(111682005,'reachGoal',n); }catch(e){} }
  function day(ts){ var d=new Date(ts); return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate(); }
  var done=get(), today=day(Date.now());
  // День n открыт, если сделан, или если n-1 сделан не сегодня. Одно задание в сутки.
  function state(n){
    if(n<=1 || done[n]) return 'open';
    var p=done[n-1];
    if(!p) return 'wait';
    return day(p)<today ? 'open' : 'tomorrow';
  }
  document.querySelectorAll('[data-day]').forEach(function(el){
    var n=+el.getAttribute('data-day'), s=state(n);
    if(done[n]) el.classList.add('is-done');
    if(s!=='open'){ el.classList.add('is-locked'); el.querySelector('.n').setAttribute('data-lock', s==='tomorrow'?'завтра':'позже'); }
  });
  var cnt=Object.keys(done).length, bar=document.querySelector('.d30-bar i'), lbl=document.querySelector('.d30-count');
  if(bar) bar.style.width=Math.round(Math.min(cnt,ALL)/ALL*100)+'%';
  if(lbl) lbl.textContent=Math.min(cnt,ALL);
  var btn=document.querySelector('.d30-done');
  if(btn){
    var d=+btn.getAttribute('data-done'), s=state(d);
    if(s!=='open'){
      var w=document.querySelector('main > .wrap');
      w.querySelectorAll('section').forEach(function(x){ x.hidden=true; });
      var box=document.createElement('section');
      box.innerHTML = s==='tomorrow'
        ? '<h2>Этот день откроется завтра</h2><p>Вчерашнее задание ты сделал сегодня — молодец. Одно задание в день: так оно успевает случиться в жизни, а не только на экране.</p>'
        : '<h2>Сначала день '+(d-1)+'</h2><p>Дни открываются по очереди: сделай задание дня '+(d-1)+' и нажми «Сделано». Следующий откроется на другой день.</p><p><a class="cta-btn" href="/30-dney/den-'+(d-1)+'/">К дню '+(d-1)+'</a></p>';
      w.insertBefore(box, w.firstChild);
    }
    var show=function(){ if(done[d]){ btn.textContent='Сделано ✓'; btn.classList.add('is-done'); } };
    show();
    btn.addEventListener('click', function(){
      if(!done[d]){ done[d]=Date.now(); set(done); goal('d30-den-'+d); }
      show();
      if(d<ALL && !document.querySelector('.d30-tomorrow')){
        var t=document.createElement('p'); t.className='checkpoint d30-tomorrow';
        t.textContent='День '+(d+1)+' откроется завтра. Приходи — задание займёт 15 минут.';
        btn.parentNode.insertBefore(t, btn.nextSibling);
      }
    });
  }
  document.querySelectorAll('[data-goal]').forEach(function(a){
    a.addEventListener('click', function(){ goal(a.getAttribute('data-goal')); });
  });
})();
