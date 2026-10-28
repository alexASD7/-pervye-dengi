(function(){
  var KEY='d30-done', ALL=7;
  function get(){ try{ return JSON.parse(localStorage.getItem(KEY))||{}; }catch(e){ return {}; } }
  function set(o){ try{ localStorage.setItem(KEY, JSON.stringify(o)); }catch(e){} }
  function goal(n){ try{ if(window.ym) ym(111682005,'reachGoal',n); }catch(e){} }
  var done=get();
  document.querySelectorAll('[data-day]').forEach(function(el){
    if(done[el.getAttribute('data-day')]) el.classList.add('is-done');
  });
  var cnt=Object.keys(done).length, bar=document.querySelector('.d30-bar i'), lbl=document.querySelector('.d30-count');
  if(bar) bar.style.width=Math.round(Math.min(cnt,ALL)/ALL*100)+'%';
  if(lbl) lbl.textContent=Math.min(cnt,ALL);
  var btn=document.querySelector('.d30-done');
  if(btn){
    var d=btn.getAttribute('data-done');
    var show=function(){ if(done[d]){ btn.textContent='Сделано ✓'; btn.classList.add('is-done'); } };
    show();
    btn.addEventListener('click', function(){
      if(!done[d]){ done[d]=Date.now(); set(done); goal('d30-den-'+d); }
      show();
    });
  }
  document.querySelectorAll('[data-goal]').forEach(function(a){
    a.addEventListener('click', function(){ goal(a.getAttribute('data-goal')); });
  });
})();
