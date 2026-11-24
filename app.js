(function(){
'use strict';
const APP='ROOTSTREAK';
const TOPICS=window.TOPICS||[], ICONS=window.ICONS||{};
const AREAS=[
 {name:'Ciberseguridad',icon:'shield',cls:'t-cyber'},
 {name:'Sistemas (ASIX)',icon:'server',cls:'t-sys'},
 {name:'Empresa',icon:'briefcase',cls:'t-biz'},
 {name:'Desarrollo',icon:'code-xml',cls:'t-dev'}];
const AREA=Object.fromEntries(AREAS.map(a=>[a.name,a]));
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ic=(n,sz)=>`<svg class="i${sz?' s'+sz:''}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||ICONS['circle-help']||''}</svg>`;
const today=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const dayDiff=(a,b)=>Math.round((new Date(b+'T12:00')-new Date(a+'T12:00'))/864e5);
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0).toString(36);}
const tileCls=t=>(AREA[t.area]||AREAS[0]).cls;
function crest(cls='mark'){return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 C55 19 70 28 75 44 C80 60 74 80 60 89 C55 92 45 93 40 91 C25 86 19 70 23 55 C26 44 33 38 36 30 C38 37 41 41 46 43 C42 30 44 16 50 5 Z" fill="currentColor"/><path d="M39 55 L51 64.5 L39 74" fill="none" stroke="var(--markcut)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M55 74 H63" stroke="var(--markcut)" stroke-width="7.5" stroke-linecap="round"/></svg>`;}

/* ---------- content index ---------- */
const QS=[],LESSONS=[],KEYS=[],TMAP={};
TOPICS.forEach(t=>{TMAP[t.id]=t;
  t.lessons.forEach((l,i)=>{l.id=t.id+':'+i;l.topic=t.id;l.idx=i;l.min=Math.max(1,Math.round(l.body.split(/\s+/).length/200));LESSONS.push(l);
    (l.body.match(/^> .+(\n> .*)*/gm)||[]).forEach(b=>{const txt=b.replace(/^> ?/gm,'').trim();if(txt.length>60&&txt.length<520)KEYS.push({topic:t.id,lesson:l.id,text:txt});});});
  t.questions.forEach(q=>{q.id=t.id+'-'+hash(q.q);q.topic=t.id;QS.push(q);});});

/* ---------- state ---------- */
const KEY='aprende-pro-v1';
const DEF={xp:0,streak:0,bestStreak:0,lastGoal:null,shields:0,goal:50,combo:0,bestCombo:0,days:{},q:{},read:{},ach:{},chal:{},theme:'dark',layout:'auto',exams:{},total:{ans:0,ok:0},sound:true,lastLesson:null};
let S;try{S=Object.assign({},DEF,JSON.parse(localStorage.getItem(KEY)||'{}'));}catch(e){S=Object.assign({},DEF);}
if(!S._v3){S.theme='dark';S.layout=S.layout||'auto';}S._v3=1;
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}};
const D=()=>(S.days[today()]||={xp:0,ans:0,ok:0,les:0,maxc:0,cyber:0,exam:0});

/* ---------- levels ---------- */
const TITLES=[[1,'Novato'],[3,'Becario de IT'],[6,'Técnico Helpdesk'],[10,'SysAdmin Junior'],[14,'Analista SOC L1'],[18,'Pentester Junior'],[23,'SysAdmin Senior'],[28,'Analista SOC L2'],[33,'Pentester'],[40,'OSCP'],[50,'Red Team Lead'],[65,'CISO']];
const lvlNeed=l=>100+(l-1)*40;
function levelInfo(xp){let l=1,r=xp;while(r>=lvlNeed(l)){r-=lvlNeed(l);l++;}return{l,cur:r,need:lvlNeed(l)};}
const titleOf=l=>{let t=TITLES[0];TITLES.forEach(x=>{if(l>=x[0])t=x;});return t[1];};

/* ---------- feedback ---------- */
let AC=null;
function beep(type){if(!S.sound)return;try{AC||=new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
 const seq={ok:[[660,0],[880,.07]],bad:[[220,0],[180,.09]],lvl:[[523,0],[659,.1],[784,.2],[1046,.3]],chest:[[784,0],[988,.08],[1318,.16]]}[type]||[[600,0]];
 const t0=AC.currentTime;o.type='sine';g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.1,t0+.01);seq.forEach(([f,t])=>o.frequency.setValueAtTime(f,t0+t));const end=t0+seq[seq.length-1][1]+.14;g.gain.exponentialRampToValueAtTime(.0001,end);o.start(t0);o.stop(end+.02);
 if(navigator.vibrate)navigator.vibrate(type==='bad'?[30,40,30]:15);}catch(e){}}
function confetti(n=110){const c=document.createElement('canvas');c.id='fx';document.body.appendChild(c);const x=c.getContext('2d'),dpr=devicePixelRatio||1,W=c.width=innerWidth*dpr,H=c.height=innerHeight*dpr;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';
 const cols=['#ff7a1a','#ffb020','#34c38f','#7aa7ff','#f472b6','#ffffff'];const P=[...Array(n)].map(()=>({x:W/2,y:H*.4,vx:(Math.random()-.5)*W*.028,vy:-Math.random()*H*.028-H*.008,s:(4+Math.random()*5)*dpr,c:rnd(cols),r:Math.random()*6,vr:(Math.random()-.5)*.3}));
 let f=0;(function loop(){x.clearRect(0,0,W,H);P.forEach(p=>{p.vy+=H*.0009;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/3,p.s,p.s*.66);x.restore();});if(++f<100)requestAnimationFrame(loop);else c.remove();})();}
