(function(){
'use strict';
const TOPICS = window.TOPICS || [];
const AREAS = ['Ciberseguridad','Sistemas (ASIX)','Empresa','Desarrollo'];
const $ = (s, r=document) => r.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = (d=new Date()) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dayDiff = (a,b) => Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const rnd = a => a[Math.floor(Math.random()*a.length)];
const shuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}

/* ---------- index content ---------- */
const QS = [], LESSONS = [], KEYS = [];
const TMAP = {};
TOPICS.forEach(t => {
  TMAP[t.id] = t;
  t.lessons.forEach((l, i) => { l.id = t.id+':'+i; l.topic = t.id; l.idx = i; LESSONS.push(l);
    (l.body.match(/^> .+(\n> .*)*/gm)||[]).forEach(b => { const txt=b.replace(/^> ?/gm,'').trim(); if(txt.length>60 && txt.length<520) KEYS.push({topic:t.id, lesson:l.id, text:txt}); });
  });
  t.questions.forEach(q => { q.id = t.id+'-'+hash(q.q); q.topic = t.id; QS.push(q); });
});

/* ---------- state ---------- */
const KEY = 'aprende-pro-v1';
const DEF = {xp:0,streak:0,bestStreak:0,lastGoal:null,shields:0,goal:50,combo:0,bestCombo:0,days:{},q:{},read:{},ach:{},chal:{},filter:[],theme:'dark',exams:{},seen:0,total:{ans:0,ok:0},created:today()};
let S;
try { S = Object.assign({}, DEF, JSON.parse(localStorage.getItem(KEY)||'{}')); } catch(e){ S = Object.assign({}, DEF); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e){} };
const D = () => (S.days[today()] ||= {xp:0,ans:0,ok:0,les:0,maxc:0,cyber:0,exam:0});

/* ---------- levels ---------- */
const TITLES = [[1,'Novato curioso','🐣'],[3,'Becario de IT','🧑‍💻'],[6,'Técnico Helpdesk','🎧'],[10,'SysAdmin Junior','🖥️'],[14,'Analista SOC L1','🛰️'],[18,'Pentester Junior','🕵️'],[23,'SysAdmin Senior','🧠'],[28,'Analista SOC L2','🛡️'],[33,'Pentester','🗡️'],[40,'OSCP','🏴‍☠️'],[50,'Red Team Lead','🐉'],[65,'CISO','👑']];
const lvlNeed = l => 100 + (l-1)*40;
function levelInfo(xp){ let l=1, rest=xp; while(rest >= lvlNeed(l)){ rest -= lvlNeed(l); l++; } return {l, cur:rest, need:lvlNeed(l)}; }
const titleOf = l => { let t=TITLES[0]; TITLES.forEach(x => { if(l>=x[0]) t=x; }); return t; };

/* ---------- sound & fx ---------- */
let AC=null;
function beep(type){ if(S.sound===false) return; try{ AC ||= new (window.AudioContext||window.webkitAudioContext)(); const o=AC.createOscillator(), g=AC.createGain(); o.connect(g); g.connect(AC.destination);
  const seq = {ok:[[660,0],[880,.07]], bad:[[220,0],[180,.09]], lvl:[[523,0],[659,.1],[784,.2],[1046,.3]], chest:[[784,0],[988,.08],[1318,.16]]}[type]||[[600,0]];
  const t0=AC.currentTime; o.type='sine'; g.gain.setValueAtTime(.0001,t0); g.gain.exponentialRampToValueAtTime(.12,t0+.01);
  seq.forEach(([f,t]) => o.frequency.setValueAtTime(f,t0+t)); const end=t0+seq[seq.length-1][1]+.14; g.gain.exponentialRampToValueAtTime(.0001,end); o.start(t0); o.stop(end+.02);
  if(navigator.vibrate) navigator.vibrate(type==='bad'?[40,40,40]:20);
 }catch(e){} }
function confetti(n=120){ const c=document.createElement('canvas'); c.id='fx'; document.body.appendChild(c); const x=c.getContext('2d'); const W=c.width=innerWidth*devicePixelRatio, H=c.height=innerHeight*devicePixelRatio; c.style.width=innerWidth+'px'; c.style.height=innerHeight+'px';
  const cols=['#3ddc97','#5aa9ff','#ffc145','#ff8a3d','#b18cff','#ff5f6d']; const P=[...Array(n)].map(()=>({x:W/2,y:H*.45,vx:(Math.random()-.5)*W*.03,vy:-Math.random()*H*.03-H*.008,s:(4+Math.random()*6)*devicePixelRatio,c:rnd(cols),r:Math.random()*6,vr:(Math.random()-.5)*.3}));
  let f=0; (function loop(){ x.clearRect(0,0,W,H); P.forEach(p=>{p.vy+=H*.0009;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/3,p.s,p.s*.66);x.restore();}); if(++f<110) requestAnimationFrame(loop); else c.remove(); })(); }
function toast(msg){ document.querySelectorAll('.toast').forEach(t=>t.remove()); const t=document.createElement('div'); t.className='toast'; t.innerHTML=msg; document.body.appendChild(t); setTimeout(()=>t.remove(),2600); }
function floatText(txt){ const d=document.createElement('div'); d.className='combo'; d.textContent=txt; document.body.appendChild(d); setTimeout(()=>d.remove(),1000); }
function modal(em, title, text, btn='Seguir'){ const m=document.createElement('div'); m.className='modal'; m.innerHTML=`<div class="box"><div class="em">${em}</div><h2>${title}</h2><p class="sub">${text}</p><button class="primary" style="width:100%">${btn}</button></div>`; document.body.appendChild(m); m.querySelector('button').onclick=()=>m.remove(); }

