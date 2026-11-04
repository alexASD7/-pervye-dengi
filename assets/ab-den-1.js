var K='ab7-d1-v2',HOUR='7:00',S={};
var PAGE='https://pervye-dengi.com/7-dney/den-1/';
try{S=JSON.parse(localStorage.getItem(K))||{}}catch(e){S={}}
if(!(S.f instanceof Array))S.f=[];
function $(i){return document.getElementById(i)}
// запись с главной (ключ ab-zapis-0) — первая из десяти; переносится один раз
(function(){var z='';try{z=(localStorage.getItem('ab-zapis-0')||'').trim()}catch(e){}
 if(!z||S.z0)return;S.z0=1;
 if(!(typeof S.r1_p==='string'&&S.r1_p.trim()))S.r1_p=z;
 else if(S.r1_p.trim()!==z&&!S.f.some(function(r){return r.p===z}))S.f.unshift({w:'',p:z,h:''});
 try{localStorage.setItem(K,JSON.stringify(S))}catch(e){}})();
function store(){try{localStorage.setItem(K,JSON.stringify(S));return true}catch(e){return false}}
function goal(n){try{if(typeof ym==='function')ym(111682005,'reachGoal',n)}catch(e){}}
function tx(v){return typeof v==='string'?v.trim():''}
function pl(n){var a=n%10,b=n%100;return n+' '+(a==1&&b!=11?'запись':(a>=2&&a<=4&&(b<12||b>14)?'записи':'записей'))}
function note(b,t){var s=b.parentNode.querySelector('.ok');if(s)s.textContent=t}
var WAYS=['справляется сам, с трудом','долгий обходной путь','зависит от другого или платит ему','терпит, ничего не делает'];
var WHO=['сосед, тренер, курьер','продавец, бухгалтер','мама, брат, водитель'];
var FREQ=['часто и у многих','часто, но у немногих','редко, но у многих','редко и у немногих'];
function rec(n){var p='r'+n+'_',h='<div class="card" style="margin-top:18px"><h3>Запись '+n+'</h3>'+
'<label class="f" for="'+p+'w">Кто (роль, без имени)</label><input type="text" id="'+p+'w" data-k="'+p+'w" placeholder="'+WHO[n-1]+'">'+
'<label class="f" for="'+p+'p">В чём проблема — что у него не получается сейчас</label><input type="text" id="'+p+'p" data-k="'+p+'p">'+
'<span class="fl">Как решает сейчас</span><div class="chips">';
WAYS.forEach(function(w){h+='<label><input type="radio" name="'+p+'h" data-k="'+p+'h" value="'+w+'"><span>'+w+'</span></label>'});
return h+'</div><label class="f" for="'+p+'c">Сколько это ему стоит — время, деньги, нервы (прикидкой)</label><input type="text" id="'+p+'c" data-k="'+p+'c">'+
'<div class="d3" style="margin-top:14px">Решение — день 3</div></div>'}
function pick(n){var p='e'+n+'_';return '<div class="pick"><h3>Проблема '+n+'</h3>'+
'<label class="f" for="'+p+'t">Какая запись</label><select id="'+p+'t" data-k="'+p+'t"></select>'+
'<label class="f" for="'+p+'r">Какой результат ему нужен</label><input type="text" id="'+p+'r" data-k="'+p+'r">'+
'<label class="f" for="'+p+'f">Как часто и у скольких (прикидкой)</label><select id="'+p+'f" data-k="'+p+'f"><option value="">—</option>'+FREQ.map(function(o){return '<option>'+o+'</option>'}).join('')+'</select>'+
'<label class="f" for="'+p+'m">Что у меня есть рядом: умение, вещь, знакомый</label><input type="text" id="'+p+'m" data-k="'+p+'m" placeholder="умею собирать мебель">'+
'<label class="f" for="'+p+'s">Откуда я это знаю</label><select id="'+p+'s" data-k="'+p+'s"><option value="">—</option><option>видел сам</option><option>со слов</option><option>предполагаю</option></select></div>'}
function list(){var L=[];[1,2,3].forEach(function(n){var p=tx(S['r'+n+'_p']),w=tx(S['r'+n+'_w']);if(p)L.push((w?w+' — ':'')+p)});
 S.f.forEach(function(r){L.push((r.w?r.w+' — ':'')+r.p)});return L}
function cnt(){return list().length}
function fillPicks(){var L=list();[1,2,3].forEach(function(n){var s=$('e'+n+'_t'),v=S['e'+n+'_t']||'',has=false;s.innerHTML='';
 s.appendChild(new Option('— выбери из своих записей —',''));
 L.forEach(function(t){s.appendChild(new Option(t,t));if(t===v)has=true});
 if(v&&!has)s.appendChild(new Option(v,v));s.value=v})}
function sumT(){var n=cnt(),L=['Архитектор будущего, день 1 «Где люди готовы платить за решение».'];
 L.push(S.done?'Сделано: '+pl(n)+' о проблемах людей вокруг, выбраны три самые сильные, записан прогноз. Завтра проверю его.':'Пока сделано: '+pl(n)+' о проблемах людей вокруг. Вечером выберу три и сделаю прогноз.');
 if(S.inc&&S.done)L.push('Мои три: 1) '+S.e1_t+'; 2) '+S.e2_t+'; 3) '+S.e3_t+'.');
 L.push('Вопрос для разговора: какая из моих записей удивила меня самого и кто, по-моему, уже платит за решение?');
 return L.join('\n')}