function toast(msg,icon='circle-check'){$$('.toast').forEach(t=>t.remove());const t=document.createElement('div');t.className='toast';t.innerHTML=ic(icon,18)+'<span>'+msg+'</span>';document.body.appendChild(t);setTimeout(()=>t.remove(),2600);}
function floatText(txt){const d=document.createElement('div');d.className='float';d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),900);}
function modal(icon,cls,title,text,btn='Continuar'){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="box">${icon==='crest'?crest('crest'):`<div class="tile xl ${cls}">${ic(icon,28)}</div>`}<h2>${title}</h2><p class="sub">${text}</p><button class="btn pri block lg">${btn}</button></div>`;document.body.appendChild(m);m.querySelector('button').onclick=()=>m.remove();}

/* ---------- xp / streak ---------- */
function addXP(n,silent){const before=levelInfo(S.xp).l;S.xp+=n;const d=D();const was=d.xp>=S.goal;d.xp+=n;if(!was&&d.xp>=S.goal)goalReached();
 const after=levelInfo(S.xp).l;if(after>before){beep('lvl');confetti(150);setTimeout(()=>modal('award','t-cyber','Nivel '+after,'Tu nuevo rango es <b>'+titleOf(after)+'</b>.'),300);}
 if(!silent)floatText('+'+n+' XP');save();chrome();checkAch();}
function goalReached(){const t=today();if(S.lastGoal===t)return;const gap=S.lastGoal?dayDiff(S.lastGoal,t):99;
 if(gap===1)S.streak++;else if(gap>1&&S.shields>0&&gap<=1+S.shields){S.shields-=(gap-1);S.streak++;setTimeout(()=>toast('Un escudo ha protegido tu racha','shield'),600);}else S.streak=1;
 S.lastGoal=t;S.bestStreak=Math.max(S.bestStreak,S.streak);setTimeout(()=>{confetti(80);toast('Objetivo diario cumplido · racha de '+S.streak+(S.streak===1?' día':' días'),'flame');},400);}
function streakNow(){if(!S.lastGoal)return 0;const g=dayDiff(S.lastGoal,today());return(g<=1||g<=1+S.shields)?S.streak:0;}

/* ---------- achievements ---------- */
const ACH=[
 ['first','target','Primer paso','Responde tu primera pregunta',()=>S.total.ans>=1],
 ['c5','zap','En racha','Combo de 5 aciertos',()=>S.bestCombo>=5],
 ['c15','sparkles','Imparable','Combo de 15 aciertos',()=>S.bestCombo>=15],
 ['ok100','circle-check','Centenario','100 respuestas correctas',()=>S.total.ok>=100],
 ['ok500','check-check','Máquina','500 respuestas correctas',()=>S.total.ok>=500],
 ['ok1500','rocket','Leyenda','1.500 respuestas correctas',()=>S.total.ok>=1500],
 ['read1','book-open','Lector','Completa tu primera lección',()=>Object.keys(S.read).length>=1],
 ['read20','library','Biblioteca','Completa 20 lecciones',()=>Object.keys(S.read).length>=20],
 ['readall','graduation-cap','Enciclopedia','Completa todas las lecciones',()=>Object.keys(S.read).length>=LESSONS.length],
 ['s3','flame','Constante','Racha de 3 días',()=>S.bestStreak>=3],
 ['s7','calendar-days','Una semana','Racha de 7 días',()=>S.bestStreak>=7],
 ['s30','crown','Hábito de hierro','Racha de 30 días',()=>S.bestStreak>=30],
 ['x1k','gem','1.000 XP','Acumula 1.000 XP',()=>S.xp>=1000],
 ['x10k','trophy','10.000 XP','Acumula 10.000 XP',()=>S.xp>=10000],
 ['exam','badge-check','Examen perfecto','100 % en un examen',()=>Object.values(S.exams).some(v=>v>=100)],
 ['star3','star','Tres estrellas','3 estrellas en un tema',()=>TOPICS.some(t=>stars(t.id)>=3)],
 ['web','globe','Cazador de bugs','3 estrellas en Auditoría web',()=>TMAP.web&&stars('web')>=3],
 ['ad','castle','Señor del dominio','3 estrellas en Seguridad AD',()=>TMAP['ad-sec']&&stars('ad-sec')>=3],
 ['night','moon-star','Búho','Estudia pasada la medianoche',()=>S._night],
 ['all','layers','Todoterreno','Responde preguntas de todos los temas',()=>TOPICS.every(t=>t.questions.some(q=>S.q[q.id]))]];
function checkAch(){ACH.forEach(([id,icn,t,d,fn])=>{if(!S.ach[id]){let ok=false;try{ok=fn();}catch(e){}if(ok){S.ach[id]=Date.now();save();setTimeout(()=>{beep('chest');toast('Logro desbloqueado: <b>'+t+'</b>','award');},700);}}});}

/* ---------- challenges ---------- */
const CHAL=[
 {id:'ans20',icon:'list-checks',t:'Responde 20 preguntas',goal:20,val:d=>d.ans,rw:30},
 {id:'ans40',icon:'list-checks',t:'Responde 40 preguntas',goal:40,val:d=>d.ans,rw:60},
 {id:'ok15',icon:'circle-check',t:'Acierta 15 preguntas',goal:15,val:d=>d.ok,rw:35},
 {id:'les1',icon:'book-open',t:'Completa 1 lección',goal:1,val:d=>d.les,rw:25},
 {id:'les3',icon:'library',t:'Completa 3 lecciones',goal:3,val:d=>d.les,rw:60},
 {id:'c5',icon:'zap',t:'Consigue un combo de 5',goal:5,val:d=>d.maxc,rw:30},
 {id:'c10',icon:'zap',t:'Consigue un combo de 10',goal:10,val:d=>d.maxc,rw:60},
 {id:'cy10',icon:'shield',t:'Acierta 10 de ciberseguridad',goal:10,val:d=>d.cyber,rw:40},
 {id:'ex1',icon:'graduation-cap',t:'Haz un examen',goal:1,val:d=>d.exam,rw:40}];
function todaysChal(){let seed=parseInt(hash(today()),36);const pool=CHAL.slice(),out=[];while(out.length<3&&pool.length){seed=(seed*1103515245+12345)%2147483648;const c=pool.splice(seed%pool.length,1)[0];if(!out.some(o=>o.id.slice(0,2)===c.id.slice(0,2)))out.push(c);}return out;}
function checkChal(){const t=today(),d=D();S.chal[t]||=[];todaysChal().forEach(c=>{if(!S.chal[t].includes(c.id)&&c.val(d)>=c.goal){S.chal[t].push(c.id);save();setTimeout(()=>{toast('Reto completado: '+c.t+' · +'+c.rw+' XP','trophy');addXP(c.rw,true);},900);}});}

/* ---------- spaced repetition ---------- */
const BOX=[0,1,3,7,16,35,80];
function grade(q,ok){const st=S.q[q.id]||{b:0,d:0,c:0,w:0};if(ok){st.b=Math.min(st.b+1,BOX.length-1);st.c++;st.d=Date.now()+BOX[st.b]*864e5;}else{st.b=0;st.w++;st.d=Date.now()+4*60e3;}S.q[q.id]=st;}
function mastery(tid){const qs=TMAP[tid].questions;if(!qs.length)return 0;let m=0;qs.forEach(q=>{const s=S.q[q.id];if(s)m+=Math.min(s.b,3)/3;});return m/qs.length;}
function readCount(tid){return TMAP[tid].lessons.filter(l=>S.read[l.id]).length;}
function stars(tid){const t=TMAP[tid];const read=readCount(tid)/Math.max(1,t.lessons.length);const ex=S.exams[tid]||0;let s=0;if(read>=.5||mastery(tid)>=.3)s=1;if(read>=1&&(ex>=70||mastery(tid)>=.6))s=2;if(read>=1&&ex>=90&&mastery(tid)>=.6)s=3;return s;}
const starHTML=n=>'<span class="stars">'+[0,1,2].map(i=>`<span class="${i<n?'':'off'}">${ic('star',14)}</span>`).join('')+'</span>';
const dueCount=(pool=QS)=>{const now=Date.now();return pool.filter(q=>S.q[q.id]&&S.q[q.id].d<=now).length;};

/* ---------- markdown ---------- */
function inline(s){s=esc(s);const codes=[];s=s.replace(/`([^`]+)`/g,(m,c)=>{codes.push(c);return'\u0000'+(codes.length-1)+'\u0000';});
 s=s.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g,'$1<em>$2</em>');return s.replace(/\u0000(\d+)\u0000/g,(m,i)=>'<code>'+codes[i]+'</code>');}