/* ---------- xp, streak, goals ---------- */
function addXP(n, silent){ const before=levelInfo(S.xp).l; S.xp+=n; const d=D(); const wasGoal=d.xp>=S.goal; d.xp+=n;
  if(!wasGoal && d.xp>=S.goal) goalReached();
  const after=levelInfo(S.xp).l;
  if(after>before){ const t=titleOf(after); beep('lvl'); confetti(160); setTimeout(()=>modal(t[2],'¡Nivel '+after+'!', 'Ahora eres <b>'+t[1]+'</b>. Sigue así.'),300); }
  if(!silent) floatText('+'+n+' XP');
  save(); hud(); checkAch(); }
function goalReached(){ const t=today(); if(S.lastGoal===t) return;
  const gap = S.lastGoal ? dayDiff(S.lastGoal,t) : 99;
  if(gap===1) S.streak++; else if(gap>1 && S.shields>0 && gap<=1+S.shields){ S.shields-=(gap-1); S.streak++; toast('🛡️ Tu escudo ha salvado la racha'); } else S.streak=1;
  S.lastGoal=t; S.bestStreak=Math.max(S.bestStreak,S.streak);
  setTimeout(()=>{ confetti(90); toast('🔥 Objetivo diario cumplido · racha de '+S.streak+(S.streak===1?' día':' días')); },400); }
function streakAlive(){ if(!S.lastGoal) return 0; const g=dayDiff(S.lastGoal,today()); return (g<=1 || g<=1+S.shields) ? S.streak : 0; }

/* ---------- achievements ---------- */
const ACH = [
 ['first','🎯','Primer paso','Responde tu primera pregunta',()=>S.total.ans>=1],
 ['c5','⚡','En racha','Combo de 5 aciertos',()=>S.bestCombo>=5],
 ['c15','🌩️','Imparable','Combo de 15 aciertos',()=>S.bestCombo>=15],
 ['ok100','💯','Centenario','100 respuestas correctas',()=>S.total.ok>=100],
 ['ok500','🧨','Máquina','500 respuestas correctas',()=>S.total.ok>=500],
 ['ok1500','🛸','Leyenda','1500 respuestas correctas',()=>S.total.ok>=1500],
 ['read1','📖','Lector','Lee tu primera lección',()=>Object.keys(S.read).length>=1],
 ['read20','📚','Ratón de biblioteca','Lee 20 lecciones',()=>Object.keys(S.read).length>=20],
 ['readall','🏛️','Enciclopedia','Lee todas las lecciones',()=>Object.keys(S.read).length>=LESSONS.length],
 ['s3','🔥','Constante','Racha de 3 días',()=>S.bestStreak>=3],
 ['s7','🔥','Una semana entera','Racha de 7 días',()=>S.bestStreak>=7],
 ['s30','☄️','Hábito de hierro','Racha de 30 días',()=>S.bestStreak>=30],
 ['x1k','🪙','1.000 XP','Acumula 1.000 XP',()=>S.xp>=1000],
 ['x10k','💎','10.000 XP','Acumula 10.000 XP',()=>S.xp>=10000],
 ['exam','🎓','Examen perfecto','100% en un examen',()=>Object.values(S.exams).some(v=>v>=100)],
 ['star3','⭐','Tres estrellas','3 estrellas en un tema',()=>TOPICS.some(t=>stars(t.id)>=3)],
 ['web','🕸️','Cazador de bugs','3 estrellas en Auditoría web',()=>TMAP.web && stars('web')>=3],
 ['ad','🏰','Señor del dominio','3 estrellas en Seguridad de AD',()=>TMAP['ad-sec'] && stars('ad-sec')>=3],
 ['night','🦉','Búho','Estudia pasada la medianoche',()=>S._night],
 ['all','🌍','Todoterreno','Responde preguntas de todos los temas',()=>TOPICS.every(t=>t.questions.some(q=>S.q[q.id]))],
];
function checkAch(){ ACH.forEach(([id,em,t,d,fn]) => { if(!S.ach[id]){ let ok=false; try{ok=fn();}catch(e){} if(ok){ S.ach[id]=Date.now(); save(); setTimeout(()=>{ beep('chest'); toast(em+' Logro desbloqueado: <b>'+t+'</b>'); },700); } } }); }

/* ---------- daily challenges ---------- */
const CHAL_POOL = [
 {id:'ans20',em:'🧩',t:'Responde 20 preguntas',goal:20,val:d=>d.ans,rw:30},
 {id:'ans40',em:'🧠',t:'Responde 40 preguntas',goal:40,val:d=>d.ans,rw:60},
 {id:'ok15',em:'✅',t:'Acierta 15 preguntas',goal:15,val:d=>d.ok,rw:35},
 {id:'les1',em:'📖',t:'Lee 1 lección de teoría',goal:1,val:d=>d.les,rw:25},
 {id:'les3',em:'📚',t:'Lee 3 lecciones',goal:3,val:d=>d.les,rw:60},
 {id:'c5',em:'⚡',t:'Consigue un combo de 5',goal:5,val:d=>d.maxc,rw:30},
 {id:'c10',em:'🌩️',t:'Consigue un combo de 10',goal:10,val:d=>d.maxc,rw:60},
 {id:'cy10',em:'🛡️',t:'Acierta 10 de ciberseguridad',goal:10,val:d=>d.cyber,rw:40},
 {id:'ex1',em:'🎓',t:'Haz un examen de un tema',goal:1,val:d=>d.exam,rw:40},
];
function todaysChal(){ const t=today(); let seed=parseInt(hash(t),36); const pool=CHAL_POOL.slice(), out=[]; while(out.length<3){ seed=(seed*1103515245+12345)%2147483648; const c=pool.splice(seed%pool.length,1)[0]; if(!out.some(o=>o.id.slice(0,2)===c.id.slice(0,2))) out.push(c); } return out; }
function checkChal(){ const t=today(), d=D(); S.chal[t] ||= []; todaysChal().forEach(c => { if(!S.chal[t].includes(c.id) && c.val(d)>=c.goal){ S.chal[t].push(c.id); save(); setTimeout(()=>{ toast(c.em+' Reto completado: '+c.t+' · +'+c.rw+' XP'); addXP(c.rw,true); },900); } }); }