function render(){var n=cnt(),m=Math.max(10,n),h='',i;
 for(i=0;i<m;i++)h+='<i class="'+(i<n?'f':'')+(i==4?' z':'')+'"></i>';$('dots').innerHTML=h;
 $('cntt').textContent=n<5?pl(n)+' из 10. День будет пройден с пяти: осталось '+(5-n)+'.':(n<10?pl(n)+' из 10. День пройден, десять — полная планка.':pl(n)+'. Полная планка дня.');
 var ul=$('fl');ul.innerHTML='';
 S.f.forEach(function(r,j){var li=document.createElement('li');li.textContent=(r.w?r.w+' — ':'')+r.p+(r.h?' · сейчас: '+r.h:'');
  var x=document.createElement('button');x.type='button';x.className='x';x.textContent='×';x.setAttribute('aria-label','Удалить запись');
  x.onclick=function(){S.f.splice(j,1);store();render()};li.appendChild(x);ul.appendChild(li)});
 fillPicks();
 $('reg').hidden=!S.rs;$('zv').hidden=!S.done;$('soldb').hidden=!S.sold;
 $('m1').className=S.done?'end':'on';$('sumv').textContent=sumT()}
$('recs').innerHTML=rec(1)+rec(2)+rec(3);
$('picks').innerHTML=pick(1)+pick(2)+pick(3);
fillPicks();
var els=document.querySelectorAll('[data-k]');
Array.prototype.forEach.call(els,function(el){var k=el.getAttribute('data-k'),v=S[k];
 if(v!=null){if(el.type=='radio')el.checked=(v===el.value);else if(el.type=='checkbox')el.checked=!!v;else el.value=v}
 el.addEventListener(el.type=='radio'||el.type=='checkbox'||el.tagName=='SELECT'?'change':'input',function(){
  if(el.type=='radio'){if(el.checked)S[k]=el.value}else if(el.type=='checkbox')S[k]=el.checked;else S[k]=el.value;store();render()})});
Array.prototype.forEach.call(document.querySelectorAll('.hr'),function(e){e.textContent=HOUR});
if(tx(S.q0))$('q0ok').hidden=false;
if(S.z0)$('z0n').hidden=false;
render();
function startOnce(){if(!S.gs){S.gs=1;store();goal('d7-den-1-start')}}
function first(){var v=tx($('q0').value);if(!v){$('q0').focus();return}S.q0=v;store();$('q0ok').hidden=false;startOnce()}
$('q0').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();first()}});
function save(b){var n=0;[1,2,3].forEach(function(i){if(tx(S['r'+i+'_p']))n++});
 if(!n){note(b,'Заполни хотя бы одну запись: кто и в чём проблема');return}
 S.rs=1;var ok=store();startOnce();render();
 note(b,ok?'Сохранено: '+pl(n)+' на этом устройстве':'Браузер не дал сохранить: перепиши записи в заметки')}
function addF(){var w=tx($('fw').value),p=tx($('fp').value),h=tx($('fh').value);if(!p){$('fp').focus();return}
 S.f.push({w:w,p:p,h:h});$('fw').value=$('fp').value=$('fh').value='';store();render()}
function saveEvening(b){var n=cnt(),miss=[],t=[S.e1_t,S.e2_t,S.e3_t];
 if(n<5)miss.push('ещё '+pl(5-n)+' (сейчас '+n+')');
 t.forEach(function(v,i){if(!v)miss.push('проблема '+(i+1))});
 if(!tx(S.pr))miss.push('прогноз');
 if(miss.length){note(b,'Осталось: '+miss.join(', ')+'. Ничего не сгорает — можно дописать и завтра утром.');return}
 if(t[0]==t[1]||t[0]==t[2]||t[1]==t[2]){note(b,'Выбери три разные записи');return}
 S.done=new Date().toISOString();if(!S.gd){S.gd=1;goal('d7-den-1')}
 try{var D=JSON.parse(localStorage.getItem('d30-done'))||{};if(!D[1]){D[1]=Date.now();localStorage.setItem('d30-done',JSON.stringify(D))}}catch(e){}
 var ok=store();render();note(b,ok?'День 1 сохранён. До завтра.':'Браузер не дал сохранить: скачай папку файлом')}
function sent(){if(!S.gv){S.gv=1;store();goal('d7-den-1-vzroslyy')}}
function shareTG(a){a.href='https://t.me/share/url?url='+encodeURIComponent(PAGE)+'&text='+encodeURIComponent(sumT());sent()}
function copyT(b){var t=sumT();
 function ok(){note(b,'Текст скопирован — вставь в сообщение взрослому');sent()}
 function fb(){var ta=document.createElement('textarea'),r=false;ta.value=t;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();try{r=document.execCommand('copy')}catch(e){}document.body.removeChild(ta);
  if(r)ok();else note(b,'Не получилось скопировать — выдели текст выше вручную')}
 if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(t).then(ok,fb);else fb()}
function dl(){var g=function(k){return tx(S[k])||'—'},L=['Архитектор будущего · 7 дней · День 1 — папка','','Покупка семьи: '+g('q0'),''];
 list().forEach(function(t,i){L.push((i+1)+'. '+t)});
 L.push('','От взрослого (в десять не входят):');[1,2,3].forEach(function(n){L.push('  '+n+') '+g('a'+n))});
 L.push('');[1,2,3].forEach(function(n){var p='e'+n+'_';L.push('Отобранная '+n+': '+g(p+'t'),'  результат: '+g(p+'r'),'  как часто и у скольких: '+g(p+'f'),'  что у меня есть рядом: '+g(p+'m'),'  откуда знаю: '+g(p+'s'))});
 L.push('','Где всё держится на мне: '+g('mi'),'','Прогноз: '+g('pr'));if(S.sold)L.push('Первая продажа: '+g('sale'));
 var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([L.join('\n')],{type:'text/plain;charset=utf-8'}));a.download='den-1-papka.txt';document.body.appendChild(a);a.click();document.body.removeChild(a)}
