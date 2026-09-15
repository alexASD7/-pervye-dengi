/* Мастерская «Первые деньги» — общий слой для всех станков.
   Держим здесь всё, что одинаково: вход по коду, режим просмотра,
   тосты, помощники по канвасу, выгрузка, сохранение ответов. */
(function(){
"use strict";

var WS = {};
window.WS = WS;

/* ---------- мелочи ---------- */
function $(id){ return document.getElementById(id); }
function qs(s,r){ return (r||document).querySelector(s); }
function qsa(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function store(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function read(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
WS.$=$; WS.qs=qs; WS.qsa=qsa; WS.clamp=clamp; WS.store=store; WS.read=read;

/* ---------- тост ---------- */
var toastEl=null, toastT=null;
WS.toast=function(m){
  if(!toastEl){ toastEl=document.createElement("div"); toastEl.className="pd-toast"; document.body.appendChild(toastEl); }
  toastEl.textContent=m; toastEl.classList.add("show");
  clearTimeout(toastT);
  toastT=setTimeout(function(){ toastEl.classList.remove("show"); }, Math.min(7000,Math.max(1800,m.length*55)));
};
WS.busy=function(host,on,msg){
  var b=qs(".busy",host);
  if(on){ if(!b){ b=document.createElement("div"); b.className="busy"; host.appendChild(b);} b.textContent=msg||"считаю…"; }
  else if(b){ b.parentNode.removeChild(b); }
};

/* ---------- вход ---------- */
var KEY_AUTH="pd_auth";
WS.demo=false;
function verify(code, ok, bad){
  fetch("/pay/verify?code="+encodeURIComponent(code))
    .then(function(r){ return r.json(); })
    .then(function(d){ if(d && d.valid) ok(); else bad(); })
    .catch(bad);
}
/* opts: { onUnlock(demo) } — элементы гейта ожидаются с фиксированными id */
WS.gate=function(opts){
  function unlock(demo){
    WS.demo=!!demo;
    if($("gate")) $("gate").hidden=true;
    if($("app")) $("app").hidden=false;
    var chip=$("codeChip");
    if(chip){
      chip.hidden=false;
      chip.textContent = demo ? "режим просмотра" : (read(KEY_AUTH)||"");
    }
    qsa(".demo-only").forEach(function(el){ el.hidden=!demo; });
    qsa(".paid-only").forEach(function(el){ el.hidden=!!demo; });
    if(opts && opts.onUnlock) opts.onUnlock(!!demo);
  }
  WS.unlock=unlock;

  var btn=$("enterBtn");
  if(btn) btn.addEventListener("click",function(){
    var v=(($("code").value)||"").trim().toUpperCase();
    btn.disabled=true; if($("gateErr")) $("gateErr").textContent="";
    verify(v,function(){ btn.disabled=false; store(KEY_AUTH,v); unlock(false); },
             function(){ btn.disabled=false; if($("gateErr")) $("gateErr").textContent="Такой код не подходит. Проверь раскладку и дефис."; });
  });
  if($("code")) $("code").addEventListener("keydown",function(e){ if(e.key==="Enter") btn.click(); });
  if($("demoBtn")) $("demoBtn").addEventListener("click",function(){ unlock(true); });

  var params=new URLSearchParams(location.search);
  var urlCode=(params.get("code")||"").trim().toUpperCase();
  function trySaved(){
    var s=read(KEY_AUTH);
    if(s) verify(s,function(){ unlock(false); },function(){});
  }
  if(params.get("demo")==="1"){ unlock(true); return; }
  if(urlCode){ verify(urlCode,function(){ store(KEY_AUTH,urlCode); unlock(false); },trySaved); }
  else trySaved();
};

/* ---------- канвас ---------- */
WS.wrap=function(ctx,text,maxW){
  var words=String(text||"").split(/\s+/).filter(Boolean), lines=[], cur="";
  for(var i=0;i<words.length;i++){
    var t=cur?cur+" "+words[i]:words[i];
    if(ctx.measureText(t).width>maxW && cur){ lines.push(cur); cur=words[i]; }
    else cur=t;
  }
  if(cur) lines.push(cur);
  return lines;
};
/* Подбирает кегль так, чтобы текст уложился в maxLines строк. */
WS.fitLines=function(ctx,text,maxW,startPx,maxLines,minPx,fontTpl){
  var px=startPx, lines;
  for(;;){
    ctx.font=fontTpl.replace("{px}",px);
    lines=WS.wrap(ctx,text,maxW);
    if(lines.length<=maxLines || px<=minPx) break;
    px-=Math.max(1,Math.round(px*0.06));
  }
  return { px:px, lines:lines.slice(0,maxLines) };
};
WS.roundRect=function(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
};

/* ---------- склонение числительных ---------- */
/* forms: ['позиция','позиции','позиций'] */
WS.plural=function(n,forms){
  n=Math.abs(Math.round(n));
  var d100=n%100, d10=n%10;
  if(d100>=11 && d100<=14) return forms[2];
  if(d10===1) return forms[0];
  if(d10>=2 && d10<=4) return forms[1];
  return forms[2];
};
WS.count=function(n,forms){ return n+" "+WS.plural(n,forms); };

/* ---------- контраст по WCAG ---------- */
function toRgb(hex){
  hex=String(hex).replace("#","");
  if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
  return [parseInt(hex.substr(0,2),16),parseInt(hex.substr(2,2),16),parseInt(hex.substr(4,2),16)];
}
function lum(c){
  var a=c.map(function(v){ v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4); });
  return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2];
}
/* Отношение контраста: 1 — одинаковые, 21 — чёрное на белом. */
WS.contrast=function(a,b){
  var l1=lum(toRgb(a)), l2=lum(toRgb(b));
  var hi=Math.max(l1,l2), lo=Math.min(l1,l2);
  return (hi+0.05)/(lo+0.05);
};

/* ---------- выгрузка ---------- */
WS.dl=function(cv,name,quality){
  cv.toBlob(function(b){
    var u=URL.createObjectURL(b);
    var a=document.createElement("a"); a.href=u; a.download=name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(u); },2000);
  },"image/jpeg",quality||0.93);
};
/* В режиме просмотра станок работает целиком, но файлы не отдаются:
   превью на экране для работы не годится, там слишком мало точек. */
WS.guarded=function(make,name,quality){
  if(WS.demo){
    WS.toast("В режиме просмотра файлы не выгружаются. Станок открывается по коду доступа.");
    return false;
  }
  WS.dl(make(),name,quality);
  return true;
};

/* ---------- сохранение ответов ---------- */
WS.fields=function(ids,prefix){
  function save(id){ store(prefix+id,($(id)&&$(id).value)||""); }
  ids.forEach(function(id){
    var el=$(id);
    if(el) el.addEventListener("input",function(){ save(id); });
  });
  return {
    restore:function(){
      var any=false;
      ids.forEach(function(id){
        var v=read(prefix+id);
        if(v && $(id) && !$(id).value){ $(id).value=v; any=true; }
      });
      return any;
    },
    clear:function(){ ids.forEach(function(id){ store(prefix+id,""); if($(id)) $(id).value=""; }); }
  };
};

/* ---------- шаги ---------- */
WS.stepper=function(hostId,names,getState,onGo){
  function build(){
    var st=$(hostId); if(!st) return;
    st.innerHTML="";
    var s=getState();
    names.forEach(function(nm,i){
      var b=document.createElement("button");
      b.textContent=(i+1)+". "+nm;
      if(i===s.step) b.className="on";
      else if(i<=s.maxStep) b.className="ok";
      b.disabled=i>s.maxStep;
      b.addEventListener("click",function(){ onGo(i); });
      st.appendChild(b);
    });
  }
  return { build:build };
};

/* ---------- список проверок ---------- */
WS.renderCheck=function(hostId,rows){
  var ul=$(hostId); if(!ul) return 0;
  ul.innerHTML="";
  rows.forEach(function(r){
    var li=document.createElement("li");
    li.className=(r.s==="ok"?"ok":(r.s==="warn"?"warnrow":"no"));
    li.innerHTML='<span class="mk">'+(r.s==="ok"?"✓":(r.s==="warn"?"!":"×"))+'</span><span><b>'+
      String(r.t).replace(/</g,"&lt;")+'</b>'+(r.n?'<small>'+String(r.n).replace(/</g,"&lt;")+'</small>':'')+'</span>';
    ul.appendChild(li);
  });
  return rows.filter(function(r){ return r.s==="no"; }).length;
};

/* ---------- уход со страницы посреди работы ---------- */
WS.guardUnload=function(isBusy){
  window.addEventListener("beforeunload",function(e){
    if(isBusy()){ e.preventDefault(); e.returnValue=""; return ""; }
  });
};

})();