/* ---------- spaced repetition (Leitner) ---------- */
const BOX = [0, 1, 3, 7, 16, 35, 80]; // days
function grade(q, ok){ const st = S.q[q.id] || {b:0,d:0,c:0,w:0}; if(ok){ st.b=Math.min(st.b+1,BOX.length-1); st.c++; st.d=Date.now()+BOX[st.b]*864e5; } else { st.b=0; st.w++; st.d=Date.now()+4*60e3; } S.q[q.id]=st; }
function mastery(tid){ const qs=TMAP[tid].questions; if(!qs.length) return 0; let m=0; qs.forEach(q=>{ const s=S.q[q.id]; if(s) m+=Math.min(s.b,3)/3; }); return m/qs.length; }
function stars(tid){ const t=TMAP[tid]; const read=t.lessons.filter(l=>S.read[l.id]).length/Math.max(1,t.lessons.length); const ex=S.exams[tid]||0; let s=0; if(read>=.5 || mastery(tid)>=.3) s=1; if(read>=1 && (ex>=70 || mastery(tid)>=.6)) s=2; if(read>=1 && ex>=90 && mastery(tid)>=.6) s=3; return s; }
const starHTML = n => '<span class="stars">'+'★'.repeat(n)+'<span class="e">'+'★'.repeat(3-n)+'</span></span>';

let recent=[];
function pickQuestion(){ const pool = QS.filter(q => !S.filter.length || S.filter.includes(q.topic)); if(!pool.length) return null;
  const now=Date.now(); const due=pool.filter(q=>S.q[q.id] && S.q[q.id].d<=now && !recent.includes(q.id)).sort((a,b)=>S.q[a.id].d-S.q[b.id].d);
  const fresh=pool.filter(q=>!S.q[q.id] && !recent.includes(q.id));
  let q, rev=false;
  if(due.length && (Math.random()<.45 || !fresh.length)){ q=due[0]; rev=true; }
  else if(fresh.length){ q=rnd(fresh); }
  else { const rest=pool.filter(q=>!recent.includes(q.id)); q = rest.length ? rest.sort((a,b)=>(S.q[a.id]?.d||0)-(S.q[b.id]?.d||0))[0] : rnd(pool); rev=true; }
  recent.push(q.id); if(recent.length>Math.min(25,Math.floor(pool.length/2))) recent.shift();
  return {q, rev}; }

/* ---------- markdown ---------- */
function inline(s){ s=esc(s); const codes=[]; s=s.replace(/`([^`]+)`/g,(m,c)=>{codes.push(c);return '\u0000'+(codes.length-1)+'\u0000';});
  s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g,(m,i)=>'<code>'+codes[i]+'</code>'); }
function md(src){ const L=src.replace(/\r/g,'').split('\n'); let h='', i=0;
  while(i<L.length){ let ln=L[i];
    if(/^```/.test(ln)){ let code=[]; i++; while(i<L.length && !/^```/.test(L[i])) code.push(L[i++]); i++; h+='<pre><code>'+esc(code.join('\n'))+'</code></pre>'; continue; }
    if(/^### /.test(ln)){ h+='<h3>'+inline(ln.slice(4))+'</h3>'; i++; continue; }
    if(/^## /.test(ln)){ h+='<h2>'+inline(ln.slice(3))+'</h2>'; i++; continue; }
    if(/^---\s*$/.test(ln)){ h+='<hr>'; i++; continue; }
    if(/^> /.test(ln)||ln==='>'){ let b=[]; while(i<L.length && (/^> /.test(L[i])||L[i]==='>')) b.push(L[i++].replace(/^> ?/,'')); const raw=b.join('\n'); const cls=/^(\*\*)?(Ojo|Cuidado|Atención|Peligro|Legal)/i.test(raw)?' class="warn"':/^(\*\*)?(Truco|Consejo|Tip|En la vida real|En el examen)/i.test(raw)?' class="tip"':''; h+='<blockquote'+cls+'>'+md(raw)+'</blockquote>'; continue; }
    if(/^\|/.test(ln)){ let rows=[]; while(i<L.length && /^\|/.test(L[i])) rows.push(L[i++]); rows=rows.filter(r=>!/^\|[\s:|-]+\|?\s*$/.test(r)).map(r=>r.replace(/^\||\|\s*$/g,'').split('|').map(c=>c.trim()));
      h+='<div class="tblw"><table><thead><tr>'+rows[0].map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>'; continue; }
    if(/^\s*[-*] /.test(ln)){ let it=[]; while(i<L.length && /^\s*[-*] /.test(L[i])) it.push(L[i++].replace(/^\s*[-*] /,'')); h+='<ul>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>'; continue; }
    if(/^\d+\. /.test(ln)){ let it=[]; while(i<L.length && /^\d+\. /.test(L[i])) it.push(L[i++].replace(/^\d+\. /,'')); h+='<ol>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ol>'; continue; }
    if(!ln.trim()){ i++; continue; }
    let p=[]; while(i<L.length && L[i].trim() && !/^(```|#{2,3} |> |\||\s*[-*] |\d+\. |---\s*$)/.test(L[i])) p.push(L[i++]); h+='<p>'+inline(p.join(' '))+'</p>'; }
  return h; }

/* ---------- UI shell ---------- */
let tab='feed', view=null;
const main = () => $('main');
function hud(){ const li=levelInfo(S.xp), d=D(); const st=streakAlive();
  $('#hud').innerHTML = `<span class="pill fire" title="Racha">🔥 ${st}</span><span class="pill gold" title="Escudos de racha">🛡️ ${S.shields}</span><span class="sp"></span><span class="pill xp">⚡ ${S.xp.toLocaleString('es')} XP</span><span class="pill lvl">Nv ${li.l}</span>`;
  $('#lvlrow').innerHTML = `<span>Hoy ${Math.min(d.xp,S.goal)}/${S.goal}</span><div class="bar goal" style="max-width:110px"><i style="width:${Math.min(100,d.xp/S.goal*100)}%"></i></div><span style="margin-left:6px">${titleOf(li.l)[1]}</span><div class="bar"><i style="width:${li.cur/li.need*100}%"></i></div><span>${li.cur}/${li.need}</span>`; }
function go(t, v){ tab=t; view=v||null; document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('on', b.dataset.t===t)); render(); main().scrollTop=0; }
function render(){ ({feed:renderFeed, learn:renderLearn, chal:renderChal, me:renderMe})[tab](); }