function md(src,toc){const L=src.replace(/\r/g,'').split('\n');let h='',i=0,hn=0;
 while(i<L.length){const ln=L[i];
  if(/^```/.test(ln)){const code=[];i++;while(i<L.length&&!/^```/.test(L[i]))code.push(L[i++]);i++;h+='<pre><code>'+esc(code.join('\n'))+'</code></pre>';continue;}
  if(/^### /.test(ln)){h+='<h3>'+inline(ln.slice(4))+'</h3>';i++;continue;}
  if(/^## /.test(ln)){const id='h'+(hn++);if(toc)toc.push({id,t:ln.slice(3)});h+='<h2 id="'+id+'">'+inline(ln.slice(3))+'</h2>';i++;continue;}
  if(/^---\s*$/.test(ln)){h+='<hr>';i++;continue;}
  if(/^> /.test(ln)||ln==='>'){const b=[];while(i<L.length&&(/^> /.test(L[i])||L[i]==='>'))b.push(L[i++].replace(/^> ?/,''));const raw=b.join('\n');const cls=/^(\*\*)?(Ojo|Cuidado|Atención|Peligro|Legal)/i.test(raw)?' class="warn"':/^(\*\*)?(Truco|Consejo|Tip|En la vida real|En el examen)/i.test(raw)?' class="tip"':'';h+='<blockquote'+cls+'>'+md(raw)+'</blockquote>';continue;}
  if(/^\|/.test(ln)){let rows=[];while(i<L.length&&/^\|/.test(L[i]))rows.push(L[i++]);rows=rows.filter(r=>!/^\|[\s:|-]+\|?\s*$/.test(r)).map(r=>r.replace(/^\||\|\s*$/g,'').split('|').map(c=>c.trim()));
   h+='<div class="tblw"><table><thead><tr>'+rows[0].map(c=>'<th>'+inline(c)+'</th>').join('')+'</tr></thead><tbody>'+rows.slice(1).map(r=>'<tr>'+r.map(c=>'<td>'+inline(c)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';continue;}
  if(/^\s*[-*] /.test(ln)){const it=[];while(i<L.length&&/^\s*[-*] /.test(L[i]))it.push(L[i++].replace(/^\s*[-*] /,''));h+='<ul>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ul>';continue;}
  if(/^\d+\. /.test(ln)){const it=[];while(i<L.length&&/^\s*\d+\. /.test(L[i]))it.push(L[i++].replace(/^\s*\d+\. /,''));h+='<ol>'+it.map(x=>'<li>'+inline(x)+'</li>').join('')+'</ol>';continue;}
  if(!ln.trim()){i++;continue;}
  const p=[];while(i<L.length&&L[i].trim()&&!/^(```|#{2,3} |> |\||\s*[-*] |\d+\. |---\s*$)/.test(L[i]))p.push(L[i++]);h+='<p>'+inline(p.join(' '))+'</p>';}
 return h;}

/* ---------- router ---------- */
let route={tab:'home'};
const NAV=[['home','house','Inicio'],['topics','library','Temas'],['practice','zap','Practicar'],['progress','chart-column','Progreso'],['settings','settings','Ajustes']];
function go(tab,extra={}){if(session&&tab!=='practice-run')session=null;route=Object.assign({tab},extra);render();$('.content').scrollTop=0;}
function chrome(){const li=levelInfo(S.xp);const st=streakNow();
 const mode=layoutMode();$('#tbstats').innerHTML=`<div class="dev" title="Vista: ordenador o móvil"><button data-lay="desk" class="${mode==='desk'?'on':''}" aria-label="Vista de ordenador">${ic('monitor',16)}</button><button data-lay="mob" class="${mode==='mob'?'on':''}" aria-label="Vista de móvil">${ic('smartphone',16)}</button></div><span class="chip fire" title="Racha">${ic('flame',16)} ${st}</span><span class="chip xp" title="XP">${ic('zap',16)} ${S.xp.toLocaleString('es')}</span>`;
 $$('[data-lay]').forEach(b=>b.onclick=()=>{S.layout=b.dataset.lay;save();applyLayout();toast(S.layout==='desk'?'Vista de ordenador':'Vista de móvil',S.layout==='desk'?'monitor':'smartphone');});
 const tab=route.tab==='practice-run'?'practice':route.tab;
 $$('[data-nav]').forEach(b=>b.classList.toggle('on',b.dataset.nav===tab));
 const d=D();$('#sidegoal').innerHTML=`<div class="card pad"><div class="row" style="justify-content:space-between"><span class="eyebrow mb0">Objetivo diario</span><span class="chip fire" style="height:26px">${ic('flame',14)} ${st}</span></div><div class="bar fire mt8"><i style="width:${Math.min(100,d.xp/S.goal*100)}%"></i></div><div class="sub mt8 mb0" style="font-size:13px">${Math.min(d.xp,S.goal)} / ${S.goal} XP · Nivel ${li.l}</div></div>`;}
function render(){chrome();const v={home:vHome,topics:vTopics,topic:vTopic,lesson:vLesson,exam:vExam,practice:vPractice,'practice-run':vRun,progress:vProgress,settings:vSettings}[route.tab]||vHome;v();}
const W=(html,narrow)=>{$('.content').innerHTML=`<div class="wrap${narrow?' narrow':''}">${html}</div>`;};

/* ---------- HOME ---------- */
function nextLesson(){if(S.lastLesson){const l=LESSONS.find(x=>x.id===S.lastLesson);if(l){const t=TMAP[l.topic];const n=t.lessons.find(x=>!S.read[x.id]);if(n)return n;}}return LESSONS.find(l=>!S.read[l.id])||LESSONS[0];}
function vHome(){const h=new Date().getHours();const greet=h<6?'Buenas noches':h<14?'Buenos días':h<21?'Buenas tardes':'Buenas noches';
 const d=D(),li=levelInfo(S.xp),st=streakNow(),nl=nextLesson(),nt=TMAP[nl.topic],due=dueCount();const pct=Math.min(100,Math.round(d.xp/S.goal*100));
 const done=S.chal[today()]||[];
 const recent=[...new Set([nl.topic,...LESSONS.filter(l=>S.read[l.id]).sort((a,b)=>S.read[b.id]-S.read[a.id]).map(l=>l.topic)])].slice(0,4);
 W(`<p class="eyebrow">${new Date().toLocaleDateString('es',{weekday:'long',day:'numeric',month:'long'})}</p><h1>${greet}</h1><p class="sub">${st?'Llevas '+st+(st===1?' día':' días')+' de racha. Sigue así.':'Completa tu objetivo diario para empezar una racha.'}</p>
 <div class="hero">
  <div class="card pad continue feature"><div class="top"><div class="tile ${tileCls(nt)}">${ic(nt.icon,22)}</div><div style="flex:1;min-width:0"><p class="eyebrow">Continuar · ${esc(nt.short||nt.title)}</p><h3 style="font-size:17px">${esc(nl.title)}</h3><p class="sub mb0" style="font-size:13px;margin-top:4px">Lección ${nl.idx+1} de ${nt.lessons.length} · ${nl.min} min de lectura</p></div></div>
   <div class="bar thin"><i style="width:${readCount(nt.id)/nt.lessons.length*100}%"></i></div>
   <div class="row"><button class="btn pri" id="cont">${ic('book-open',18)} ${S.read[nl.id]?'Repasar':'Empezar lección'}</button><button class="btn" id="ctopic">Ver tema</button></div></div>
  <div class="card pad goal"><div class="ring" style="--p:${pct}"><div>${pct}%</div></div><div><p class="eyebrow">Objetivo de hoy</p><div style="font-weight:700;font-size:18px">${Math.min(d.xp,S.goal)} / ${S.goal} XP</div><p class="sub mb0" style="font-size:13px">Nivel ${li.l} · ${titleOf(li.l)}</p></div></div>
 </div>
 <h2>Empieza a practicar</h2>
 <div class="grid g3">
  <button class="card qa" data-q="quick"><div class="tile t-cyber">${ic('zap',22)}</div><div class="b"><div class="t">Práctica rápida</div><div class="d">10 preguntas de todos los temas</div></div>${ic('chevron-right',18)}</button>
  <button class="card qa" data-q="review"><div class="tile t-fire">${ic('repeat',22)}</div><div class="b"><div class="t">Repaso pendiente</div><div class="d">${due?due+' preguntas para repasar':'Nada pendiente por ahora'}</div></div>${ic('chevron-right',18)}</button>
  <button class="card qa" data-q="exam"><div class="tile t-cyber">${ic('graduation-cap',22)}</div><div class="b"><div class="t">Examen</div><div class="d">15 preguntas de ${esc(nt.short||nt.title)}</div></div>${ic('chevron-right',18)}</button>
 </div>
 <div class="sechead"><h2>Retos de hoy</h2><button class="link" data-go="progress">Ver progreso ${ic('arrow-right',16)}</button></div>
 <div class="card">${todaysChal().map(c=>{const v=Math.min(c.val(d),c.goal),ok=done.includes(c.id);return `<div class="chal"><div class="tile ${ok?'t-ok':'t-slate'}">${ic(ok?'circle-check':c.icon,20)}</div><div class="b"><div class="t">${c.t}</div><div class="bar thin"><i style="width:${v/c.goal*100}%"></i></div></div><span class="rw">${ok?'Hecho':v+'/'+c.goal+' · +'+c.rw+' XP'}</span></div>`;}).join('')}</div>
 <div class="sechead"><h2>Tus temas</h2><button class="link" data-go="topics">Ver todos ${ic('arrow-right',16)}</button></div>
 <div class="card">${recent.map(id=>topicRow(TMAP[id])).join('')}</div>`);
 $('#cont').onclick=()=>go('lesson',{id:nl.id});$('#ctopic').onclick=()=>go('topic',{id:nt.id});
 $$('[data-q]').forEach(b=>b.onclick=()=>{const k=b.dataset.q;if(k==='quick')startSession({scope:'all',mode:'mix',len:10});else if(k==='review'){if(!due)return toast('No tienes preguntas pendientes de repaso','info');startSession({scope:'all',mode:'review',len:Math.min(20,due)});}else go('exam',{id:nt.id});});
 bindCommon();}
function topicRow(t){const r=readCount(t.id);return `<button class="trow" data-topic="${t.id}"><div class="tile ${tileCls(t)}">${ic(t.icon,20)}</div><div class="b"><div class="t">${esc(t.title)}</div><div class="m"><div class="bar thin"><i style="width:${r/t.lessons.length*100}%"></i></div><span>${r}/${t.lessons.length} lecciones</span>${starHTML(stars(t.id))}</div></div>${ic('chevron-right',18)}</button>`;}
function bindCommon(){$$('[data-topic]').forEach(b=>b.onclick=()=>go('topic',{id:b.dataset.topic}));$$('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));$$('[data-lesson]').forEach(b=>b.onclick=()=>go('lesson',{id:b.dataset.lesson}));}

/* ---------- TOPICS ---------- */
function vTopics(){const read=Object.keys(S.read).length;
 W(`<h1>Temas</h1><p class="sub">${TOPICS.length} temas · ${LESSONS.length} lecciones · ${QS.length} preguntas · ${read} lecciones completadas</p>
 <label class="search">${ic('search',18)}<input id="sq" placeholder="Buscar en la teoría: XSS, VLAN, Kerberos, Nmap…" autocomplete="off"></label><div id="res"></div>
 ${AREAS.map(a=>{const ts=TOPICS.filter(t=>t.area===a.name);if(!ts.length)return'';return `<div class="areahead"><div class="tile ${a.cls}" style="width:32px;height:32px;border-radius:8px">${ic(a.icon,18)}</div><h2>${a.name}</h2><span class="n">${ts.length} temas</span></div>
  <div class="grid g3">${ts.map(t=>{const r=readCount(t.id);return `<button class="card tcard" data-topic="${t.id}"><div class="row" style="justify-content:space-between"><div class="tile ${a.cls}">${ic(t.icon,22)}</div>${starHTML(stars(t.id))}</div><div><div class="t">${esc(t.title)}</div><div class="d">${esc(t.desc||'')}</div></div><div><div class="bar thin"><i style="width:${r/t.lessons.length*100}%"></i></div><div class="m mt8"><span>${r}/${t.lessons.length} lecciones</span><span>${t.questions.length} preguntas</span></div></div></button>`;}).join('')}</div>`;}).join('')}`);
 bindCommon();
 const sq=$('#sq');sq.oninput=()=>{const v=sq.value.trim().toLowerCase(),res=$('#res');if(v.length<2){res.innerHTML='';return;}
  const hits=LESSONS.map(l=>{const i=l.body.toLowerCase().indexOf(v);const it=l.title.toLowerCase().includes(v);return(i<0&&!it)?null:{l,i};}).filter(Boolean).slice(0,30);
  res.innerHTML=`<h2>${hits.length} resultados</h2>`+(hits.length?'<div class="card">'+hits.map(({l,i})=>{const T=TMAP[l.topic];let snip='';if(i>=0){const s=l.body.slice(Math.max(0,i-60),i+100).replace(/[#>*`|]/g,' ');snip=esc(s).replace(new RegExp(v.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'ig'),x=>'<span class="hl">'+x+'</span>');}
   return `<button class="trow" data-lesson="${l.id}"><div class="tile ${tileCls(T)}">${ic(T.icon,20)}</div><div class="b"><div class="t">${esc(l.title)}</div><div class="m" style="display:block">${snip?'…'+snip+'…':esc(T.title)}</div></div>${ic('chevron-right',18)}</button>`;}).join('')+'</div>':'<p class="sub">Sin resultados.</p>');bindCommon();};}

