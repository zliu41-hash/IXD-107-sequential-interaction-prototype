/* Cat Naps — one linear sequence built from three interaction studies:
   1 Open the curtain (drag) → 2 Smooth the cushion (swipe) → 3 Hush the room (press + hold) → asleep.
   Each step unlocks only after the one before it holds, and every choice carries forward:
   how wide the beam is decides how warm the cushion looks, and how lofty the cushion is
   decides how quickly the cat settles when the room goes quiet. */
(() => {
const CFG = JSON.parse(JSON.stringify(window.CAT_DEFAULTS));
const $ = id => document.getElementById(id);
const svg = $('stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

function applyColors(){
  const r = document.documentElement.style, c = CFG.colors;
  r.setProperty('--wall', c.wall); r.setProperty('--floor', c.floor); r.setProperty('--ink', c.ink);
  r.setProperty('--sun', c.sun); r.setProperty('--cushion', c.cushion); r.setProperty('--accent', c.accent);
  r.setProperty('--night', c.night);
}
const EASE = {
  linear: t=>t, easeIn: t=>t*t*t, easeOut: t=>1-Math.pow(1-t,3),
  easeInOut: t=> t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2,
  spring: t=>1-Math.cos(t*Math.PI*3.5)*Math.exp(-t*6)
};

/* ---------- shared cat drawing ---------- */
function catSit(x,y,t,squint){
  const blink = squint || (Math.sin(t*1.2)>.95);
  const eye = blink
    ? `<path d="M${x-15} ${y-26} h8 M${x-1} ${y-26} h8" stroke="var(--wall)" stroke-width="2.5" stroke-linecap="round"/>`
    : `<circle cx="${x-11}" cy="${y-26}" r="2.4" fill="var(--wall)"/><circle cx="${x+3}" cy="${y-26}" r="2.4" fill="var(--wall)"/>`;
  return `<ellipse cx="${x+2}" cy="${y+22}" rx="30" ry="6" fill="#000" opacity=".14"/>
  <path d="M${x+24} ${y+14} q26 6 20 -14" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
  <path d="M${x-22} ${y+18} q-6 -34 14 -40 q26 -8 34 16 q6 22 -6 24 Z" fill="var(--ink)"/>
  <circle cx="${x-4}" cy="${y-22}" r="19" fill="var(--ink)"/>
  <path d="M${x-20} ${y-33} l-2 -16 l15 7 Z" fill="var(--ink)"/>
  <path d="M${x+6} ${y-36} l6 -15 l9 11 Z" fill="var(--ink)"/>${eye}
  <path d="M${x-4} ${y-18} l-3 3 l3 2 l3 -2 Z" fill="var(--wall)"/>`;
}
function catWalk(x,y,t){
  return `<ellipse cx="${x+2}" cy="${y+22}" rx="30" ry="6" fill="#000" opacity=".14"/>
  <path d="M${x+26} ${y+6} q22 ${(-10+Math.sin(t*5)*8).toFixed(1)} 16 -26" fill="none" stroke="var(--ink)" stroke-width="7" stroke-linecap="round"/>
  <path d="M${x-22} ${y+18} q-6 -34 14 -40 q26 -8 34 16 q6 22 -6 24 Z" fill="var(--ink)"/>
  <path d="M${x-14} ${y+16} l${(Math.sin(t*9)*5).toFixed(1)} 14 M${x+2} ${y+16} l${(Math.sin(t*9+3)*5).toFixed(1)} 14" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
  <circle cx="${x-4}" cy="${y-22}" r="19" fill="var(--ink)"/>
  <path d="M${x-20} ${y-33} l-2 -16 l15 7 Z" fill="var(--ink)"/>
  <path d="M${x+6} ${y-36} l6 -15 l9 11 Z" fill="var(--ink)"/>
  <circle cx="${x-11}" cy="${y-26}" r="2.4" fill="var(--wall)"/><circle cx="${x+3}" cy="${y-26}" r="2.4" fill="var(--wall)"/>`;
}
function catCurl(x,y,t,{asleep=false, ears=0, breathe=1}={}){
  const b = Math.sin(t*(asleep?1.1:2.2))*(asleep?2.6:1.6)*breathe;
  const eye = asleep
    ? `<path d="M${x-22} ${y-10} q5 4 10 0" fill="none" stroke="var(--wall)" stroke-width="2.5" stroke-linecap="round"/>`
    : `<circle cx="${x-18}" cy="${y-11}" r="2.3" fill="var(--wall)"/>`;
  return `<ellipse cx="${x}" cy="${y+20}" rx="48" ry="8" fill="#000" opacity=".14"/>
  <g transform="translate(0 ${b.toFixed(2)})">
  <path d="M${x-48} ${y+14} q-6 -32 26 -38 q34 -6 48 14 q15 21 -6 28 q-34 10 -68 -4 Z" fill="var(--ink)"/>
  <circle cx="${x-17}" cy="${y-9}" r="18" fill="var(--ink)"/>
  <path d="M${x-32} ${y-20} l${(-3+ears).toFixed(1)} ${(-15+ears*2).toFixed(1)} l15 6 Z" fill="var(--ink)"/>
  <path d="M${x-7} ${y-23} l${(6-ears).toFixed(1)} ${(-14+ears*2).toFixed(1)} l9 10 Z" fill="var(--ink)"/>${eye}
  <path d="M${x-17} ${y-3} l-3 3 l3 2 l3 -2 Z" fill="var(--wall)"/></g>`;
}
const zzz = (x,y,t,fill) => { let s=''; for(let i=0;i<3;i++){ const p=((t*.35+i*.33)%1); s+=`<text x="${(x+p*26).toFixed(0)}" y="${(y-p*70).toFixed(0)}" font-size="${13+i*5}" opacity="${((1-p)*.9).toFixed(2)}">z</text>`; } return s; };

/* ---------- sequence ---------- */
const HEAD = ['Open the curtain','Smooth the cushion','Hush the room','Asleep'];
const LABEL = ['Light','Soft','Quiet'];
const scenes = [$('s1'),$('s2'),$('s3'),$('s4')];
const G = { stage:0, done:[false,false,false], trans:null, clock:0, wait:null, beam:0.68, loft:0.6, held:0 };
const live = i => G.stage===i && !G.trans;
const place = (i,x) => { scenes[i].setAttribute('transform',`translate(${x.toFixed(1)} 0)`); scenes[i].style.visibility = Math.abs(x)>=389 ? 'hidden':'visible'; };
const goTo = n => { G.trans={from:G.stage,to:n,t:0}; G.wait=null; };
const later = (sec,fn) => { G.wait={t:sec,fn}; };
function button(el,fn){ el.addEventListener('click',fn); el.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();fn();} }); }