/* ---------- FEED ---------- */
let card=null, sinceChest=0, sinceKey=0;
function chipsHTML(){ const on=S.filter; return `<div class="chips"><button class="chip ${!on.length?'on':''}" data-f="">Todo</button>${AREAS.map(a=>`<button class="chip ${on.length && TOPICS.filter(t=>t.area===a).every(t=>on.includes(t.id)) && on.length===TOPICS.filter(t=>t.area===a).length?'on':''}" data-a="${esc(a)}">${esc(a)}</button>`).join('')}${TOPICS.map(t=>`<button class="chip ${on.length===1&&on[0]===t.id?'on':''}" data-f="${t.id}">${t.icon} ${esc(t.short||t.title)}</button>`).join('')}</div>`; }
function renderFeed(){ if(!card) nextCard(true); const m=main(); m.innerHTML = chipsHTML()+'<div class="feed" id="feed"></div>';
  m.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{ if(b.dataset.a){ S.filter=TOPICS.filter(t=>t.area===b.dataset.a).map(t=>t.id); } else S.filter=b.dataset.f?[b.dataset.f]:[]; save(); recent=[]; card=null; renderFeed(); });
  const on=m.querySelector('.chip.on'); if(on) on.scrollIntoView({inline:'center',block:'nearest'});
  drawCard(); }
function nextCard(init){ sinceChest++; sinceKey++;
  if(!init && sinceChest>=12){ sinceChest=0; card={type:'chest'}; return; }
  const keys=KEYS.filter(k=>!S.filter.length||S.filter.includes(k.topic));
  if(!init && sinceKey>=6 && keys.length && Math.random()<.6){ sinceKey=0; card={type:'key', k:rnd(keys)}; return; }
  const p=pickQuestion(); if(!p){ card={type:'empty'}; return; }
  const order=shuffle(p.q.o.map((t,i)=>({t,ok:i===p.q.a})));
  card={type:'q', q:p.q, rev:p.rev, order, done:false}; }