/* ---------- TOPIC ---------- */
function vTopic(){const t=TMAP[route.id];const r=readCount(t.id);const a=AREA[t.area]||AREAS[0];const due=dueCount(t.questions);
 W(`<div class="crumb"><button data-go="topics">Temas</button>${ic('chevron-right',14)}<span>${esc(t.area)}</span></div>
 <div class="thead"><div class="tile ${a.cls}">${ic(t.icon,28)}</div><div style="flex:1"><h1>${esc(t.title)}</h1><p class="sub mb0">${esc(t.desc||'')}</p></div></div>
 <div class="grid g4">
  <div class="card stat"><div class="l">${ic('book-open',14)} Lecciones</div><div class="v">${r}/${t.lessons.length}</div></div>
  <div class="card stat"><div class="l">${ic('target',14)} Dominio</div><div class="v">${Math.round(mastery(t.id)*100)}%</div></div>
  <div class="card stat"><div class="l">${ic('graduation-cap',14)} Mejor examen</div><div class="v">${S.exams[t.id]!=null?S.exams[t.id]+'%':'—'}</div></div>
  <div class="card stat"><div class="l">${ic('star',14)} Estrellas</div><div class="v">${starHTML(stars(t.id))}</div></div>
 </div>
 <div class="row mt16" style="flex-wrap:wrap"><button class="btn pri" id="prac">${ic('zap',18)} Practicar ${t.questions.length} preguntas</button>${due?`<button class="btn" id="rev">${ic('repeat',18)} Repasar ${due}</button>`:''}<button class="btn" id="exm">${ic('graduation-cap',18)} Examen de 15</button></div>
 <h2>Lecciones</h2>
 <div class="card">${t.lessons.map((l,i)=>`<button class="lrow ${S.read[l.id]?'done':''}" data-lesson="${l.id}"><span class="n">${S.read[l.id]?ic('check',16):i+1}</span><span class="t">${esc(l.title)}</span><span class="r">${ic('clock',14)} ${l.min} min</span></button>`).join('')}</div>
 <p class="sub mt16" style="font-size:13px">Estrellas: 1 al empezar · 2 con todas las lecciones y un 70 % · 3 con todas las lecciones y un examen de 90 % o más.</p>`);
 bindCommon();$('#prac').onclick=()=>startSession({scope:t.id,mode:'mix',len:10});$('#exm').onclick=()=>go('exam',{id:t.id});if($('#rev'))$('#rev').onclick=()=>startSession({scope:t.id,mode:'review',len:Math.min(20,due)});}