function drawSteps(){
  const xs=[95,195,295]; let s=`<line x1="95" x2="295" y1="126" y2="126" stroke="var(--soft)" stroke-width="2"/>`;
  if(G.done[0]) s+=`<line x1="95" x2="${G.done[1]?295:195}" y1="126" y2="126" stroke="var(--accent)" stroke-width="2.5"/>`;
  xs.forEach((x,i)=>{
    const done=G.done[i], active=G.stage===i;
    if(done) s+=`<circle cx="${x}" cy="126" r="11" fill="var(--accent)"/><path d="M${x-5} 126 l3.5 3.5 l6.5 -7" fill="none" stroke="var(--wall)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    else if(active){ const p=reduce?0:(G.clock%1.6)/1.6;
      s+=`<circle cx="${x}" cy="126" r="${(11+p*9).toFixed(1)}" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="${(1-p).toFixed(2)}"/><circle cx="${x}" cy="126" r="11" fill="var(--wall)" stroke="var(--accent)" stroke-width="2.5"/><circle cx="${x}" cy="126" r="4" fill="var(--accent)"/>`;
    } else s+=`<circle cx="${x}" cy="126" r="10" fill="var(--wall)" stroke="var(--soft)" stroke-width="2"/>`;
    s+=`<text x="${x}" y="156" font-size="11" text-anchor="middle" fill="${done||active?'var(--ink)':'var(--mid)'}">${LABEL[i]}</text>`;
  });
  $('steps').innerHTML=s;
}
let bd=''; for(let i=0;i<7;i++) bd+=`<line x1="0" x2="390" y1="${600+i*36}" y2="${600+i*36}"/>`;
$('boards').innerHTML=bd; $('boards2').innerHTML=bd; $('boards3').innerHTML=bd;

/* ===== 1 CURTAIN ===== */
const C = (()=>{
  const X0=66, X1=330;
  let S; const reset=()=>{ S={open:.04,target:.04,drag:null,t:0,settle:0,walk:0,moved:false,motes:[],ok:false}; };
  reset();
  const edge=$('edge');
  edge.addEventListener('pointerdown',e=>{ if(!live(0)||G.done[0]) return; const p=toSvg(e); S.drag={x:p.x,base:S.open}; S.moved=true; edge.setPointerCapture(e.pointerId); edge.classList.add('on'); });
  edge.addEventListener('pointermove',e=>{ if(!S.drag) return; const p=toSvg(e); S.target=clamp(S.drag.base+(p.x-S.drag.x)/(X1-X0),0,1); });
  const up=()=>{ if(!S.drag) return; S.drag=null; edge.classList.remove('on'); };
  edge.addEventListener('pointerup',up); edge.addEventListener('pointercancel',up); edge.addEventListener('lostpointercapture',up);
  edge.addEventListener('keydown',e=>{ if(!live(0)||G.done[0]) return; const d=e.key==='ArrowRight'?.06:e.key==='ArrowLeft'?-.06:0; if(!d) return; e.preventDefault(); S.moved=true; S.target=clamp(S.target+d,0,1); });
  function update(dt){
    S.t+=dt;
    S.open += (S.target-S.open)*Math.min(1,dt*CFG.motion.curtainLag);
    const o=S.open, T=CFG.targets;
    edge.setAttribute('aria-valuenow',Math.round(o*100));
    const ex=X0+o*(X1-X0), w=Math.max(10,336-ex);
    $('cBody').setAttribute('x',ex); $('cBody').setAttribute('width',w);
    let f=''; for(let i=0;i<6;i++){ const fx=ex+6+(w-12)*(i/5); f+=`<path d="M${fx.toFixed(1)} 150 q${(4-o*3).toFixed(1)} 150 0 300"/>`; }
    $('cFolds').innerHTML=f;
    $('pull').setAttribute('transform',`translate(${(ex-X0).toFixed(1)} 0)`);
    $('edgeHit').setAttribute('x',(300+ex-X0).toFixed(1));
    const gl=54, gr=ex, gw=gr-gl;
    if(gw>6){ $('beam').setAttribute('d',`M${gl} 450 L${gr.toFixed(1)} 450 L${(gr+gw*.34+16).toFixed(1)} 844 L${(gl-gw*.26-8).toFixed(1)} 844 Z`); $('beam').setAttribute('opacity',(.25+o*.7).toFixed(2)); }
    else $('beam').setAttribute('d','');
    if(!reduce && Math.random()<o*dt*22) S.motes.push({x:gl+Math.random()*(gw+40),y:470+Math.random()*250,v:-8-Math.random()*12,a:1});
    for(const m of S.motes){ m.y+=m.v*dt; m.x+=Math.sin(S.t+m.y*.05)*6*dt; m.a-=dt*.22; }
    S.motes=S.motes.filter(m=>m.a>0);
    $('motes').innerHTML=S.motes.map(m=>`<circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="2" opacity="${(m.a*.8).toFixed(2)}"/>`).join('');
    const ok = o>=T.beamLow && o<=T.beamHigh, glare = o>T.beamHigh;
    S.ok=ok;
    $('rug').setAttribute('stroke-dasharray', ok||G.done[0] ? '0' : '9 7');
    $('rug').setAttribute('stroke', ok||G.done[0] ? 'var(--accent)' : 'var(--mid)');
    if(live(0)&&!G.done[0]){
      if(ok){ S.settle+=dt; S.walk=Math.min(1,S.walk+dt*.9); } else { S.settle=0; S.walk=Math.max(0,S.walk-dt*1.3); }
      if(S.settle>1.6 && S.walk>=1){ G.done[0]=true; G.beam=o; later(1.2,()=>goTo(1)); }
    }
    const cx=70+S.walk*120, cy=706-S.walk*42;
    $('cat1').innerHTML = G.done[0] ? catCurl(196,694,S.t,{}) : (S.walk>0&&S.walk<1 ? catWalk(cx,cy,S.t) : catSit(cx,cy,S.t,glare));
    if(S.moved===false && !reduce){ const p=(S.t%2)/2; $('hint1').setAttribute('r',(16+p*26).toFixed(1)); $('hint1').setAttribute('opacity',(1-p).toFixed(2)); $('hint1').setAttribute('transform',`translate(${(ex-X0).toFixed(1)} 0)`); }
    else $('hint1').setAttribute('opacity',0);
    $('glare').setAttribute('opacity',(!G.done[0]&&glare)?1:0);
  }
  return {reset,update,get state(){return S;}};
})();

/* ===== 2 CUSHION ===== */
const P = (()=>{
  const N=9, L=70, R=322, CY=622, SPAN=R-L;   // CY is the cushion's base, sitting on the rug
  const px=i=>L+SPAN*i/(N-1);
  let S;
  function reset(){
    S={h:[],t:0,drag:null,lastX:0,dir:0,strokes:0,trail:[],cat:0,settle:0,flat:false,touched:false};
    for(let i=0;i<N;i++){ const u=i/(N-1); S.h.push(64+Math.sin(u*9.1)*22+Math.sin(u*21+1.7)*13+(Math.random()*8-4)); }
    retry(false);
  }
  const retry=on=>{ const r=$('retry2'); r.setAttribute('opacity',on?1:0); r.style.pointerEvents=on?'auto':'none'; r.setAttribute('tabindex',on?0:-1); };
  reset();
  function metrics(){ const mean=S.h.reduce((a,b)=>a+b,0)/N; let rough=0; for(let i=1;i<N;i++) rough+=Math.abs(S.h[i]-S.h[i-1]); return {mean, smooth:clamp(1-rough/90,0,1)}; }
  function stroke(x,strength){
    const m=metrics().mean;
    for(let i=0;i<N;i++){
      const d=Math.abs(px(i)-x), w=Math.exp(-(d*d)/(2*58*58));
      S.h[i]+=(m-S.h[i])*w*strength*.55;
      S.h[i]-=w*strength*1.05*CFG.motion.smoothPower;
      S.h[i]=clamp(S.h[i],8,110);
    }
  }
  const pad=$('pad');
  pad.addEventListener('pointerdown',e=>{ if(!live(1)||G.done[1]) return; const p=toSvg(e); S.drag={x:p.x}; S.lastX=p.x; S.touched=true; pad.setPointerCapture(e.pointerId); pad.classList.add('on'); });
  pad.addEventListener('pointermove',e=>{ if(!S.drag||G.done[1]) return; const p=toSvg(e); const dx=p.x-S.lastX; if(Math.abs(dx)<1) return; const d=Math.sign(dx); if(d!==S.dir){S.dir=d;S.strokes++;} stroke(p.x,Math.min(1,Math.abs(dx)/26)); S.trail.push({x:p.x,y:p.y,a:1}); S.lastX=p.x; });
  const up=()=>{ if(!S.drag) return; S.drag=null; pad.classList.remove('on'); };
  pad.addEventListener('pointerup',up); pad.addEventListener('pointercancel',up); pad.addEventListener('lostpointercapture',up);
  pad.addEventListener('keydown',e=>{ if(!live(1)||G.done[1]) return; const d=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0; if(!d) return; e.preventDefault(); S.touched=true; S.dir=d; S.strokes++; for(let k=0;k<N;k++) stroke(px(k),.5); });
  button($('retry2'),()=>{ if(live(1)) reset(); });
  const topY=i=>CY-S.h[i];
  function path(){
    let d=`M${L} ${CY} C${L-14} ${CY-18} ${L-10} ${topY(0)+10} ${px(0)} ${topY(0)}`;
    for(let i=1;i<N;i++){ const xm=(px(i-1)+px(i))/2; d+=` C${xm} ${topY(i-1)} ${xm} ${topY(i)} ${px(i)} ${topY(i)}`; }
    d+=` C${R+10} ${topY(N-1)+10} ${R+14} ${CY-18} ${R} ${CY} C${R-6} ${CY+22} ${L+6} ${CY+22} ${L} ${CY} Z`;
    return d;
  }
  function update(dt){
    S.t+=dt;
    const {mean,smooth}=metrics(), T=CFG.targets;
    const loft=clamp((mean-18)/70,0,1);
    const ok = smooth>=T.smoothMin && loft>T.loftMin;
    S.flat = loft<=T.loftMin;
    pad.setAttribute('aria-valuenow',Math.round(smooth*100));
    // the beam from step 1 falls across this scene too
    const gw=(66+G.beam*264)-54;
    $('beam2').setAttribute('d',`M${(120-gw*.12).toFixed(1)} 300 L${(120+gw*.62).toFixed(1)} 300 L${(150+gw*.76).toFixed(1)} 844 L${(84-gw*.2).toFixed(1)} 844 Z`);
    $('beam2').setAttribute('opacity',(.14+G.beam*.3).toFixed(2));
    const d=path(); $('padBody').setAttribute('d',d); $('padShade').setAttribute('d',d);
    let sm=''; for(const off of [14,30]){ let p=`M${L+12} ${CY-off*.3}`; for(let i=0;i<N;i++) p+=` L${px(i).toFixed(0)} ${(topY(i)+off).toFixed(1)}`; p+=` L${R-12} ${CY-off*.3}`; sm+=`<path d="${p}" opacity="${(.55-off/120).toFixed(2)}"/>`; }
    $('seams').innerHTML=sm;
    let fb=''; for(let i=0;i<N;i++){ const loc=Math.abs(S.h[i]-mean); if(loc>5){ const n=Math.min(3,Math.round(loc/6)); for(let k=0;k<n;k++){ const x=px(i)+(k-1)*7, y=topY(i), w=reduce?0:Math.sin(S.t*2+i+k)*3; fb+=`<path d="M${x.toFixed(1)} ${y.toFixed(1)} q${w.toFixed(1)} -6 ${(w*1.6).toFixed(1)} -11" opacity="${Math.min(.85,loc/22).toFixed(2)}"/>`; } } }
    $('fibres').innerHTML=fb;
    for(const p of S.trail) p.a-=dt*2.4;
    S.trail=S.trail.filter(p=>p.a>0);
    $('trail').innerHTML=S.trail.map(p=>`<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${(4+(1-p.a)*8).toFixed(1)}" opacity="${(p.a*.22).toFixed(2)}" stroke-width="2"/>`).join('');
    let pf=`M58 766`; for(let i=0;i<N;i++) pf+=` L${(58+274*i/(N-1)).toFixed(1)} ${(766-S.h[i]*.5).toFixed(1)}`; pf+=` L332 766`;
    $('prof').setAttribute('d',pf);
    $('bandOk').setAttribute('y',(766-78*.5-7).toFixed(1)); $('bandOk').setAttribute('height',(40*.5+14).toFixed(1));
    $('bandOk').setAttribute('stroke', ok?'var(--accent)':'var(--soft)');
    if(live(1)&&!G.done[1]){
      if(ok&&!S.drag){ S.settle+=dt; S.cat=Math.min(1,S.cat+dt*.9); } else { S.settle=0; if(!ok) S.cat=Math.max(0,S.cat-dt*1.4); }
      if(S.settle>1.2&&S.cat>=1){ G.done[1]=true; G.loft=loft; later(1.2,()=>goTo(2)); }
    }
    if(!S.touched&&!reduce){ const p=(S.t%2.4)/2.4; $('hint2').setAttribute('r',(60+p*60).toFixed(1)); $('hint2').setAttribute('opacity',((1-p)*.45).toFixed(2)); }
    else $('hint2').setAttribute('opacity',0);
    const cx=334-S.cat*110, cy=676-S.cat*(60+mean*.42);
    $('cat2').innerHTML = G.done[1] ? catCurl(210,CY-mean*.55,S.t,{}) : catSit(cx,cy,S.t,false);
    if(S.flat&&S.touched&&!G.done[1]) retry(true);
    $('flat').setAttribute('opacity',(!G.done[1]&&S.flat&&S.touched)?1:0);
  }
  return {reset,update,get state(){return {...metrics(),strokes:S.strokes,flat:S.flat,cat:S.cat};}};
})();