function drawCard(anim){ const f=$('#feed'); if(!f) return; const T=card.type==='q'||card.type==='key'?TMAP[(card.q||card.k).topic]:null; let h='';
  if(card.type==='q'){ const q=card.q; const tf=q.o.length===2;
    h=`<div class="qcard" id="qc"><div class="qmeta"><span class="tag ${card.rev?'rev':''}">${T.icon} ${esc(T.short||T.title)}${card.rev?' · repaso':''}</span><span class="kind">${tf?'Verdadero o falso':'Pregunta'}</span></div>
    <p class="qtext">${inline(q.q)}</p><div class="opts">${card.order.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${i+1}</span><span>${inline(o.t)}</span></button>`).join('')}</div><div id="ex"></div><div id="nx" class="hint">Elige una respuesta · teclas 1-${card.order.length}</div></div>`; }
  else if(card.type==='key'){ const l=LESSONS.find(x=>x.id===card.k.lesson);
    h=`<div class="qcard keycard" id="qc"><div class="qmeta"><span class="tag key">${T.icon} Idea clave</span><span class="kind">${esc(T.short||T.title)}</span></div><div class="lesson big">${md(card.k.text)}</div><p class="sub">De la lección: <b>${esc(l.title)}</b></p>
    <div class="btnrow" style="margin-top:auto"><button class="ghost" id="rd">📖 Leer lección</button><button class="ghost" id="gotit">👍 Lo sabía (+3 XP)</button></div><button class="nextbtn" id="nb">Siguiente ↓</button></div>`; }
  else if(card.type==='chest'){ h=`<div class="qcard" id="qc"><div class="chest" id="ch"><span class="em">🎁</span><h2>¡Cofre sorpresa!</h2><p class="sub">Premio por tu constancia. ¿Qué habrá dentro?</p><button class="primary" id="op" style="min-width:200px">Abrir cofre</button></div></div>`; }
  else h=`<div class="empty">No hay preguntas para este filtro.</div>`;
  f.innerHTML=h; const qc=$('#qc'); if(!qc) return;
  if(card.type==='q'){ qc.querySelectorAll('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.i)); }
  if(card.type==='key'){ $('#rd').onclick=()=>{ go('learn',{lesson:card.k.lesson}); }; $('#gotit').onclick=e=>{ e.target.disabled=true; e.target.textContent='👍 +3 XP'; addXP(3); }; $('#nb').onclick=advance; }
  if(card.type==='chest'){ $('#op').onclick=openChest; }
  swipe(qc); }
function answer(i){ if(card.done) return; card.done=true; const o=card.order[i], q=card.q, ok=o.ok; const d=D();
  const h=new Date().getHours(); if(h<5) S._night=true;
  document.querySelectorAll('#qc .opt').forEach((b,j)=>{ if(card.order[j].ok) b.classList.add('ok'); else if(j===i) b.classList.add('bad'); else b.classList.add('fade'); });
  S.total.ans++; d.ans++; grade(q, ok);
  if(ok){ S.total.ok++; d.ok++; if(TMAP[q.topic].area==='Ciberseguridad') d.cyber++; S.combo++; S.bestCombo=Math.max(S.bestCombo,S.combo); d.maxc=Math.max(d.maxc,S.combo); beep('ok');
    const bonus = S.combo>=3 ? Math.min(10,(S.combo-2)*2) : 0; const crit = Math.random()<.06; const n=(10+bonus)*(crit?3:1);
    addXP(n,true); floatText(crit?'¡CRÍTICO! +'+n+' XP':(S.combo>=3?'COMBO x'+S.combo+' · +'+n:'+'+n+' XP')); if(S.combo>0 && S.combo%10===0) confetti(80); }
  else { if(S.combo>=5) toast('💥 Combo de '+S.combo+' roto'); S.combo=0; beep('bad'); save(); hud(); }
  $('#ex').innerHTML = `<div class="expl ${ok?'':'no'}"><b>${ok?'¡Correcto!':'No exactamente.'}</b> ${inline(q.e||'')}${ok?'':' <br><span style="color:var(--muted);font-size:13px">Esta pregunta volverá dentro de un rato para que la fijes.</span>'}</div>`;
  $('#nx').outerHTML = `<button class="nextbtn" id="nb">Siguiente ↓</button>`; $('#nb').onclick=advance; checkChal(); checkAch(); save(); }
function openChest(){ const r=Math.random(); let em,txt;
  if(r<.18){ S.shields=Math.min(S.shields+1,3); em='🛡️'; txt='¡Un <b>escudo de racha</b>! Si un día no llegas al objetivo, tu racha no se pierde.'; save(); hud(); }
  else { const n=rnd([15,20,25,30,40,50,75,100]); em=n>=75?'💎':n>=40?'🪙':'⚡'; txt='Has ganado <b>+'+n+' XP</b>'; addXP(n,true); }
  beep('chest'); confetti(140); $('#ch').classList.add('open'); $('#ch').innerHTML=`<span class="em">${em}</span><h2>¡Premio!</h2><p class="sub">${txt}</p><button class="nextbtn" id="nb">Seguir aprendiendo ↓</button>`; $('#nb').onclick=advance; }
function advance(){ const qc=$('#qc'); if(card.type==='q' && !card.done) return; S.seen++; nextCard(); if(qc){ qc.classList.add('out'); setTimeout(drawCard,200); } else drawCard(); main().scrollTop=0; }
function swipe(el){ let y0=null,t0=0; el.addEventListener('touchstart',e=>{y0=e.touches[0].clientY;t0=Date.now();},{passive:true}); el.addEventListener('touchend',e=>{ if(y0===null) return; const dy=e.changedTouches[0].clientY-y0; if(dy<-70 && Date.now()-t0<700 && main().scrollTop+main().clientHeight>=main().scrollHeight-4){ if(card.type!=='chest'||$('#ch.open')) advance(); } y0=null; },{passive:true}); }
document.addEventListener('keydown',e=>{ if(tab==='feed' && !view && card){ if(card.type==='q' && !card.done && /^[1-6]$/.test(e.key) && +e.key<=card.order.length){ answer(+e.key-1); } else if((e.key==='Enter'||e.key===' '||e.key==='ArrowDown') && document.activeElement.tagName!=='INPUT'){ e.preventDefault(); if(card.type==='chest' && !$('#ch.open')) openChest(); else advance(); } }
  if(tab==='learn' && exam && exam.cur && !exam.cur.done && /^[1-6]$/.test(e.key)) examAnswer(+e.key-1); });

/* ---------- LEARN ---------- */
function renderLearn(){ const m=main(); exam=null;
  if(view && view.lesson) return renderLesson(view.lesson);
  if(view && view.topic) return renderTopic(view.topic);
  if(view && view.exam) return renderExam(view.exam);
  const read=Object.keys(S.read).length;
  m.innerHTML = `<h1>Teoría</h1><p class="sub">${TOPICS.length} temas · ${LESSONS.length} lecciones · ${QS.length} preguntas · has leído ${read}</p><input class="search" id="sq" placeholder="Buscar en la teoría: XSS, VLAN, Kerberos, nmap…" autocomplete="off"><div id="res"></div>
  ${AREAS.map(a=>{ const ts=TOPICS.filter(t=>t.area===a); if(!ts.length) return ''; return `<div class="area"><h2>${esc(a)}</h2><div class="grid">${ts.map(t=>{ const r=t.lessons.filter(l=>S.read[l.id]).length; return `<button class="tcard" data-t="${t.id}"><span class="em">${t.icon}</span><span class="tt">${esc(t.title)}</span><div class="mini"><i style="width:${r/t.lessons.length*100}%"></i></div><span class="meta"><span>${r}/${t.lessons.length} lecciones</span>${starHTML(stars(t.id))}</span></button>`; }).join('')}</div></div>`; }).join('')}`;
  m.querySelectorAll('.tcard').forEach(b=>b.onclick=()=>go('learn',{topic:b.dataset.t}));
  const sq=$('#sq'); sq.oninput=()=>{ const v=sq.value.trim().toLowerCase(); const res=$('#res'); if(v.length<2){ res.innerHTML=''; return; }
    const hits=LESSONS.map(l=>{ const i=l.body.toLowerCase().indexOf(v); const it=l.title.toLowerCase().includes(v); return (i<0&&!it)?null:{l,i}; }).filter(Boolean).slice(0,30);
    res.innerHTML = hits.length ? '<h3>'+hits.length+' resultados</h3>'+hits.map(({l,i})=>{ const T=TMAP[l.topic]; let snip=''; if(i>=0){ const s=l.body.slice(Math.max(0,i-60),i+90).replace(/[#>*`|]/g,' '); snip=esc(s).replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),x=>'<span class="hl">'+x+'</span>'); }
      return `<button class="row" data-l="${l.id}"><span class="n">${T.icon}</span><span class="t">${esc(l.title)}<br><span class="r">${snip?'…'+snip+'…':esc(T.title)}</span></span></button>`; }).join('') : '<p class="sub">Sin resultados.</p>';
    res.querySelectorAll('.row').forEach(b=>b.onclick=()=>go('learn',{lesson:b.dataset.l})); }; }