/* ---------- LESSON ---------- */
function vLesson(){const l=LESSONS.find(x=>x.id===route.id),t=TMAP[l.topic];const prev=t.lessons[l.idx-1],next=t.lessons[l.idx+1];S.lastLesson=l.id;save();const toc=[];const body=md(l.body,toc);
 W(`<div class="crumb"><button data-go="topics">Temas</button>${ic('chevron-right',14)}<button data-topic="${t.id}">${esc(t.title)}</button></div>
 <p class="eyebrow">Lección ${l.idx+1} de ${t.lessons.length} · ${l.min} min</p><h1>${esc(l.title)}</h1>
 ${toc.length>2?`<div class="card toc mt16"><p class="eyebrow">En esta lección</p>${toc.map((x,n)=>`<button data-toc="${x.id}"><span>${n+1}</span>${inline(x.t)}</button>`).join('')}</div>`:'<div style="height:14px"></div>'}
 <article class="lesson">${body}</article>
 <div class="card donebar">${S.read[l.id]?`<div class="tile t-ok">${ic('circle-check',22)}</div><div style="flex:1"><div style="font-weight:600">Lección completada</div><div class="sub mb0" style="font-size:13px">Pon a prueba lo aprendido con las preguntas del tema.</div></div><button class="btn" id="pq">${ic('zap',16)} Practicar</button>`:`<div class="tile t-slate">${ic('book-check',22)}</div><div style="flex:1"><div style="font-weight:600">¿Terminaste de leer?</div><div class="sub mb0" style="font-size:13px">Márcala como completada y gana 20 XP.</div></div><button class="btn pri" id="mk">${ic('check',16)} Completar</button>`}</div>
 <div class="lnav">${prev?`<button class="card" data-lesson="${prev.id}"><div class="l">${ic('arrow-left',14)} Anterior</div><div class="t">${esc(prev.title)}</div></button>`:'<div></div>'}${next?`<button class="card" id="nx" style="text-align:right"><div class="l">Siguiente ${ic('arrow-right',14)}</div><div class="t">${esc(next.title)}</div></button>`:`<button class="card" id="tx" style="text-align:right"><div class="l">Final del tema ${ic('arrow-right',14)}</div><div class="t">Hacer el examen</div></button>`}</div>`,true);
 bindCommon();$$('[data-toc]').forEach(b=>b.onclick=()=>{const e=document.getElementById(b.dataset.toc);if(e)$('.content').scrollTo({top:e.offsetTop-70,behavior:'smooth'});});
 const complete=()=>{if(!S.read[l.id]){S.read[l.id]=Date.now();D().les++;addXP(20,true);floatText('+20 XP');checkChal();}};
 if($('#mk'))$('#mk').onclick=()=>{complete();vLesson();};if($('#pq'))$('#pq').onclick=()=>startSession({scope:t.id,mode:'mix',len:10});
 if(next)$('#nx').onclick=()=>{complete();go('lesson',{id:next.id});};else $('#tx').onclick=()=>{complete();go('exam',{id:t.id});};}

/* ---------- PRACTICE SETUP ---------- */
let prefs={scope:'all',mode:'mix',len:10};
function vPractice(){const scopeQs=scopeQuestions(prefs.scope);const due=dueCount(scopeQs);const fresh=scopeQs.filter(q=>!S.q[q.id]).length;
 const scopes=[['all','Todo'],...AREAS.map(a=>['area:'+a.name,a.name])];
 W(`<h1>Practicar</h1><p class="sub">Elige qué quieres practicar y cómo. Las preguntas que falles volverán más adelante para que las fijes.</p>
 <div class="card pad"><p class="eyebrow">1 · Qué</p><div class="chips">${scopes.map(([k,n])=>`<button class="pill ${prefs.scope===k?'on':''}" data-scope="${k}">${esc(n)}</button>`).join('')}</div>
  <select class="sel mt16" id="tsel"><option value="">O elige un tema concreto…</option>${TOPICS.map(t=>`<option value="${t.id}" ${prefs.scope===t.id?'selected':''}>${esc(t.title)}</option>`).join('')}</select></div>
 <div class="card pad mt16"><p class="eyebrow">2 · Cómo</p><div class="grid g3">
  ${[['mix','shuffle','Mixto','Nuevas y repaso, con ideas clave entre medias'],['new','sparkles','Solo nuevas',fresh+' preguntas sin responder'],['review','repeat','Solo repaso',due?due+' pendientes de repasar':'Nada pendiente']].map(([k,i,t,d])=>`<button class="card optcard ${prefs.mode===k?'on':''}" data-mode="${k}"><div class="tile ${prefs.mode===k?'t-cyber':'t-slate'}">${ic(i,20)}</div><div class="b"><div class="t">${t}</div><div class="d">${d}</div></div></button>`).join('')}
 </div></div>
 <div class="card pad mt16"><p class="eyebrow">3 · Cuántas</p><div class="chips">${[[10,'10 preguntas'],[20,'20 preguntas'],[0,'Sin límite']].map(([n,t])=>`<button class="pill ${prefs.len===n?'on':''}" data-len="${n}">${t}</button>`).join('')}</div></div>
 <button class="btn pri lg block mt16" id="go">${ic('play',18)} Empezar</button>`);
 $$('[data-scope]').forEach(b=>b.onclick=()=>{prefs.scope=b.dataset.scope;vPractice();});$('#tsel').onchange=e=>{prefs.scope=e.target.value||'all';vPractice();};
 $$('[data-mode]').forEach(b=>b.onclick=()=>{prefs.mode=b.dataset.mode;vPractice();});$$('[data-len]').forEach(b=>b.onclick=()=>{prefs.len=+b.dataset.len;vPractice();});
 $('#go').onclick=()=>startSession(Object.assign({},prefs));}
function scopeQuestions(scope){if(scope==='all')return QS;if(scope.startsWith('area:')){const a=scope.slice(5);return QS.filter(q=>TMAP[q.topic].area===a);}return QS.filter(q=>q.topic===scope);}
function scopeName(scope){if(scope==='all')return'Todos los temas';if(scope.startsWith('area:'))return scope.slice(5);return TMAP[scope]?TMAP[scope].title:'';}

/* ---------- SESSION ---------- */
let session=null;
function startSession(o){const pool=scopeQuestions(o.scope);if(!pool.length)return toast('No hay preguntas en esta selección','info');
 if(o.mode==='review'&&!dueCount(pool))return toast('No hay preguntas pendientes de repaso aquí','info');
 if(o.mode==='new'&&!pool.some(q=>!S.q[q.id]))return toast('Ya has respondido todas las preguntas de aquí. Prueba el modo mixto.','info');
 session={...o,pool,n:0,ok:0,xp:0,card:null,recent:[],since:0,keys:KEYS.filter(k=>pool.some(q=>q.topic===k.topic))};prefs={scope:o.scope,mode:o.mode,len:o.len};
 route={tab:'practice-run'};nextCard();render();}
function pick(){const s=session,now=Date.now();const avail=s.pool.filter(q=>!s.recent.includes(q.id));const base=avail.length?avail:s.pool;
 const due=base.filter(q=>S.q[q.id]&&S.q[q.id].d<=now).sort((a,b)=>S.q[a.id].d-S.q[b.id].d);const fresh=base.filter(q=>!S.q[q.id]);
 let q;if(s.mode==='review')q=due[0];else if(s.mode==='new')q=rnd(fresh);else if(due.length&&(Math.random()<.45||!fresh.length))q=due[0];else if(fresh.length)q=rnd(fresh);else q=base.slice().sort((a,b)=>(S.q[a.id]?.d||0)-(S.q[b.id]?.d||0))[0];
 if(!q)return null;s.recent.push(q.id);if(s.recent.length>Math.min(25,Math.floor(s.pool.length/2)))s.recent.shift();return q;}
function nextCard(){const s=session;s.since++;
 if(s.len&&s.n>=s.len){s.card={type:'end'};return;}
 if(!s.len&&s.n>0&&s.n%12===0&&s.card&&s.card.type!=='chest'&&!s.chestAt?.[s.n]){(s.chestAt||={})[s.n]=1;s.card={type:'chest'};return;}
 if(s.mode==='mix'&&s.since>=6&&s.keys.length&&Math.random()<.6){s.since=0;s.card={type:'key',k:rnd(s.keys)};return;}
 const q=pick();if(!q){s.card={type:'end'};return;}
 s.card={type:'q',q,rev:!!S.q[q.id],order:shuffle(q.o.map((t,i)=>({t,ok:i===q.a}))),done:false};}
