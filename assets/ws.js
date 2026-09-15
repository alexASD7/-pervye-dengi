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

/* ---------- вычистка фона ----------
   Наивная заливка от краёв шагает по соседям, пока они похожи, и на гладкой
   фотографии проходит весь кадр насквозь: стена → стол → тень → сам товар.
   Каждый шаг маленький, а сумма — через всё изображение. Поэтому здесь три
   ограничителя: пиксель должен быть похож на соседа, НЕ должен далеко уйти
   от цвета того края, откуда пришла цепочка, и цепочка не перелезает через
   контур. Плюс подбор строгости по результату, а не вслепую.            */
WS.bgMask=function(src,opts){
  opts=opts||{};
  var maxSide=opts.maxSide||420;
  var k=Math.min(1,maxSide/Math.max(src.width,src.height));
  var sw=Math.max(40,Math.round(src.width*k)), sh=Math.max(40,Math.round(src.height*k));
  var sc=document.createElement("canvas"); sc.width=sw; sc.height=sh;
  var sx=sc.getContext("2d",{willReadFrequently:true});
  sx.drawImage(src,0,0,sw,sh);
  var d=sx.getImageData(0,0,sw,sh).data;
  var N=sw*sh;

  /* карта контуров: где яркость резко меняется */
  var lum=new Float32Array(N);
  for(var i=0;i<N;i++){ lum[i]=0.299*d[i*4]+0.587*d[i*4+1]+0.114*d[i*4+2]; }
  var edge=new Float32Array(N), sum=0;
  for(var y=1;y<sh-1;y++){
    for(var x=1;x<sw-1;x++){
      var p=y*sw+x;
      var gx=lum[p-1]-lum[p+1], gy=lum[p-sw]-lum[p+sw];
      var g=Math.sqrt(gx*gx+gy*gy);
      edge[p]=g; sum+=g;
    }
  }
  var edgeMax=clamp((sum/N)*3.2,10,70);

  function fill(localTol,globalTol){
    var bg=new Uint8Array(N), q=new Int32Array(N);
    var sr=new Uint8Array(N), sg=new Uint8Array(N), sb=new Uint8Array(N);
    var qh=0, qt=0;
    function seed(i){
      if(bg[i]) return;
      bg[i]=1; sr[i]=d[i*4]; sg[i]=d[i*4+1]; sb[i]=d[i*4+2]; q[qt++]=i;
    }
    for(var x=0;x<sw;x++){ seed(x); seed((sh-1)*sw+x); }
    for(var y=0;y<sh;y++){ seed(y*sw); seed(y*sw+sw-1); }
    var lt2=localTol*localTol*3, gt2=globalTol*globalTol*3;
    while(qh<qt){
      var i=q[qh++], ix=i*4, cx=i%sw, cy=(i/sw)|0;
      var nb=[ cx>0?i-1:-1, cx<sw-1?i+1:-1, cy>0?i-sw:-1, cy<sh-1?i+sw:-1 ];
      for(var t=0;t<4;t++){
        var j=nb[t]; if(j<0||bg[j]) continue;
        if(edge[j]>edgeMax) continue;
        var jx=j*4;
        var dr=d[ix]-d[jx], dg=d[ix+1]-d[jx+1], db=d[ix+2]-d[jx+2];
        if(dr*dr+dg*dg+db*db>=lt2) continue;
        var er=sr[i]-d[jx], eg=sg[i]-d[jx+1], eb=sb[i]-d[jx+2];
        if(er*er+eg*eg+eb*eb>=gt2) continue;
        bg[j]=1; sr[j]=sr[i]; sg[j]=sg[i]; sb[j]=sb[i]; q[qt++]=j;
      }
    }
    var removed=0;
    for(var m=0;m<N;m++){ if(bg[m]) removed++; }
    return { bg:bg, share:removed/N };
  }

  /* Строгость подбираем по результату: съело почти всё или не нашло ничего —
     пробуем следующую пару. Годным считаем 8–93% убранного. */
  var base=opts.tol||30;
  var ladder=[
    [base, base*2.0],
    [base*0.7, base*1.4],
    [base*0.5, base*1.0],
    [base*1.3, base*3.0]
  ];
  var best=null, chosen=null;
  for(var a=0;a<ladder.length;a++){
    var r=fill(ladder[a][0],ladder[a][1]);
    if(!best || Math.abs(r.share-0.5)<Math.abs(best.share-0.5)) best=r;
    if(r.share>=0.08 && r.share<=0.93){ chosen=r; break; }
  }
  var res=chosen||best;

  /* сглаживание: медиана 3×3 убирает крапины */
  var sm=new Uint8Array(N);
  for(var yy=0;yy<sh;yy++){
    for(var xx=0;xx<sw;xx++){
      var s=0,c=0;
      for(var oy=-1;oy<=1;oy++){ for(var ox=-1;ox<=1;ox++){
        var px=xx+ox, py=yy+oy;
        if(px<0||py<0||px>=sw||py>=sh) continue;
        s+=res.bg[py*sw+px]; c++;
      }}
      sm[yy*sw+xx]=(s*2>c)?1:0;
    }
  }

  /* Оставляем только сам предмет. Куски фона, до которых заливка не дошла
     (полоска стены за контуром, посторонняя тарелка в углу), остаются
     помеченными как товар — а это мусор в кадре. Считаем связные области
     и держим главную плюс те, что сравнимы с ней по размеру. */
  var lab=new Int32Array(N).fill(-1);
  var areas=[], stack=new Int32Array(N);
  for(var st=0;st<N;st++){
    if(sm[st] || lab[st]>=0) continue;
    var id=areas.length, top=0, area=0;
    stack[top++]=st; lab[st]=id;
    while(top>0){
      var cur=stack[--top]; area++;
      var ux=cur%sw, uy=(cur/sw)|0;
      var ns=[ ux>0?cur-1:-1, ux<sw-1?cur+1:-1, uy>0?cur-sw:-1, uy<sh-1?cur+sw:-1 ];
      for(var v=0;v<4;v++){
        var w2=ns[v];
        if(w2<0||sm[w2]||lab[w2]>=0) continue;
        lab[w2]=id; stack[top++]=w2;
      }
    }
    areas.push(area);
  }
  if(areas.length>1){
    var maxA=0;
    for(var ai=0;ai<areas.length;ai++){ if(areas[ai]>maxA) maxA=areas[ai]; }
    var keepMin=Math.max(maxA*0.12, N*0.004);
    for(var pi=0;pi<N;pi++){
      if(!sm[pi] && areas[lab[pi]]<keepMin) sm[pi]=1;
    }
  }

  var mc=document.createElement("canvas"); mc.width=sw; mc.height=sh;
  var mx=mc.getContext("2d");
  var mid=mx.createImageData(sw,sh);
  for(var z=0;z<N;z++){
    mid.data[z*4]=255; mid.data[z*4+1]=255; mid.data[z*4+2]=255;
    mid.data[z*4+3]=sm[z]?0:255;
  }
  mx.putImageData(mid,0,0);

  var full=document.createElement("canvas"); full.width=src.width; full.height=src.height;
  var fx=full.getContext("2d");
  fx.imageSmoothingEnabled=true; fx.imageSmoothingQuality="high";
  fx.drawImage(mc,0,0,src.width,src.height);
  return { mask:full, share:res.share, reliable:(res.share>=0.08 && res.share<=0.93) };
};
/* Накладывает маску на картинку и отдаёт вырезанное. */
WS.applyMask=function(src,mask){
  var c=document.createElement("canvas"); c.width=src.width; c.height=src.height;
  var x=c.getContext("2d");
  x.drawImage(src,0,0);
  x.imageSmoothingEnabled=true; x.imageSmoothingQuality="high";
  x.globalCompositeOperation="destination-in";
  x.drawImage(mask,0,0);
  x.globalCompositeOperation="source-over";
  return c;
};

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