function renderTopic(tid){ const t=TMAP[tid], m=main(); const r=t.lessons.filter(l=>S.read[l.id]).length;
  m.innerHTML = `<button class="back" id="bk">← Teoría</button><h1>${t.icon} ${esc(t.title)}</h1><p class="sub">${esc(t.desc||'')}</p>
  <div class="stats"><div class="stat"><div class="l">Lecciones leídas</div><div class="v">${r}/${t.lessons.length}</div></div><div class="stat"><div class="l">Dominio · mejor examen</div><div class="v">${Math.round(mastery(tid)*100)}% · ${S.exams[tid]!=null?S.exams[tid]+'%':'–'}</div></div></div>
  <div style="margin:4px 0 8px">${starHTML(stars(tid))} <span class="sub" style="font-size:12px">1★ empieza · 2★ todo leído + 70% · 3★ todo leído + examen ≥ 90%</span></div>
  <div class="btnrow"><button class="primary" id="pr">⚡ Practicar (${t.questions.length} preguntas)</button><button class="ghost" id="ex">🎓 Examen de 15</button></div>
  <h2>Lecciones</h2>${t.lessons.map((l,i)=>`<button class="row ${S.read[l.id]?'done':''}" data-l="${l.id}"><span class="n">${S.read[l.id]?'✓':i+1}</span><span class="t">${esc(l.title)}</span><span class="r">${Math.max(1,Math.round(l.body.split(/\s+/).length/200))} min</span></button>`).join('')}`;
  $('#bk').onclick=()=>go('learn'); $('#pr').onclick=()=>{ S.filter=[tid]; save(); card=null; recent=[]; go('feed'); }; $('#ex').onclick=()=>go('learn',{exam:tid});
  m.querySelectorAll('.row').forEach(b=>b.onclick=()=>go('learn',{lesson:b.dataset.l})); }
function renderLesson(lid){ const l=LESSONS.find(x=>x.id===lid), t=TMAP[l.topic], m=main(); const nxt=t.lessons[l.idx+1];
  m.innerHTML = `<button class="back" id="bk">← ${esc(t.title)}</button><div class="sub" style="margin:0">Lección ${l.idx+1} de ${t.lessons.length}</div><h1>${esc(l.title)}</h1><article class="lesson">${md(l.body)}</article>
  <div class="readfoot">${S.read[lid]?'<div class="sub" style="text-align:center">✓ Ya leída</div>':'<button class="primary" id="mk">✓ Marcar como leída (+20 XP)</button>'}
  ${nxt?`<button class="ghost" id="nx">Siguiente: ${esc(nxt.title)} →</button>`:`<button class="ghost" id="tx">🎓 Hacer el examen del tema</button>`}<button class="ghost" id="pq">⚡ Practicar preguntas de ${esc(t.short||t.title)}</button></div>`;
  $('#bk').onclick=()=>go('learn',{topic:t.id});
  const mk=$('#mk'); if(mk) mk.onclick=()=>{ S.read[lid]=Date.now(); D().les++; addXP(20); checkChal(); renderLesson(lid); };
  if(nxt) $('#nx').onclick=()=>{ if(!S.read[lid]){ S.read[lid]=Date.now(); D().les++; addXP(20,true); checkChal(); } go('learn',{lesson:nxt.id}); };
  else $('#tx').onclick=()=>go('learn',{exam:t.id});
  $('#pq').onclick=()=>{ S.filter=[t.id]; save(); card=null; recent=[]; go('feed'); }; }