function vRun(){const s=session;if(!s)return go('practice');const c=s.card;const total=s.len||0;
 const head=`<div class="shead"><button class="btn sm ghost" id="quit" aria-label="Terminar">${ic('x',18)}</button><div class="bar"><i style="width:${total?Math.min(100,s.n/total*100):100}%"></i></div><span class="c">${total?Math.min(s.n+(c.type==='q'&&!c.done?1:0),total)+' / '+total:s.n+' respondidas'}</span><span class="chip">${ic('circle-check',14)} ${s.ok}</span></div>`;
 let body='';
 if(c.type==='q'){const T=TMAP[c.q.topic];body=`<div class="card qcard"><div class="qmeta"><span class="badge ${c.rev?'fire':'gold'}">${ic(c.rev?'repeat':T.icon,14)} ${esc(T.short||T.title)}${c.rev?' · repaso':''}</span><span class="badge">${c.q.o.length===2?'Verdadero o falso':'Pregunta'}</span></div>
  <p class="qtext">${inline(c.q.q)}</p><div class="opts">${c.order.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${i+1}</span><span>${inline(o.t)}</span></button>`).join('')}</div><div id="fb"></div></div>
  <div class="sfoot"><span class="kbd">${c.done?'Pulsa Intro para continuar':'Teclas 1–'+c.order.length+' para responder'}</span><button class="btn pri" id="nb" ${c.done?'':'disabled'}>Siguiente ${ic('arrow-right',16)}</button></div>`;}
 else if(c.type==='key'){const l=LESSONS.find(x=>x.id===c.k.lesson),T=TMAP[c.k.topic];body=`<div class="card keycard"><div class="qmeta"><span class="badge gold">${ic('lightbulb',14)} Idea clave</span><span class="badge">${esc(T.short||T.title)}</span></div><div class="lesson">${md(c.k.text)}</div><p class="sub mb0" style="font-size:13px">De la lección «${esc(l.title)}»</p></div>
  <div class="sfoot"><button class="btn" id="rd">${ic('book-open',16)} Leer la lección</button><button class="btn pri" id="nb">Siguiente ${ic('arrow-right',16)}</button></div>`;}
 else if(c.type==='chest'){body=`<div class="card summary" id="ch"><div class="tile xl t-fire">${ic('gift',30)}</div><h2 class="mt0">Cofre sorpresa</h2><p class="sub">Premio por tu constancia.</p><button class="btn pri lg" id="op">Abrir cofre</button></div>`;}
 else {const acc=s.n?Math.round(s.ok/s.n*100):0;body=`<div class="card summary"><div class="tile xl ${acc>=80?'t-cyber':acc>=50?'t-sys':'t-fire'}">${ic(acc>=80?'trophy':acc>=50?'target':'book-open',30)}</div><p class="eyebrow">Sesión terminada · ${esc(scopeName(s.scope))}</p><div class="big">${s.ok}/${s.n}</div><p class="sub">${acc}% de aciertos · +${s.xp} XP${acc<50?'<br>Repasa la teoría de estos temas y vuelve a intentarlo.':''}</p>
  <div class="row" style="justify-content:center;flex-wrap:wrap"><button class="btn pri" id="again">${ic('repeat',16)} Otra ronda</button><button class="btn" id="back">Volver</button></div></div>`;}
 W(`<div class="session">${head}${body}</div>`,true);
 $('#quit').onclick=()=>{if(s.n&&c.type!=='end'){s.card={type:'end'};vRun();}else go('practice');};
 if(c.type==='q')$$('.opt').forEach(b=>b.onclick=()=>answer(+b.dataset.i));
 if($('#nb'))$('#nb').onclick=advance;if($('#rd'))$('#rd').onclick=()=>go('lesson',{id:c.k.lesson});if($('#op'))$('#op').onclick=openChest;
 if($('#again'))$('#again').onclick=()=>startSession({scope:s.scope,mode:s.mode,len:s.len});if($('#back'))$('#back').onclick=()=>go('practice');
 if(c.type==='q'&&c.done)paintAnswer();}
function answer(i){const s=session,c=s.card;if(c.done)return;c.done=true;c.pick=i;const ok=c.order[i].ok,q=c.q,d=D();if(new Date().getHours()<5)S._night=true;
 S.total.ans++;d.ans++;s.n++;grade(q,ok);
 if(ok){S.total.ok++;d.ok++;s.ok++;if(TMAP[q.topic].area==='Ciberseguridad')d.cyber++;S.combo++;S.bestCombo=Math.max(S.bestCombo,S.combo);d.maxc=Math.max(d.maxc,S.combo);beep('ok');
  const bonus=S.combo>=3?Math.min(10,(S.combo-2)*2):0;const n=10+bonus;s.xp+=n;addXP(n,true);floatText(S.combo>=3?'Combo x'+S.combo+' · +'+n+' XP':'+'+n+' XP');if(S.combo%10===0)confetti(70);}
 else{if(S.combo>=5)toast('Combo de '+S.combo+' roto','zap');S.combo=0;beep('bad');save();chrome();}
 checkChal();checkAch();save();vRun();}
function paintAnswer(){const c=session.card;$$('.opt').forEach((b,j)=>{if(c.order[j].ok)b.classList.add('ok');else if(j===c.pick)b.classList.add('bad');else b.classList.add('fade');});const ok=c.order[c.pick].ok;
 $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}">${ic(ok?'circle-check':'circle-x',20)}<div><b>${ok?'Correcto.':'No es correcto.'}</b> <span class="x">${inline(c.q.e||'')}</span>${ok?'':'<br><span class="x" style="font-size:13px;opacity:.8">Volverá a salir dentro de un rato para que la fijes.</span>'}</div></div>`;}
function openChest(){const s=session;const r=Math.random();let txt,icn;if(r<.2){S.shields=Math.min(S.shields+1,3);icn='shield';txt='Has conseguido un <b>escudo de racha</b>: si un día no llegas al objetivo, tu racha no se pierde.';save();chrome();}else{const n=rnd([15,20,25,30,40,50,75]);icn='gem';txt='Has ganado <b>+'+n+' XP</b>.';s.xp+=n;addXP(n,true);}
 beep('chest');confetti(120);$('#ch').innerHTML=`<div class="tile xl t-cyber">${ic(icn,30)}</div><h2 class="mt0">¡Premio!</h2><p class="sub">${txt}</p><button class="btn pri lg" id="nb2">Seguir ${ic('arrow-right',16)}</button>`;$('#nb2').onclick=advance;}
function advance(){const s=session;if(!s)return;if(s.card.type==='q'&&!s.card.done)return;nextCard();vRun();$('.content').scrollTop=0;}
document.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
 if(route.tab==='practice-run'&&session){const c=session.card;if(c.type==='q'&&!c.done&&/^[1-6]$/.test(e.key)&&+e.key<=c.order.length)answer(+e.key-1);else if(e.key==='Enter'||e.key===' '||e.key==='ArrowRight'){e.preventDefault();if(c.type==='chest'&&$('#op'))openChest();else if(c.type!=='end')advance();}}
 if(route.tab==='exam'&&exam&&exam.cur){if(!exam.cur.done&&/^[1-6]$/.test(e.key))examAnswer(+e.key-1);else if(exam.cur.done&&(e.key==='Enter'||e.key===' ')){e.preventDefault();$('#enb')&&$('#enb').click();}}});
let ty=null;document.addEventListener('touchstart',e=>{ty=e.touches[0].clientY;},{passive:true});
document.addEventListener('touchend',e=>{if(ty===null||route.tab!=='practice-run'||!session)return;const dy=e.changedTouches[0].clientY-ty;ty=null;const ct=$('.content');if(dy<-80&&ct.scrollTop+ct.clientHeight>=ct.scrollHeight-4){const c=session.card;if((c.type==='q'&&c.done)||c.type==='key')advance();}},{passive:true});