/* ===== 3 HUSH ===== */
const H = (()=>{
  let S; const reset=()=>{ S={q:0,hold:false,t:0,asleep:0,touched:false,px:195,py:470,ring:1}; };
  reset();
  const hit=$('hushHit');
  const down=e=>{ if(!live(2)||G.done[2]) return; S.hold=true; S.touched=true; S.ring=0; if(e&&e.clientX!==undefined){const p=toSvg(e); S.px=p.x; S.py=p.y;} if(e&&e.pointerId!==undefined) hit.setPointerCapture(e.pointerId); };
  const up=()=>{ S.hold=false; };
  hit.addEventListener('pointerdown',down); hit.addEventListener('pointerup',up);
  hit.addEventListener('pointercancel',up); hit.addEventListener('lostpointercapture',up);
  hit.addEventListener('keydown',e=>{ if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();down();} });
  hit.addEventListener('keyup',e=>{ if(e.key===' '||e.key==='Enter') up(); });
  hit.addEventListener('contextmenu',e=>e.preventDefault());
  function update(dt){
    S.t+=dt;
    if(!G.done[2]){
      // a lofty cushion makes the cat settle a little faster: the earlier step carries in
      const ease = 1 + (G.loft-.5)*.5;
      if(S.hold) S.q=clamp(S.q+dt*CFG.motion.hushRate*ease,0,1);
      else S.q=clamp(S.q-dt*CFG.motion.leakRate,0,1);
    }
    const q=G.done[2]?1:S.q, loud=1-q;
    let w=''; const src=[[86,212,1],[295,220,1.15],[48,428,.85]];
    for(let i=0;i<3;i++){ const [x,y,sc]=src[i];
      for(let k=1;k<=3;k++){ const ph=((S.t*(.7+i*.1)+k*.33)%1); const r=(16+ph*52)*sc*(.25+loud*.75); const a=(1-ph)*loud*.7;
        if(a>.02) w+=`<circle cx="${x}" cy="${y}" r="${r.toFixed(1)}" opacity="${a.toFixed(2)}" stroke-width="${(2.4*(1-ph*.5)).toFixed(1)}"/>`; } }
    $('waves').innerHTML=w;
    $('hand').setAttribute('transform',`rotate(${(S.t*(60+loud*300))%360} 86 212)`);
    $('dim').setAttribute('opacity',(q*.42).toFixed(3));
    const amp=10-q*4, per=1.8-q*1.0;
    let d=`M58 770`;
    for(let i=1;i<=68;i++){ const u=i/68, x=58+u*274;
      const y=770 - Math.sin(u*Math.PI*2*per+S.t*(2.4-q*1.5))*amp - (loud>.1?(Math.random()-.5)*loud*7:0);
      d+=` L${x.toFixed(1)} ${y.toFixed(1)}`; }
    $('breath').setAttribute('d',d);
    $('breath').setAttribute('opacity',(.4+q*.6).toFixed(2));
    $('calm').setAttribute('opacity', q>.72?.45:.16);
    if(live(2)&&!G.done[2]&&q>=1){ S.asleep+=dt; if(S.asleep>CFG.targets.hushHold){ G.done[2]=true; G.held=S.t; later(1.4,()=>goTo(3)); } }
    else if(!G.done[2]) S.asleep=0;
    $('cat3').innerHTML=catCurl(196,592,S.t,{asleep:q>.85, ears:q>.8?4:0, breathe:1-q*.4});
    if(q>=1){ $('zzz').innerHTML=zzz(258,552,S.t); $('zzz').setAttribute('opacity',1); } else $('zzz').setAttribute('opacity',0);
    S.ring=Math.min(1,S.ring+dt*1.6);
    $('press').setAttribute('cx',S.px); $('press').setAttribute('cy',S.py);
    $('press').setAttribute('r',(10+S.ring*120).toFixed(1));
    $('press').setAttribute('opacity',S.hold?((1-S.ring)*.55).toFixed(2):0);
    if(!S.touched&&!reduce){ const p=(S.t%2.4)/2.4; $('hint3').setAttribute('r',(40+p*70).toFixed(1)); $('hint3').setAttribute('opacity',((1-p)*.5).toFixed(2)); }
    else $('hint3').setAttribute('opacity',0);
  }
  return {reset,update,get state(){return S;}};
})();