/* ---------- EXAM ---------- */
let exam=null;
function renderExam(tid){ const t=TMAP[tid]; if(!exam || exam.tid!==tid){ exam={tid, qs:shuffle(t.questions).slice(0,15), i:0, ok:0, cur:null}; } examQ(); }
function examQ(){ const t=TMAP[exam.tid], m=main();
  if(exam.i>=exam.qs.length){ const pct=Math.round(exam.ok/exam.qs.length*100); const prev=S.exams[exam.tid]||0; S.exams[exam.tid]=Math.max(prev,pct); D().exam++; const xp=exam.ok*5+(pct===100?50:pct>=80?20:0); addXP(xp,true); checkChal(); checkAch(); save();
    if(pct>=80){ confetti(160); beep('lvl'); }
    m.innerHTML=`<div class="hero"><div class="av">${pct===100?'🏆':pct>=80?'🎉':pct>=50?'💪':'📚'}</div><div class="ti">${exam.ok}/${exam.qs.length} · ${pct}%</div><p class="sub">${pct===100?'Perfecto. Dominas este tema.':pct>=80?'Muy bien. Casi perfecto.':pct>=50?'Vas bien. Repasa la teoría y repite.':'Toca repasar la teoría de este tema.'}<br>+${xp} XP · mejor nota: ${S.exams[exam.tid]}%</p><div class="btnrow"><button class="primary" id="again">Repetir examen</button><button class="ghost" id="bt">Volver al tema</button></div></div>`;
    $('#again').onclick=()=>{ exam=null; renderExam(t.id); }; $('#bt').onclick=()=>go('learn',{topic:t.id}); exam=null; return; }
  const q=exam.qs[exam.i]; exam.cur={q, order:shuffle(q.o.map((x,i)=>({t:x,ok:i===q.a}))), done:false};
  m.innerHTML=`<button class="back" id="bk">← Salir del examen</button><div class="examhead"><span>${t.icon} ${esc(t.title)}</span><span>${exam.i+1}/${exam.qs.length} · ✓ ${exam.ok}</span></div><div class="bar" style="margin-bottom:14px"><i style="width:${exam.i/exam.qs.length*100}%"></i></div>
  <div class="qcard" id="qc" style="min-height:0"><p class="qtext">${inline(q.q)}</p><div class="opts">${exam.cur.order.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${i+1}</span><span>${inline(o.t)}</span></button>`).join('')}</div><div id="ex"></div></div>`;
  $('#bk').onclick=()=>{ exam=null; go('learn',{topic:t.id}); }; document.querySelectorAll('#qc .opt').forEach(b=>b.onclick=()=>examAnswer(+b.dataset.i)); }
function examAnswer(i){ const c=exam.cur; if(c.done) return; c.done=true; const ok=c.order[i].ok; if(ok){ exam.ok++; beep('ok'); } else beep('bad'); grade(c.q,ok); S.total.ans++; D().ans++; if(ok){ S.total.ok++; D().ok++; }
  document.querySelectorAll('#qc .opt').forEach((b,j)=>{ if(c.order[j].ok) b.classList.add('ok'); else if(j===i) b.classList.add('bad'); else b.classList.add('fade'); });
  $('#ex').innerHTML=`<div class="expl ${ok?'':'no'}"><b>${ok?'Correcto.':'Incorrecto.'}</b> ${inline(c.q.e||'')}</div><button class="nextbtn" id="nb">${exam.i+1<exam.qs.length?'Siguiente →':'Ver resultado'}</button>`; $('#nb').onclick=()=>{ exam.i++; examQ(); main().scrollTop=0; }; save(); hud(); }

/* ---------- CHALLENGES ---------- */
function renderChal(){ const d=D(), t=today(), done=S.chal[t]||[]; const m=main();
  const ach=ACH.filter(a=>S.ach[a[0]]).length;
  m.innerHTML=`<h1>Retos</h1><p class="sub">Se renuevan cada día. Completa los tres para ganar XP extra.</p>
  ${todaysChal().map(c=>{ const v=Math.min(c.val(d),c.goal), ok=done.includes(c.id); return `<div class="chal ${ok?'done':''}"><span class="em">${ok?'✅':c.em}</span><div class="b"><div class="t">${c.t}</div><div class="mini"><i style="width:${v/c.goal*100}%"></i></div></div><span class="rw">${ok?'Hecho':v+'/'+c.goal+' · +'+c.rw}</span></div>`; }).join('')}
  <h2>Objetivo diario</h2><div class="chal"><span class="em">🔥</span><div class="b"><div class="t">${Math.min(d.xp,S.goal)}/${S.goal} XP hoy · racha ${streakAlive()} ${streakAlive()===1?'día':'días'} (mejor: ${S.bestStreak})</div><div class="mini"><i style="width:${Math.min(100,d.xp/S.goal*100)}%;background:var(--fire)"></i></div></div></div>
  <p class="sub">Cada día que llegas al objetivo, la racha sube. Los 🛡️ escudos (salen en los cofres) te salvan la racha si fallas un día. Tienes ${S.shields}/3.</p>
  <h2>Logros · ${ach}/${ACH.length}</h2><div class="achs">${ACH.map(([id,em,tt,ds])=>`<div class="ach ${S.ach[id]?'on':''}"><span class="em">${em}</span><div><div class="t">${tt}</div><div class="d">${ds}</div></div></div>`).join('')}</div>`; }

/* ---------- PROFILE ---------- */
function renderMe(){ const li=levelInfo(S.xp), ti=titleOf(li.l), m=main(); const acc=S.total.ans?Math.round(S.total.ok/S.total.ans*100):0;
  const days=[...Array(7)].map((_,i)=>{ const dt=new Date(); dt.setDate(dt.getDate()-6+i); const k=today(dt); return {k, xp:(S.days[k]||{}).xp||0, l:'DLMXJVS'[dt.getDay()]}; }); const mx=Math.max(S.goal,...days.map(x=>x.xp));
  const nextT=TITLES.find(x=>x[0]>li.l);
  const mast=QS.filter(q=>S.q[q.id] && S.q[q.id].b>=3).length;
  m.innerHTML=`<div class="hero"><div class="av">${ti[2]}</div><div class="ti">${ti[1]}</div><p class="sub" style="margin:4px 0 10px">Nivel ${li.l} · ${S.xp.toLocaleString('es')} XP${nextT?' · siguiente rango: '+nextT[1]+' (nv '+nextT[0]+')':''}</p><div class="bar"><i style="width:${li.cur/li.need*100}%"></i></div></div>
  <div class="stats"><div class="stat"><div class="l">Racha actual</div><div class="v">🔥 ${streakAlive()}</div></div><div class="stat"><div class="l">Mejor racha</div><div class="v">${S.bestStreak}</div></div>
  <div class="stat"><div class="l">Respuestas</div><div class="v">${S.total.ans}</div></div><div class="stat"><div class="l">Acierto</div><div class="v">${acc}%</div></div>
  <div class="stat"><div class="l">Lecciones leídas</div><div class="v">${Object.keys(S.read).length}/${LESSONS.length}</div></div><div class="stat"><div class="l">Preguntas dominadas</div><div class="v">${mast}/${QS.length}</div></div>
  <div class="stat"><div class="l">Mejor combo</div><div class="v">⚡ ${S.bestCombo}</div></div><div class="stat"><div class="l">Tiempo de scroll recuperado</div><div class="v">${Math.round(S.total.ans*0.4+Object.keys(S.read).length*5)} min</div></div></div>
  <h2>Últimos 7 días</h2><div class="week">${days.map((x,i)=>`<div class="${i===6?'td':''}"><i style="height:${x.xp/mx*80}%"></i>${x.l}</div>`).join('')}</div>
  <h2>Ajustes</h2>
  <div class="set">Objetivo diario<select id="goal">${[30,50,100,150,250].map(v=>`<option ${v===S.goal?'selected':''} value="${v}">${v} XP</option>`).join('')}</select></div>
  <div class="set">Tema<select id="theme"><option value="dark" ${S.theme!=='light'?'selected':''}>Oscuro</option><option value="light" ${S.theme==='light'?'selected':''}>Claro</option></select></div>
  <div class="set">Sonido y vibración<select id="snd"><option value="1">Activado</option><option value="0" ${S.sound===false?'selected':''}>Desactivado</option></select></div>
  <h2>Pasar el progreso entre iPhone y Mac</h2><p class="sub">Copia el código en un dispositivo y pégalo en el otro. Se fusiona: nunca pierdes XP ni lecciones.</p>
  <div class="btnrow"><button class="ghost" id="exp">📤 Copiar mi código</button><button class="ghost" id="imp">📥 Pegar código</button></div><div id="sync"></div>
  <h2>Instalar como app</h2><p class="sub"><b>iPhone:</b> abre esta web en Safari → botón Compartir → «Añadir a pantalla de inicio».<br><b>Mac:</b> Safari → menú Archivo → «Añadir al Dock».<br>Funciona sin Internet una vez abierta.</p>
  <div class="btnrow"><button class="ghost sm" id="rst" style="color:var(--bad)">Borrar todo el progreso</button></div>`;
  $('#goal').onchange=e=>{ S.goal=+e.target.value; save(); hud(); }; $('#theme').onchange=e=>{ S.theme=e.target.value; save(); applyTheme(); }; $('#snd').onchange=e=>{ S.sound=e.target.value==='1'; save(); };
  $('#exp').onclick=async()=>{ const code='AP1.'+btoa(unescape(encodeURIComponent(JSON.stringify(S)))); try{ await navigator.clipboard.writeText(code); toast('📋 Código copiado. Pégalo en el otro dispositivo.'); }catch(e){} $('#sync').innerHTML='<textarea class="code" readonly>'+code+'</textarea>'; $('#sync textarea').select(); };
  $('#imp').onclick=()=>{ $('#sync').innerHTML='<textarea class="code" id="ic" placeholder="Pega aquí el código AP1…"></textarea><button class="primary" id="ia" style="width:100%">Importar y fusionar</button>'; $('#ia').onclick=()=>{ try{ const v=$('#ic').value.trim(); if(!v.startsWith('AP1.')) throw 0; merge(JSON.parse(decodeURIComponent(escape(atob(v.slice(4)))))); save(); hud(); toast('✅ Progreso fusionado'); renderMe(); }catch(e){ toast('Ese código no es válido'); } }; };
  $('#rst').onclick=()=>{ const b=$('#rst'); if(b.dataset.c){ localStorage.removeItem(KEY); location.reload(); } else { b.dataset.c=1; b.textContent='¿Seguro? Pulsa otra vez para borrar'; } }; }
function merge(o){ S.xp=Math.max(S.xp,o.xp||0); S.bestStreak=Math.max(S.bestStreak,o.bestStreak||0); S.bestCombo=Math.max(S.bestCombo,o.bestCombo||0); S.shields=Math.max(S.shields,o.shields||0);
  if(o.lastGoal && (!S.lastGoal || o.lastGoal>S.lastGoal)){ S.lastGoal=o.lastGoal; S.streak=o.streak; } else if(o.lastGoal===S.lastGoal) S.streak=Math.max(S.streak,o.streak||0);
  ['read','ach'].forEach(k=>Object.entries(o[k]||{}).forEach(([a,b])=>{ if(!S[k][a]) S[k][a]=b; }));
  Object.entries(o.q||{}).forEach(([a,b])=>{ const m=S.q[a]; if(!m || (b.c+b.w)>(m.c+m.w)) S.q[a]=b; });
  Object.entries(o.exams||{}).forEach(([a,b])=>S.exams[a]=Math.max(S.exams[a]||0,b));
  Object.entries(o.days||{}).forEach(([a,b])=>{ const m=S.days[a]; if(!m || b.xp>m.xp) S.days[a]=b; });
  Object.entries(o.chal||{}).forEach(([a,b])=>{ S.chal[a]=[...new Set([...(S.chal[a]||[]),...b])]; });
  S.total={ans:Math.max(S.total.ans,o.total?.ans||0), ok:Math.max(S.total.ok,o.total?.ok||0)}; }

/* ---------- boot ---------- */
function applyTheme(){ document.documentElement.classList.toggle('light', S.theme==='light'); const m=document.querySelector('meta[name=theme-color]'); if(m) m.content=S.theme==='light'?'#f4f6f9':'#0a0e13'; }
applyTheme();
document.querySelectorAll('nav.tabs button').forEach(b=>b.onclick=()=>{ if(b.dataset.t==='feed' && tab==='feed') return; go(b.dataset.t); });
hud(); render(); checkAch();
if(!S.welcomed){ S.welcomed=true; save(); setTimeout(()=>modal('🛡️','Bienvenido a BURSEC PROJECT','Cambia el scroll infinito por aprender de verdad.<br><br><b>Feed:</b> preguntas sin fin, como TikTok. Desliza hacia arriba o pulsa «Siguiente».<br><b>Teoría:</b> lecciones desde cero con ejemplos.<br><br>Gana XP, sube de nivel y no rompas la racha 🔥','¡Vamos!'),300); }
if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__APP = {S, TOPICS, QS, LESSONS};
})();