/* ---------- EXAM ---------- */
let exam=null;
function vExam(){const t=TMAP[route.id];if(!exam||exam.tid!==t.id)exam={tid:t.id,qs:shuffle(t.questions).slice(0,15),i:0,ok:0,cur:null};
 if(exam.i>=exam.qs.length){const pct=Math.round(exam.ok/exam.qs.length*100);S.exams[t.id]=Math.max(S.exams[t.id]||0,pct);D().exam++;const xp=exam.ok*5+(pct===100?50:pct>=80?20:0);addXP(xp,true);checkChal();checkAch();save();if(pct>=80){confetti(150);beep('lvl');}
  W(`<div class="crumb"><button data-go="topics">Temas</button>${ic('chevron-right',14)}<button data-topic="${t.id}">${esc(t.title)}</button></div><div class="card summary"><div class="tile xl ${pct>=80?'t-cyber':pct>=50?'t-sys':'t-fire'}">${ic(pct>=80?'trophy':pct>=50?'target':'book-open',30)}</div><p class="eyebrow">Examen · ${esc(t.title)}</p><div class="big">${pct}%</div><p class="sub">${exam.ok} de ${exam.qs.length} correctas · +${xp} XP · mejor nota ${S.exams[t.id]}%<br>${pct===100?'Perfecto. Dominas este tema.':pct>=80?'Muy bien, casi perfecto.':pct>=50?'Vas bien. Repasa la teoría y repite.':'Toca repasar la teoría de este tema.'}</p><div class="row" style="justify-content:center"><button class="btn pri" id="again">${ic('repeat',16)} Repetir</button><button class="btn" data-topic="${t.id}">Volver al tema</button></div></div>`,true);
  bindCommon();$('#again').onclick=()=>{exam=null;vExam();};exam=null;return;}
 const q=exam.qs[exam.i];if(!exam.cur||exam.cur.q!==q)exam.cur={q,order:shuffle(q.o.map((x,i)=>({t:x,ok:i===q.a}))),done:false};const c=exam.cur;
 W(`<div class="session"><div class="shead"><button class="btn sm ghost" data-topic="${t.id}" aria-label="Salir">${ic('x',18)}</button><div class="bar"><i style="width:${exam.i/exam.qs.length*100}%"></i></div><span class="c">${exam.i+1} / ${exam.qs.length}</span><span class="chip">${ic('circle-check',14)} ${exam.ok}</span></div>
  <div class="card qcard"><div class="qmeta"><span class="badge gold">${ic('graduation-cap',14)} Examen · ${esc(t.short||t.title)}</span></div><p class="qtext">${inline(q.q)}</p><div class="opts">${c.order.map((o,i)=>`<button class="opt" data-i="${i}"><span class="k">${i+1}</span><span>${inline(o.t)}</span></button>`).join('')}</div><div id="fb"></div></div>
  <div class="sfoot"><span class="kbd">Teclas 1–${c.order.length}</span><button class="btn pri" id="enb" ${c.done?'':'disabled'}>${exam.i+1<exam.qs.length?'Siguiente':'Ver resultado'} ${ic('arrow-right',16)}</button></div></div>`,true);
 bindCommon();$$('.opt').forEach(b=>b.onclick=()=>examAnswer(+b.dataset.i));$('#enb').onclick=()=>{if(!exam.cur.done)return;exam.i++;vExam();$('.content').scrollTop=0;};}
function examAnswer(i){const c=exam.cur;if(c.done)return;c.done=true;const ok=c.order[i].ok;if(ok){exam.ok++;beep('ok');}else beep('bad');grade(c.q,ok);S.total.ans++;D().ans++;if(ok){S.total.ok++;D().ok++;}save();
 $$('.opt').forEach((b,j)=>{if(c.order[j].ok)b.classList.add('ok');else if(j===i)b.classList.add('bad');else b.classList.add('fade');});
 $('#fb').innerHTML=`<div class="fb ${ok?'ok':'no'}">${ic(ok?'circle-check':'circle-x',20)}<div><b>${ok?'Correcto.':'Incorrecto.'}</b> <span class="x">${inline(c.q.e||'')}</span></div></div>`;$('#enb').disabled=false;chrome();}

/* ---------- PROGRESS ---------- */
function vProgress(){const li=levelInfo(S.xp),d=D(),done=S.chal[today()]||[];const acc=S.total.ans?Math.round(S.total.ok/S.total.ans*100):0;
 const days=[...Array(7)].map((_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-6+i);const k=today(dt);return{xp:(S.days[k]||{}).xp||0,l:dt.toLocaleDateString('es',{weekday:'short'}).slice(0,3)};});const mx=Math.max(S.goal,...days.map(x=>x.xp));
 const next=TITLES.find(x=>x[0]>li.l);const mast=QS.filter(q=>S.q[q.id]&&S.q[q.id].b>=3).length;const nAch=ACH.filter(a=>S.ach[a[0]]).length;
 W(`<h1>Progreso</h1><p class="sub">Tu nivel, tus estadísticas, los retos del día y los logros.</p>
 <div class="card lvl"><div class="tile t-cyber">${ic('award',28)}</div><div style="flex:1"><p class="eyebrow">Nivel ${li.l}</p><div class="name">${titleOf(li.l)}</div><div class="bar mt8"><i style="width:${li.cur/li.need*100}%"></i></div><div class="sub mb0 mt8" style="font-size:13px">${li.cur} / ${li.need} XP para el nivel ${li.l+1}${next?' · siguiente rango: '+next[1]+' (nivel '+next[0]+')':''}</div></div></div>
 <div class="grid g4 mt16">
  ${[['flame','Racha actual',streakNow()],['calendar-days','Mejor racha',S.bestStreak],['zap','XP total',S.xp.toLocaleString('es')],['list-checks','Respuestas',S.total.ans],['target','Acierto',acc+'%'],['book-check','Lecciones',Object.keys(S.read).length+'/'+LESSONS.length],['brain','Dominadas',mast+'/'+QS.length],['shield','Escudos de racha',S.shields+'/3']].map(([i,l,v])=>`<div class="card stat"><div class="l">${ic(i,14)} ${l}</div><div class="v">${v}</div></div>`).join('')}
 </div>
 <h2>Últimos 7 días</h2><div class="card week">${days.map((x,i)=>`<div class="${i===6?'td':''}"><span class="v">${x.xp||''}</span><i style="height:${x.xp/mx*85}%"></i>${x.l}</div>`).join('')}</div>
 <h2>Retos de hoy</h2><div class="card">${todaysChal().map(c=>{const v=Math.min(c.val(d),c.goal),ok=done.includes(c.id);return `<div class="chal"><div class="tile ${ok?'t-ok':'t-slate'}">${ic(ok?'circle-check':c.icon,20)}</div><div class="b"><div class="t">${c.t}</div><div class="bar thin"><i style="width:${v/c.goal*100}%"></i></div></div><span class="rw">${ok?'Hecho':v+'/'+c.goal+' · +'+c.rw+' XP'}</span></div>`;}).join('')}</div>
 <p class="sub mt8" style="font-size:13px">Los retos cambian cada día. Los escudos de racha salen en los cofres de las sesiones sin límite y protegen tu racha si un día fallas.</p>
 <h2>Logros · ${nAch}/${ACH.length}</h2><div class="grid g3">${ACH.map(([id,i,t,ds])=>`<div class="card ach ${S.ach[id]?'':'off'}"><div class="tile t-cyber">${ic(i,20)}</div><div><div class="t">${t}</div><div class="d">${ds}</div></div></div>`).join('')}</div>`);}