/* ===== END ===== */
const E = (()=>{
  let t=0;
  function enter(){
    t=0;
    const rows=[['Light', Math.round(G.beam*100)+'%'],['Loft', Math.round(G.loft*100)+'%'],['Hush', Math.round(G.held)+'s']];
    $('eRows').innerHTML=rows.map((r,i)=>`<text x="110" y="${372+i*30}" opacity=".7">${r[0]}</text><text class="num" x="280" y="${372+i*30}" text-anchor="end">${r[1]}</text><line x1="110" x2="280" y1="${380+i*30}" y2="${380+i*30}" stroke="#e8e1d6" stroke-width="1" opacity=".25"/>`).join('');
    $('eTitle').textContent = G.beam>CFG.targets.beamHigh-0.06 ? 'Asleep in the sun' : G.loft>0.6 ? 'Deep asleep' : 'Asleep';
  }
  function update(dt){ t+=dt; $('cat4').innerHTML=catCurl(196,592,t,{asleep:true,ears:4}); $('zzz4').innerHTML=zzz(258,552,t); }
  button($('again'),()=>{ if(live(3)) resetAll(); });
  return {enter,update};
})();

function resetAll(){
  G.stage=0; G.done=[false,false,false]; G.trans=null; G.wait=null; G.beam=.68; G.loft=.6; G.held=0;
  C.reset(); P.reset(); H.reset();
  scenes.forEach((s,i)=>place(i,i===0?0:390));
  $('headline').textContent=HEAD[0];
}
button($('resetAll'),resetAll);

let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000); last=now; G.clock+=dt;
  if(G.wait){ G.wait.t-=dt; if(G.wait.t<=0){ const fn=G.wait.fn; G.wait=null; fn(); } }
  if(G.trans){
    const T=G.trans; T.t+=dt*1000;
    const p=Math.min(1,T.t/Math.max(1,CFG.motion.transitionMs)), e=(EASE[CFG.motion.easing]||EASE.easeInOut)(reduce?1:p);
    place(T.from,-390*e); place(T.to,390*(1-e));
    if(p>=1){ place(T.from,-390); place(T.to,0); G.stage=T.to; G.trans=null; $('headline').textContent=HEAD[G.stage]; if(G.stage===3) E.enter(); }
  }
  C.update(dt); P.update(dt); H.update(dt);
  if(G.stage===3||(G.trans&&G.trans.to===3)) E.update(dt);
  drawSteps();
  requestAnimationFrame(frame);
}
applyColors(); resetAll(); requestAnimationFrame(frame);
window.CAT={CFG, applyColors, resetAll, G, C, P, H, goTo};
})();