/* ---------- SETTINGS ---------- */
function vSettings(){W(`<h1>Ajustes</h1><p class="sub">Personaliza ${APP} y pasa tu progreso entre dispositivos.</p>
 <div class="card">
  <div class="set"><div><div class="t">Objetivo diario</div><div class="d">XP que quieres ganar cada día para mantener la racha</div></div><select id="goal">${[30,50,100,150,250].map(v=>`<option ${v===S.goal?'selected':''} value="${v}">${v} XP</option>`).join('')}</select></div>
  <div class="set"><div><div class="t">Vista</div><div class="d">Automática según la pantalla, o fija de ordenador o de móvil</div></div><select id="lay"><option value="auto" ${S.layout==='auto'?'selected':''}>Automática</option><option value="desk" ${S.layout==='desk'?'selected':''}>Ordenador</option><option value="mob" ${S.layout==='mob'?'selected':''}>Móvil</option></select></div>
  <div class="set"><div><div class="t">Apariencia</div><div class="d">Oscuro, claro o la del sistema</div></div><select id="theme"><option value="dark" ${S.theme==='dark'?'selected':''}>Oscuro</option><option value="light" ${S.theme==='light'?'selected':''}>Claro</option><option value="system" ${S.theme==='system'?'selected':''}>Sistema</option></select></div>
  <div class="set"><div><div class="t">Sonido y vibración</div><div class="d">Al acertar, fallar y subir de nivel</div></div><select id="snd"><option value="1">Activado</option><option value="0" ${S.sound?'':'selected'}>Desactivado</option></select></div>
 </div>
 <h2>Sincronizar iPhone y Mac</h2><div class="card pad"><p class="sub">Copia tu código en un dispositivo y pégalo en el otro. El progreso se fusiona: nunca pierdes XP ni lecciones.</p><div class="row" style="flex-wrap:wrap"><button class="btn" id="exp">${ic('copy',16)} Copiar mi código</button><button class="btn" id="imp">${ic('clipboard-paste',16)} Pegar un código</button></div><div id="sync"></div></div>
 <h2>Instalar como app</h2><div class="grid g2">
  <div class="card pad"><div class="row"><div class="tile t-slate">${ic('smartphone',20)}</div><h3>iPhone</h3></div><p class="sub mt8 mb0">Abre esta web en <b>Safari</b> → botón Compartir → «Añadir a pantalla de inicio».</p></div>
  <div class="card pad"><div class="row"><div class="tile t-slate">${ic('laptop',20)}</div><h3>Mac</h3></div><p class="sub mt8 mb0">En <b>Safari</b>: menú Archivo → «Añadir al Dock». Funciona sin conexión.</p></div></div>
 <h2>Zona de peligro</h2><div class="card set"><div><div class="t">Borrar todo el progreso</div><div class="d">No se puede deshacer</div></div><button class="btn danger" id="rst">${ic('trash-2',16)} Borrar</button></div>
 <p class="sub mt16" style="font-size:12px;text-align:center">${APP} · contenido para aprender ciberseguridad, sistemas y empresa · iconos Lucide (ISC)</p>`,true);
 $('#goal').onchange=e=>{S.goal=+e.target.value;save();chrome();};$('#lay').onchange=e=>{S.layout=e.target.value;save();applyLayout();};$('#theme').onchange=e=>{S.theme=e.target.value;save();applyTheme();};$('#snd').onchange=e=>{S.sound=e.target.value==='1';save();};
 $('#exp').onclick=async()=>{const code='AP1.'+btoa(unescape(encodeURIComponent(JSON.stringify(S))));try{await navigator.clipboard.writeText(code);toast('Código copiado. Pégalo en el otro dispositivo.','copy');}catch(e){}$('#sync').innerHTML='<textarea class="code" readonly>'+code+'</textarea>';$('#sync textarea').select();};
 $('#imp').onclick=()=>{$('#sync').innerHTML='<textarea class="code" id="ic" placeholder="Pega aquí el código AP1…"></textarea><button class="btn pri" id="ia">Importar y fusionar</button>';$('#ia').onclick=()=>{try{const v=$('#ic').value.trim();if(!v.startsWith('AP1.'))throw 0;merge(JSON.parse(decodeURIComponent(escape(atob(v.slice(4))))));save();chrome();toast('Progreso fusionado');vSettings();}catch(e){toast('Ese código no es válido','circle-x');}};};
 $('#rst').onclick=()=>{const b=$('#rst');if(b.dataset.c){localStorage.removeItem(KEY);location.reload();}else{b.dataset.c=1;b.innerHTML=ic('triangle-alert',16)+' Pulsa otra vez para confirmar';}};}
function merge(o){S.xp=Math.max(S.xp,o.xp||0);S.bestStreak=Math.max(S.bestStreak,o.bestStreak||0);S.bestCombo=Math.max(S.bestCombo,o.bestCombo||0);S.shields=Math.max(S.shields,o.shields||0);
 if(o.lastGoal&&(!S.lastGoal||o.lastGoal>S.lastGoal)){S.lastGoal=o.lastGoal;S.streak=o.streak;}else if(o.lastGoal===S.lastGoal)S.streak=Math.max(S.streak,o.streak||0);
 ['read','ach'].forEach(k=>Object.entries(o[k]||{}).forEach(([a,b])=>{if(!S[k][a])S[k][a]=b;}));
 Object.entries(o.q||{}).forEach(([a,b])=>{const m=S.q[a];if(!m||(b.c+b.w)>(m.c+m.w))S.q[a]=b;});
 Object.entries(o.exams||{}).forEach(([a,b])=>S.exams[a]=Math.max(S.exams[a]||0,b));
 Object.entries(o.days||{}).forEach(([a,b])=>{const m=S.days[a];if(!m||b.xp>m.xp)S.days[a]=b;});
 Object.entries(o.chal||{}).forEach(([a,b])=>{S.chal[a]=[...new Set([...(S.chal[a]||[]),...b])];});
 S.total={ans:Math.max(S.total.ans,o.total?.ans||0),ok:Math.max(S.total.ok,o.total?.ok||0)};}

/* ---------- boot ---------- */
const mq=window.matchMedia('(prefers-color-scheme: dark)');
function applyTheme(){const dark=S.theme==='dark'||(S.theme==='system'&&mq.matches);document.documentElement.classList.toggle('light',!dark);const m=$('meta[name=theme-color]');if(m)m.content=dark?'#0c0d10':'#f5f6f8';}
const wide=window.matchMedia('(min-width: 900px)');
function layoutMode(){return S.layout==='desk'||S.layout==='mob'?S.layout:(wide.matches?'desk':'mob');}
function applyLayout(){const m=layoutMode();const h=document.documentElement;h.classList.toggle('desk',m==='desk');h.classList.toggle('mob',m==='mob');if($('.content'))render();}
wide.addEventListener&&wide.addEventListener('change',()=>{if(S.layout==='auto')applyLayout();});
mq.addEventListener&&mq.addEventListener('change',applyTheme);applyTheme();
$('#sidenav').innerHTML=NAV.map(([k,i,t])=>`<button data-nav="${k}">${ic(i,20)}<span>${t}</span></button>`).join('');
$('#tabs').innerHTML=NAV.map(([k,i,t])=>`<button data-nav="${k}">${ic(i,22)}<span>${t}</span></button>`).join('');
$$('[data-nav]').forEach(b=>b.onclick=()=>go(b.dataset.nav));
$$('.logo-slot').forEach(e=>e.innerHTML=crest()+'<span class="wm">ROOT<b>STREAK</b></span>');
$('#sidenav').insertAdjacentHTML('beforebegin','<div class="navlbl">Menú</div>');
applyLayout();checkAch();
if(!S.welcomed3){S.welcomed3=true;save();setTimeout(()=>modal('crest','','Bienvenido a '+APP,'Cambia el scroll infinito por aprender ciberseguridad, sistemas y empresa.<br><br>Lee la <b>teoría</b>, <b>practica</b> con preguntas, gana XP y no rompas tu racha.','Empezar'),300);}
if('serviceWorker' in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__APP={S,TOPICS,QS,LESSONS,go};
})();
