/* Cat Naps
   One field, one morning, one fixed sequence:
     lift her out of the basket -> put the fish in her dish -> smooth her fur five times
     -> take the sun down -> carry her back to bed, and it is over.
   At each step only that step's own object answers. The others are inert until their turn.
   There are no words, no arrows and no buttons: the only instruction in the piece is that
   the thing you should touch next is lit, and the place it should go is lit more faintly. */
(() => {
'use strict';

const CFG = JSON.parse(JSON.stringify(window.CAT_DEFAULTS));
const $   = id => document.getElementById(id);
const svg = $('stage');
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp  = (a,b,k) => a + (b-a)*k;
const rnd   = (a,b) => a + Math.random()*(b-a);
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
                     return p.matrixTransform(svg.getScreenCTM().inverse()); };

const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const rgb = a => `rgb(${a.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
const mix = (a,b,k) => { const A=hex(a), B=hex(b); return rgb([0,1,2].map(i=>lerp(A[i],B[i],k))); };
const hx2 = v => Math.round(clamp(v,0,255)).toString(16).padStart(2,'0');
const dark = (c,k) => { const A=hex(c); return '#' + A.map(v=>hx2(v*(1-k))).join(''); };

// ---- the world, sized to whatever window it lands in -----------------------
const FLOOR = 844, HORIZON = 408;
let W = 390;
// everything the hand touches is measured off the frame, so the piece stays centred and
// stays reachable from a phone up to a desktop. A fixed layout strands half of it offscreen.
const ps = () => clamp(1 + (W/390 - 1)*0.17, 1, 1.6);          // prop scale
const catScale = () => CFG.cat.size * ps();

let BED  = { x: 100, y: 676 };
let DISH = { x: 280, y: 712 };
let SLOT = { x: 330, y: 466 };          // the notch on the horizon the sun drops into
let SUN0 = { x: 270, y: 176 };
let MOON = { x: 96,  y: 182 };
let PEN  = { x0: 54, x1: 336, y0: 556, y1: 806 };
let FISH0 = { x: 190, y: 790 };
let OUT  = { x: 230, y: 718 };          // somewhere out of the basket, for step one

let HILL = [], TFAR = [], TNEAR = [], BUSH = [], TUFT = [], FLOW = [], LOG = [], CLOUD = [], STARS = [];
const PING = [], SPARK = [];

function buildWorld(){
  const k = ps();
  BED   = { x: Math.round(clamp(W*0.24, 86, W-86)), y: 648 };
  DISH  = { x: Math.round(clamp(W*0.78, 70, W-70)), y: 694 };
  SLOT  = { x: Math.round(clamp(W*0.77, 110, W-104)), y: HORIZON - 4 };
  SUN0  = { x: Math.round(clamp(W*0.72, 80, W-76)), y: 150 };
  MOON  = { x: Math.round(clamp(W*0.22, 60, W-60)), y: 162 };
  PEN   = { x0: 54, x1: W - 54, y0: 520, y1: 800 };
  FISH0 = { x: Math.round(clamp(W*0.19, 52, W-52)), y: 786 };
  // out of the basket, but nowhere near the dish — she should not be standing on her dinner
  OUT   = { x: Math.round(clamp(W*0.50, PEN.x0 + 50, PEN.x1 - 50)), y: 764 };

  STARS = [];
  for(let i=0;i<Math.round(W/9);i++) STARS.push({ x: rnd(4,W-4), y: rnd(18,430), r: rnd(.6,1.8), p: rnd(0,7) });

  HILL = [];
  for(let i=0;i<4;i++) HILL.push({ x: rnd(-60, W+60), y: HORIZON + rnd(-6,10), rx: rnd(130,280), ry: rnd(46,92) });

  // two rows of conifers along the skyline: the far row pale, the near row a shade deeper
  const gap = 56*k;                      // the notch the sun drops into: keep the near trees out of it
  const clear = t => Math.abs(t.x - SLOT.x) > gap;
  TFAR = []; let x = -24;
  while(x < W + 24){ const w = rnd(17,30);
                     TFAR.push({ x, y: HORIZON - rnd(-4,8), h: rnd(54,104)*(Math.abs(x-SLOT.x) > gap ? 1 : .42), w });
                     x += w*rnd(.74,1.3); }
  TNEAR = []; x = -18;
  while(x < W + 18){ const w = rnd(22,40); const t = { x, y: HORIZON + rnd(4,24), h: rnd(46,96), w };
                     if(clear(t)) TNEAR.push(t); x += w*rnd(.92,1.7); }

  BUSH = [];
  for(let i=0;i<Math.round(W/58)+3;i++) BUSH.push({ x: rnd(10,W-10), y: rnd(HORIZON+26, FLOOR-30), r: rnd(11,24) });

  TUFT = [];
  for(let i=0;i<Math.round(W/13)+16;i++) TUFT.push({ x: rnd(0,W), y: rnd(HORIZON+18, FLOOR-6), s: rnd(.7,1.5) });

  FLOW = [];
  for(let i=0;i<Math.round(W/26)+7;i++) FLOW.push({ x: rnd(8,W-8), y: rnd(HORIZON+34, FLOOR-12), h: rnd(0,1) });

  LOG = [];
  LOG.push({ x: clamp(W*0.08, 34, W-34), y: 576, w: 46, kind: 'log' });
  LOG.push({ x: clamp(W*0.92, 34, W-34), y: 602, w: 52, kind: 'log' });
  LOG.push({ x: clamp(W*0.45, 30, W-30), y: 546, w: 22, kind: 'stump' });

  CLOUD = [];
  for(let i=0;i<7;i++) CLOUD.push({ x: rnd(-200,W), y: rnd(40,276), w: rnd(80,200), h: rnd(22,48), v: rnd(2.5,7), o: rnd(.45,.9) });
}

function layout(){
  const r = (innerWidth || 390) / (innerHeight || 844);
  W = clamp(Math.round(FLOOR * r), 360, 2400);
  svg.setAttribute('viewBox', `0 0 ${W} ${FLOOR}`);
  buildWorld();
  if(!S.touched){ S.cat.x = BED.x; S.cat.y = BED.y - 12; S.sun.x = SUN0.x; S.sun.y = SUN0.y;
                  S.fish.x = FISH0.x; S.fish.y = FISH0.y; }
  S.cat.x = clamp(S.cat.x, PEN.x0, PEN.x1);
  S.cat.y = clamp(S.cat.y, PEN.y0, PEN.y1);
  if(!S.fish.inDish){ S.fish.x = clamp(S.fish.x, 30, W-30); }
  else { S.fish.x = DISH.x; S.fish.y = DISH.y - 4; }
  cache.key = {};
}

// ---- state -----------------------------------------------------------------
const S = {
  t: 0, night: 0,
  cat: { x: 100, y: 664, wake: 0, puff: 0, stretch: 0, face: 1, bob: 0, purr: 0 },
  sun: { x: 270, y: 176, set: false },
  fish: { x: 190, y: 790, inDish: false, left: 1 },
  drag: null,                       // { what:'cat'|'fish'|'sun', dx, dy, moved }
  mode: 'rest', target: null, eat: 0, idle: 999,
  fishEaten: false, strokes: 0, inBed: true,
  touched: false,
  hint: { step: 0, k: 0, ping: 0, flare: 0 }
};
const cache = { key: {}, html: {} };
const once = (slot, key, make) => { if(cache.key[slot] !== key){ cache.key[slot] = key; $(slot).innerHTML = make(); } };
const N = () => S.night;

// ---- sky -------------------------------------------------------------------
function drawSky(){
  const n = N(), C = CFG.colors;
  $('skyTop').setAttribute('stop-color', mix(C.skyDayTop, C.skyNightTop, n));
  $('skyMid').setAttribute('stop-color', mix(C.skyDayMid, C.skyNightMid, n));
  $('skyLow').setAttribute('stop-color', mix(C.skyDayLow, C.skyNightLow, n));

  $('stars').innerHTML = n < .12 ? '' : STARS.map(s =>
    `<circle cx="${s.x.toFixed(0)}" cy="${s.y.toFixed(0)}" r="${s.r.toFixed(1)}" fill="#fff"
       opacity="${(n*(.3+Math.abs(Math.sin(S.t*.7+s.p))*.6)).toFixed(2)}"/>`).join('');

  $('clouds').innerHTML = CLOUD.map(c => {
    const col = mix('#FFFFFF', '#8C93C4', n);
    return `<g opacity="${(c.o*(1-n*.45)*CFG.scene.cloud).toFixed(2)}" filter="url(#cloudy)">
      <ellipse cx="${c.x.toFixed(0)}" cy="${c.y.toFixed(0)}" rx="${(c.w*.5).toFixed(0)}" ry="${(c.h*.5).toFixed(0)}" fill="${col}"/>
      <ellipse cx="${(c.x-c.w*.22).toFixed(0)}" cy="${(c.y+c.h*.12).toFixed(0)}" rx="${(c.w*.3).toFixed(0)}" ry="${(c.h*.4).toFixed(0)}" fill="${col}"/>
      <ellipse cx="${(c.x+c.w*.25).toFixed(0)}" cy="${(c.y+c.h*.1).toFixed(0)}" rx="${(c.w*.26).toFixed(0)}" ry="${(c.h*.36).toFixed(0)}" fill="${col}"/>
    </g>`; }).join('');
}

// the sun and the moon, plus — during the fourth step only — the glow that says to take hold
function drawCelestial(){
  const n = N(), k = ps(), lit = STEPS[S.hint.step] === 'dusk' ? S.hint.k : 0;
  const boost = 1 + S.hint.flare*1.2;
  const breathe = .62 + .38*Math.sin(S.t*1.9);
  const sr = 42*k, held = S.drag && S.drag.what === 'sun';

  let s = '';
  if(n < .995){
    const ga = clamp(lit*breathe*boost*.95*CFG.scene.glowStrength, 0, 1);
    const grab = lit > .02
      ? `<circle cx="${S.sun.x.toFixed(1)}" cy="${S.sun.y.toFixed(1)}" r="${(sr*3.1).toFixed(0)}"
           fill="url(#sunGlow)" opacity="${ga.toFixed(3)}"/>
         <circle cx="${S.sun.x.toFixed(1)}" cy="${S.sun.y.toFixed(1)}" r="${(sr*1.62).toFixed(1)}"
           fill="none" stroke="var(--glow)" stroke-width="${(3 + S.hint.flare*2).toFixed(1)}"
           opacity="${(ga*.8).toFixed(3)}" filter="url(#soft)"/>
         <circle cx="${S.sun.x.toFixed(1)}" cy="${S.sun.y.toFixed(1)}" r="${(sr*1.62).toFixed(1)}"
           fill="none" stroke="var(--glow)" stroke-width="1.7" opacity="${(ga*.72).toFixed(3)}"/>` : '';
    const bob = held ? 0 : Math.sin(S.t*1.6)*4.5*lit;
    s += `${grab}
      <circle cx="${S.sun.x.toFixed(1)}" cy="${(S.sun.y+bob).toFixed(1)}" r="${(sr*1.5).toFixed(0)}" fill="#FFE9A0" opacity="${(.30*(1-n)).toFixed(2)}" filter="url(#soft)"/>
      <circle cx="${S.sun.x.toFixed(1)}" cy="${(S.sun.y+bob).toFixed(1)}" r="${sr.toFixed(0)}" fill="#FFF3B8" opacity="${(1-n*.6).toFixed(2)}"/>
      <circle cx="${S.sun.x.toFixed(1)}" cy="${(S.sun.y+bob).toFixed(1)}" r="${(sr*.66).toFixed(0)}" fill="#FFFAE0" opacity="${(1-n*.5).toFixed(2)}"/>`;
  }
  if(n > .05){
    const my = MOON.y + (1-n)*150;
    s += `<circle cx="${MOON.x}" cy="${my.toFixed(0)}" r="${(sr*2.3).toFixed(0)}" fill="url(#moonGlow)" opacity="${n.toFixed(2)}"/>
      <path d="M${MOON.x} ${(my-26*k).toFixed(1)} a${(26*k).toFixed(1)} ${(26*k).toFixed(1)} 0 1 0 ${(19*k).toFixed(1)} ${(46*k).toFixed(1)}
               a${(31*k).toFixed(1)} ${(31*k).toFixed(1)} 0 1 1 ${(-19*k).toFixed(1)} ${(-46*k).toFixed(1)} Z"
            fill="#F4F7FF" opacity="${n.toFixed(2)}"/>`;
  }
  $('celestial').innerHTML = s;
}

// ---- the field -------------------------------------------------------------
function conifer(t, fill, trunk){
  let s = `<rect x="${(t.x-2.2).toFixed(1)}" y="${(t.y-6).toFixed(1)}" width="4.4" height="10" fill="${trunk}"/>`;
  for(let i=0;i<3;i++){
    const u = i/2, base = t.y - t.h*(0.50 - u*0.50), hw = t.w*(0.40 + u*0.60)*0.5, top = base - t.h*0.44;
    s += `<path d="M${(t.x-hw).toFixed(1)} ${base.toFixed(1)} L${t.x.toFixed(1)} ${top.toFixed(1)} L${(t.x+hw).toFixed(1)} ${base.toFixed(1)} Z" fill="${fill}"/>`;
  }
  return s;
}

function drawField(){
  const n = N(), C = CFG.colors;
  const key = Math.round(n*24);

  $('groundTop').setAttribute('stop-color', mix(C.grassTop, C.grassNight, n));
  $('groundBot').setAttribute('stop-color', mix(C.grassLow, dark(C.grassNight, .14), n));
  $('ground').setAttribute('height', FLOOR - HORIZON + 10);

  once('hills', key, () => HILL.map(h =>
    `<ellipse cx="${h.x.toFixed(0)}" cy="${(h.y+h.ry*.52).toFixed(0)}" rx="${h.rx.toFixed(0)}" ry="${h.ry.toFixed(0)}"
       fill="${mix(C.hill, dark(C.grassNight,.3), n)}"/>`).join(''));

  once('treesFar', key, () => {
    const f = mix(C.treeFar, dark(C.grassNight,.38), n), tr = mix('#B98E72', dark(C.grassNight,.5), n);
    return TFAR.map(t => conifer(t, f, tr)).join('');
  });
  once('treesNear', key, () => {
    const f = mix(C.treeNear, dark(C.grassNight,.52), n), tr = mix('#9A6F57', dark(C.grassNight,.6), n);
    return TNEAR.map(t => conifer(t, f, tr)).join('');
  });

  once('decor', key + ':' + Math.round(CFG.scene.decor*10), () => {
    if(CFG.scene.decor <= 0) return '';
    const o = CFG.scene.decor;
    const bush   = mix('#79C08C', dark(C.grassNight,.42), n);
    const bushHi = mix('#96D3A1', dark(C.grassNight,.32), n);
    const blade  = mix('#6FB782', dark(C.grassNight,.3), n);
    const bark   = mix('#C08F6E', dark(C.grassNight,.42), n);
    const barkHi = mix('#DBB08D', dark(C.grassNight,.34), n);
    const petals = ['#FFF4F0', '#FFD9E2', '#FFF0B8'];
    let s = '';
    for(const b of BUSH) s += `<g opacity="${o}">
      <ellipse cx="${b.x.toFixed(0)}" cy="${(b.y+b.r*.42).toFixed(0)}" rx="${(b.r*1.1).toFixed(0)}" ry="${(b.r*.3).toFixed(0)}" fill="#000" opacity=".07"/>
      <circle cx="${(b.x-b.r*.5).toFixed(0)}" cy="${b.y.toFixed(0)}" r="${(b.r*.72).toFixed(0)}" fill="${bush}"/>
      <circle cx="${(b.x+b.r*.5).toFixed(0)}" cy="${(b.y+b.r*.1).toFixed(0)}" r="${(b.r*.66).toFixed(0)}" fill="${bush}"/>
      <circle cx="${b.x.toFixed(0)}" cy="${(b.y-b.r*.3).toFixed(0)}" r="${(b.r*.78).toFixed(0)}" fill="${bushHi}"/></g>`;
    for(const l of LOG){
      if(l.kind === 'log') s += `<g opacity="${o}">
        <ellipse cx="${l.x.toFixed(0)}" cy="${(l.y+9).toFixed(0)}" rx="${(l.w*.6).toFixed(0)}" ry="6" fill="#000" opacity=".08"/>
        <rect x="${(l.x-l.w*.5).toFixed(0)}" y="${(l.y-9).toFixed(0)}" width="${l.w}" height="18" rx="9" fill="${bark}"/>
        <ellipse cx="${(l.x-l.w*.5).toFixed(0)}" cy="${l.y.toFixed(0)}" rx="5" ry="9" fill="${barkHi}"/>
        <path d="M${(l.x-l.w*.2).toFixed(0)} ${(l.y-4).toFixed(0)} h${(l.w*.5).toFixed(0)} M${(l.x-l.w*.1).toFixed(0)} ${(l.y+3).toFixed(0)} h${(l.w*.4).toFixed(0)}"
              stroke="${barkHi}" stroke-width="1.6" opacity=".7" stroke-linecap="round"/></g>`;
      else s += `<g opacity="${o}">
        <ellipse cx="${l.x.toFixed(0)}" cy="${(l.y+11).toFixed(0)}" rx="${(l.w*.9).toFixed(0)}" ry="5" fill="#000" opacity=".08"/>
        <rect x="${(l.x-l.w*.5).toFixed(0)}" y="${(l.y-6).toFixed(0)}" width="${l.w}" height="17" rx="3" fill="${bark}"/>
        <ellipse cx="${l.x.toFixed(0)}" cy="${(l.y-6).toFixed(0)}" rx="${(l.w*.5).toFixed(0)}" ry="5" fill="${barkHi}"/>
        <ellipse cx="${l.x.toFixed(0)}" cy="${(l.y-6).toFixed(0)}" rx="${(l.w*.26).toFixed(0)}" ry="2.6" fill="none" stroke="${bark}" stroke-width="1.2" opacity=".6"/></g>`;
    }
    for(const t of TUFT) s += `<path d="M${t.x.toFixed(1)} ${t.y.toFixed(1)} q${(-3*t.s).toFixed(1)} ${(-7*t.s).toFixed(1)} ${(-1.5*t.s).toFixed(1)} ${(-10*t.s).toFixed(1)}
        M${t.x.toFixed(1)} ${t.y.toFixed(1)} q0 ${(-8*t.s).toFixed(1)} ${(1.5*t.s).toFixed(1)} ${(-12*t.s).toFixed(1)}
        M${t.x.toFixed(1)} ${t.y.toFixed(1)} q${(3*t.s).toFixed(1)} ${(-7*t.s).toFixed(1)} ${(4.5*t.s).toFixed(1)} ${(-9*t.s).toFixed(1)}"
        stroke="${blade}" stroke-width="${(1.7*t.s).toFixed(1)}" fill="none" stroke-linecap="round" opacity="${(o*.85).toFixed(2)}"/>`;
    for(const f of FLOW){ const col = mix(petals[Math.floor(f.h*3)%3], '#8FA4C8', n);
      s += `<g opacity="${o}"><path d="M${f.x.toFixed(0)} ${f.y.toFixed(0)} v-7" stroke="${blade}" stroke-width="1.3" stroke-linecap="round"/>
        <circle cx="${f.x.toFixed(0)}" cy="${(f.y-9).toFixed(0)}" r="3.1" fill="${col}"/>
        <circle cx="${f.x.toFixed(0)}" cy="${(f.y-9).toFixed(0)}" r="1.2" fill="${mix('#FFD17A','#C9B9E8',n)}"/></g>`; }
    return s;
  });
}

// ---- the basket and the dish ------------------------------------------------
function drawProps(){
  const n = N(), k = ps(), C = CFG.colors;
  const rx = 58*k, ry = 22*k;
  const basket = mix(C.bed, dark(C.bed,.5), n), cush = mix(C.cushion, dark(C.cushion,.55), n);
  const weave = mix(dark(C.bed,.22), dark(C.bed,.66), n);

  $('bedBack').innerHTML = `
    <ellipse cx="${BED.x}" cy="${(BED.y+ry*.72).toFixed(1)}" rx="${(rx*1.08).toFixed(1)}" ry="${(ry*.52).toFixed(1)}" fill="#000" opacity=".10"/>
    <path d="M${(BED.x-rx).toFixed(1)} ${BED.y} a${rx.toFixed(1)} ${ry.toFixed(1)} 0 0 1 ${(rx*2).toFixed(1)} 0 Z" fill="${basket}"/>
    <ellipse cx="${BED.x}" cy="${BED.y}" rx="${(rx*.9).toFixed(1)}" ry="${(ry*.68).toFixed(1)}" fill="${cush}"/>`;

  $('bedFront').innerHTML = `
    <path d="M${(BED.x-rx).toFixed(1)} ${BED.y} a${rx.toFixed(1)} ${(ry*1.25).toFixed(1)} 0 0 0 ${(rx*2).toFixed(1)} 0 Z" fill="${basket}"/>
    <path d="M${(BED.x-rx*.72).toFixed(1)} ${(BED.y+ry*.5).toFixed(1)} q${(rx*.72).toFixed(1)} ${(ry*.5).toFixed(1)} ${(rx*1.44).toFixed(1)} 0"
          fill="none" stroke="${weave}" stroke-width="${(2.2*k).toFixed(1)}" opacity=".55" stroke-linecap="round"/>
    <path d="M${(BED.x-rx*.4).toFixed(1)} ${(BED.y+ry*.08).toFixed(1)} l0 ${(ry*.9).toFixed(1)}
             M${BED.x} ${(BED.y+ry*.2).toFixed(1)} l0 ${(ry*1.0).toFixed(1)}
             M${(BED.x+rx*.4).toFixed(1)} ${(BED.y+ry*.08).toFixed(1)} l0 ${(ry*.9).toFixed(1)}"
          fill="none" stroke="${weave}" stroke-width="${(1.8*k).toFixed(1)}" opacity=".4" stroke-linecap="round"/>`;

  const dr = 30*k, dish = mix(C.dish, dark(C.dish,.56), n);
  $('dish').innerHTML = `
    <ellipse cx="${DISH.x}" cy="${(DISH.y+5*k).toFixed(1)}" rx="${(dr*1.05).toFixed(1)}" ry="${(dr*.34).toFixed(1)}" fill="#000" opacity=".10"/>
    <ellipse cx="${DISH.x}" cy="${DISH.y}" rx="${dr.toFixed(1)}" ry="${(dr*.38).toFixed(1)}" fill="${dish}"/>
    <ellipse cx="${DISH.x}" cy="${(DISH.y-1.5*k).toFixed(1)}" rx="${(dr*.72).toFixed(1)}" ry="${(dr*.26).toFixed(1)}"
             fill="${mix(dark(C.dish,.12), dark(C.dish,.66), n)}"/>`;
}

// ---- the cat ---------------------------------------------------------------
function bristles(x, y, k){
  if(k <= .03) return '';
  // one zigzag along her back rather than a row of separate lines: separate lines
  // read as a hairbrush standing beside her, a zigzag reads as her own fur lifting
  const n = 26, pts = [];
  for(let i=0;i<=n;i++){
    const a = Math.PI*(1.04 + i/n*0.94);
    const up = (i % 2) ? (7.5 + Math.sin(i*1.7)*3.2 + Math.sin(i*2.9 + S.t*15)*1.9) * k * CFG.cat.bristle : 0;
    pts.push(`${(x + 4 + Math.cos(a)*(52+up)).toFixed(1)} ${(y - 2 + Math.sin(a)*(25+up)).toFixed(1)}`);
  }
  return `<path d="M${pts.join(' L')}" fill="none" stroke="var(--cat)"
            stroke-width="${(3.2 + k*1.8).toFixed(1)}" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function drawCat(){
  const c = S.cat, k = c.puff, w = c.wake, sz = catScale(), n = N();
  const carried = S.drag && S.drag.what === 'cat' && S.drag.moved > 10;
  const tf = `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${(-c.face*sz).toFixed(3)} ${sz}) translate(${(-c.x).toFixed(1)} ${(-c.y).toFixed(1)})`;
  // a stroke runs a shiver of pleasure down her: she leans into the hand
  const purr = c.purr * Math.sin(S.t*22) * 1.6;
  const tfAll = `translate(${purr.toFixed(2)} 0) ${tf}`;
  $('catArt').setAttribute('transform', tfAll);
  $('zzz').setAttribute('transform', `translate(${purr.toFixed(2)} 0)`);
  $('catShadow').setAttribute('transform', tf);

  const x = c.x, arch = Math.sin(c.stretch*Math.PI)*11;
  const y = c.y + c.bob - k*9 - arch;
  const twitch = Math.max(0, Math.sin(S.t*0.7)*Math.sin(S.t*2.3) - .86) * 26;
  const ears = k*3 + twitch;
  const walking = S.mode === 'walk' || S.mode === 'run', eating = S.mode === 'eat';
  const sitting = !walking && !carried && !eating && w > .62 && k < .25;
  const upright = walking || carried || sitting;

  $('catShadow').innerHTML = `<ellipse cx="${x}" cy="${(c.y+22).toFixed(1)}"
      rx="${(upright?32:48)+k*8}" ry="8" fill="#000" opacity="${carried ? '.08' : (.20+n*.10).toFixed(2)}"/>`;

  let body, hx, hy;
  if(carried){
    const sw = Math.sin(S.t*3.4)*17;
    hx = x - 17; hy = y - 9 - w*6;
    body = `<path d="M${x+40} ${y+10} q${(24+sw).toFixed(1)} 8 ${(16+sw*.6).toFixed(1)} -18"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-26} ${y+16} l${(-6+Math.sin(S.t*6)*4).toFixed(1)} 21
               M${x-6} ${y+18} l${(2+Math.sin(S.t*6+2)*4).toFixed(1)} 23
               M${x+12} ${y+16} l${(6+Math.sin(S.t*6+4)*4).toFixed(1)} 21"
            stroke="var(--cat)" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M${x-48} ${y+14} q-6 -32 26 -38 q34 -6 48 14 q15 21 -6 28 q-34 10 -68 -4 Z" fill="var(--cat)"/>`;
  } else if(walking){
    hx = x - 4; hy = y - 34;
    body = `<path d="M${x+26} ${y-16} q22 ${(-10+Math.sin(S.t*5)*8).toFixed(1)} 16 -26"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-22} ${y-4} q-6 -34 14 -40 q26 -8 34 16 q6 22 -6 24 Z" fill="var(--cat)"/>
      <path d="M${x-14} ${y-6} l${(Math.sin(S.t*9)*6).toFixed(1)} 18
               M${x+2} ${y-6} l${(Math.sin(S.t*9+3)*6).toFixed(1)} 18"
            stroke="var(--cat)" stroke-width="5" stroke-linecap="round"/>`;
  } else if(eating){
    const nib = Math.sin(S.t*7.5)*2.2, tw = Math.sin(S.t*3.1)*7;
    hx = x - 30; hy = y - 7 + nib;
    body = `<path d="M${x+24} ${y+12} q${(26+tw).toFixed(1)} 5 ${(18+tw*.5).toFixed(1)} -13"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-34} ${y+16} q-7 -29 18 -34 q30 -6 38 14 q8 22 -8 24 Z" fill="var(--cat)"/>`;
  } else if(sitting){
    const tw = Math.sin(S.t*2.1)*9;
    hx = x - 4; hy = y - 36;
    body = `${bristles(x,y,k)}
      <path d="M${x+22} ${y+14} q${(28+tw).toFixed(1)} 7 ${(20+tw*.5).toFixed(1)} -15"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-24} ${y+16} q-6 -38 16 -44 q28 -8 36 18 q7 24 -7 26 Z" fill="var(--cat)"/>`;
  } else {
    const tail = Math.sin(S.t*(6+k*9))*(5+k*20);
    hx = x - 17; hy = y - 9 - w*6;
    body = `${bristles(x,y,k)}
      <path d="M${x+42} ${y+8} q${(26+tail*.4).toFixed(1)} ${(-6-k*16).toFixed(1)} ${(14+tail*.5).toFixed(1)} ${(-28-k*10).toFixed(1)}"
            fill="none" stroke="var(--cat)" stroke-width="${(7+k*3).toFixed(1)}" stroke-linecap="round"/>
      <path d="M${x-48} ${y+14} q-6 ${(-32-arch).toFixed(1)} 26 -38 q34 -6 48 14 q15 21 -6 28 q-34 10 -68 -4 Z" fill="var(--cat)"/>`;
  }

  const hr = (walking || sitting) ? 19 : (eating ? 17 : 18);
  const blink = Math.sin(S.t*0.83) > .988 || Math.sin(S.t*1.41 + 2) > .991;
  const open = (walking || sitting || eating || w > .3 || k > .25) && !(blink && k < .3);
  const eyeCol = '#eaf1ee';
  const two = walking || sitting;
  // while she is being stroked she shuts her eyes and enjoys it
  const bliss = c.purr > .25;
  const eye = (open && !bliss)
    ? `<circle cx="${hx-8}" cy="${hy-2}" r="${(2.4+k*2.2).toFixed(1)}" fill="${eyeCol}"/>${two?`<circle cx="${hx+8}" cy="${hy-2}" r="2.4" fill="${eyeCol}"/>`:''}`
    : `<path d="M${hx-13} ${hy-1} q5 ${bliss?-4:4} 10 0" fill="none" stroke="${eyeCol}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>${
        two?`<path d="M${hx+3} ${hy-1} q5 ${bliss?-4:4} 10 0" fill="none" stroke="${eyeCol}" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>`:''}`;

  const wfan = (side, len) => `
      <path d="M${(hx+side*4).toFixed(1)} ${(hy+6).toFixed(1)} q${(side*len*.5).toFixed(1)} ${(-3-k*5).toFixed(1)} ${(side*len).toFixed(1)} ${(-7-k*9).toFixed(1)}"/>
      <path d="M${(hx+side*5).toFixed(1)} ${(hy+9).toFixed(1)} q${(side*len*.52).toFixed(1)} 1 ${(side*len*1.04).toFixed(1)} ${(1+k*1).toFixed(1)}"/>
      <path d="M${(hx+side*4).toFixed(1)} ${(hy+12).toFixed(1)} q${(side*len*.5).toFixed(1)} ${(4+k*3).toFixed(1)} ${(side*len).toFixed(1)} ${(9+k*7).toFixed(1)}"/>`;
  const whiskers = `<g fill="none" stroke="${mix('#3D4A4F','#cfdcd7',n)}" stroke-width="1.15" stroke-linecap="round"
      opacity="${(.5+k*.4).toFixed(2)}">${wfan(-1, 15+k*6)}${wfan(1, 15+k*6)}</g>`;

  $('catArt').innerHTML = `${body}
    <circle cx="${hx}" cy="${hy}" r="${hr}" fill="var(--cat)"/>
    <path d="M${hx-15} ${hy-11} l${(-3+ears).toFixed(1)} ${(-15+ears*2.1).toFixed(1)} l15 6 Z" fill="var(--cat)"/>
    <path d="M${hx+10} ${hy-14} l${(6-ears).toFixed(1)} ${(-14+ears*2.1).toFixed(1)} l9 10 Z" fill="var(--cat)"/>
    ${eye}
    <path d="M${hx} ${hy+6} l-3 3 l3 2 l3 -2 Z" fill="${eyeCol}" opacity=".75"/>
    ${whiskers}`;

  if(!carried && S.mode === 'rest' && w < .12 && k < .1){
    let z = '';
    for(let i=0;i<3;i++){ const p = ((S.t*.35 + i*.33) % 1);
      z += `<text x="${(x+46*sz+p*26).toFixed(0)}" y="${(y-54-p*62).toFixed(0)}" font-family="Fraunces, Georgia, serif"
              font-size="${13+i*5}" font-style="italic" fill="${mix('#33514a','#d8e4e0',n)}"
              opacity="${((1-p)*.6).toFixed(2)}">z</text>`; }
    $('zzz').innerHTML = z;
  } else $('zzz').innerHTML = '';
}

// ---- the fish --------------------------------------------------------------
const fishShown = () => STEPS[S.hint.step] === 'feed' || (S.fish.inDish && !S.fishEaten);

function drawFish(){
  const f = S.fish, k = ps();
  if(!fishShown() || f.left <= .02){ $('fish').innerHTML = ''; return; }
  const held = S.drag && S.drag.what === 'fish';
  const wob = held ? Math.sin(S.t*9)*7 : Math.sin(S.t*1.6)*2.2;
  const lift = held ? -6 : 0;
  $('fish').innerHTML = `
    <ellipse cx="${f.x.toFixed(1)}" cy="${(f.y+13).toFixed(1)}" rx="${(24*k).toFixed(1)}" ry="${(6*k).toFixed(1)}" fill="#000" opacity="${held ? '.14' : '.10'}"/>
    <g transform="translate(${f.x.toFixed(1)} ${(f.y+lift).toFixed(1)}) rotate(${wob.toFixed(1)}) scale(${((.95+f.left*.5)*k).toFixed(2)})">
      <path d="M-17 0 q10 -14 23 0 q-13 14 -23 0 Z" fill="${CFG.colors.fish}"/>
      <path d="M-17 0 l-13 -10 v20 Z" fill="${CFG.colors.fish}" opacity=".8"/>
      <path d="M-6 -5 q8 -4 13 1" fill="none" stroke="#FFD9A8" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      <circle cx="0" cy="-2" r="1.9" fill="var(--cat)"/>
    </g>`;
}

// ---- the sequence ----------------------------------------------------------
// out -> feed -> groom -> dusk -> bed -> done.  Exactly one object answers at a time.
const STEPS = ['out', 'feed', 'groom', 'dusk', 'bed', 'done'];
const WANT  = { out: 'cat', feed: 'fish', groom: 'cat', dusk: 'sun', bed: 'cat' };

// what is lit, and where it should go. the bright one is what to take hold of;
// the faint one is where to put it. groom has no destination, so it has only the one.
function hintTargets(){
  const c = S.cat, f = S.fish, k = ps();
  switch(STEPS[S.hint.step]){
    case 'out':   return { grab: { x: BED.x, y: BED.y + 10, r: 118*k }, drop: { x: OUT.x,  y: OUT.y,  r: 82*k } };
    case 'feed':  return { grab: { x: f.x, y: f.y + 10, r: 72*k },  drop: { x: DISH.x, y: DISH.y, r: 66*k } };
    case 'groom': return { grab: { x: c.x, y: c.y + 20, r: 102*k }, drop: null };
    case 'dusk':  return { grab: null, drop: { x: SLOT.x, y: SLOT.y + 8, r: 86*k } };   // the sun's own glow is drawn in the sky
    case 'bed':   return { grab: { x: c.x, y: c.y + 20, r: 102*k }, drop: { x: BED.x, y: BED.y + 8, r: 104*k } };
    default:      return { grab: null, drop: null };
  }
}

function advance(){
  S.hint.step = Math.min(S.hint.step + 1, STEPS.length - 1);
  S.hint.k = 0; S.hint.ping = 0; S.hint.flare = 0; S.idle = 0;
}

function hintThink(dt){
  const h = S.hint, step = STEPS[h.step];

  // completions that happen on their own, rather than on release
  if(step === 'feed' && S.fishEaten) advance();
  else if(step === 'groom' && S.strokes >= CFG.cat.strokes) advance();
  else if(step === 'dusk' && S.sun.set && S.night > .97) advance();

  const want = (S.idle > CFG.scene.hintWait && step !== 'done') ? 1 : 0;
  h.k += (want - h.k) * Math.min(1, dt * (want ? 1.5 : 3.4));
  h.flare = Math.max(0, h.flare - dt*1.5);

  if(h.k > .5){
    h.ping += dt;
    if(h.ping > 2.1){ h.ping = 0;
      const t = hintTargets();
      if(t.drop) PING.push({ x: t.drop.x, y: t.drop.y, a: 0 });
    }
  }
}

function allows(what){ return WANT[STEPS[S.hint.step]] === what; }

// touching the wrong thing is never an error: the current suggestion simply comes up louder
function reject(){
  S.hint.flare = 1;
  S.hint.k = Math.max(S.hint.k, .62);
  S.idle = CFG.scene.hintWait + 1;
  const t = hintTargets();
  if(t.drop){ S.hint.ping = 0; PING.push({ x: t.drop.x, y: t.drop.y, a: 0 }); }
}

function drawHint(){
  const h = S.hint, t = hintTargets();
  const breathe = .60 + .40*Math.sin(S.t*1.9);
  const boost = (1 + h.flare*1.25) * CFG.scene.glowStrength;
  let s = '';
  // a wash of warm light alone disappears on pale grass, so every suggestion is a pool
  // with a rim: the pool says "warm here", the rim draws the eye to an actual edge
  const pool = (p, strength) => {
    const a = clamp(h.k * breathe * strength * boost, 0, 1);
    if(a < .01) return '';
    const rr = p.r*0.66;
    return `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${(p.r*1.15).toFixed(1)}" ry="${(p.r*0.48).toFixed(1)}"
              fill="url(#glowPool)" opacity="${a.toFixed(3)}"/>
            <ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*0.42).toFixed(1)}"
              fill="none" stroke="var(--glow)" stroke-width="${(2.6+h.flare*2).toFixed(1)}"
              opacity="${(a*.85).toFixed(3)}" filter="url(#soft)"/>
            <ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="${rr.toFixed(1)}" ry="${(rr*0.42).toFixed(1)}"
              fill="none" stroke="var(--glow)" stroke-width="1.6" opacity="${(a*.7).toFixed(3)}"/>`;
  };
  if(t.drop) s += pool(t.drop, STEPS[h.step] === 'dusk' ? 1.05 : .62);   // where it goes: quieter
  if(t.grab) s += pool(t.grab, 1.0);        // what to take: louder
  $('hintG').innerHTML = s;

  // a ring opening out of the destination, so a still picture still says "here"
  $('ping').innerHTML = PING.map(q =>
    `<ellipse cx="${q.x.toFixed(0)}" cy="${q.y.toFixed(0)}" rx="${(14+q.a*62).toFixed(0)}" ry="${(5+q.a*26).toFixed(0)}"
       fill="none" stroke="var(--glow)" stroke-width="${(2.6*(1-q.a)+.6).toFixed(1)}"
       opacity="${((1-q.a)*.62*boost).toFixed(2)}"/>`).join('');

  $('sparkle').innerHTML = SPARK.map(k =>
    `<g transform="translate(${k.x.toFixed(1)} ${(k.y - k.a*44).toFixed(1)}) scale(${(1-k.a*.4).toFixed(2)})" opacity="${((1-k.a)*.9).toFixed(2)}">
       <path d="M0 -6 L1.6 -1.6 L6 0 L1.6 1.6 L0 6 L-1.6 1.6 L-6 0 L-1.6 -1.6 Z" fill="var(--glow)"/></g>`).join('');
}

// ---- the five dots ----------------------------------------------------------
function drawDots(){
  const n = N(), total = STEPS.length - 1, done = S.hint.step;
  const on = mix('#2E3D55', '#F4F8FF', n), off = mix('#2E3D55', '#F4F8FF', n);
  const gap = 15, x0 = W/2 - (total-1)*gap/2;
  let s = '';
  for(let i=0;i<total;i++){
    const isDone = i < done, isNow = i === done;
    const pulse = isNow ? .58 + .34*Math.sin(S.t*2.4) : 0;
    s += `<circle cx="${(x0+i*gap).toFixed(1)}" cy="34" r="${(isNow ? 4.6 : 4).toFixed(1)}"
            fill="${isDone ? on : off}" opacity="${(isDone ? .92 : isNow ? pulse : .24).toFixed(2)}"/>`;
  }
  $('dots').innerHTML = s;
}

// ---- motion ----------------------------------------------------------------
function think(dt){
  const c = S.cat, M = CFG.motion, step = STEPS[S.hint.step];
  S.idle += dt;
  const dragging = !!S.drag;
  if(dragging) S.idle = 0;

  // the sun: held, it drags the daylight down with it; let go anywhere but the notch
  // and it simply floats back up, and the morning comes back with it
  if(S.drag && S.drag.what === 'sun'){
    S.night = clamp((S.sun.y - SUN0.y) / Math.max(40, SLOT.y - SUN0.y), 0, 1) * .93;
  } else if(S.sun.set){
    S.sun.y = lerp(S.sun.y, SLOT.y + 30, Math.min(1, dt*2.2));
    S.sun.x = lerp(S.sun.x, SLOT.x, Math.min(1, dt*2.2));
    S.night = clamp(S.night + dt*M.duskSpeed, 0, 1);
  } else if(step === 'dusk'){
    // let go anywhere but the notch and it floats back up, and the morning comes back with it
    S.sun.x = lerp(S.sun.x, SUN0.x, Math.min(1, dt*1.8));
    S.sun.y = lerp(S.sun.y, SUN0.y, Math.min(1, dt*1.8));
    S.night = clamp(S.night - dt*1.1, 0, 1);
  }

  // she goes for the fish once it is actually in the dish
  if(S.fish.inDish && !S.fishEaten && S.mode !== 'eat' && !dragging){
    const side = S.fish.x > W*0.5 ? -1 : 1;
    S.mode = 'run';
    S.target = { x: clamp(S.fish.x + side*62*catScale(), PEN.x0, PEN.x1),
                 y: clamp(S.fish.y - 6, PEN.y0, PEN.y1) };
  }

  if((S.mode === 'walk' || S.mode === 'run') && S.target){
    const dx = S.target.x - c.x, dy = S.target.y - c.y, dd = Math.hypot(dx, dy);
    if(S.mode === 'run' && S.fish.inDish) c.face = S.fish.x < c.x ? -1 : 1;
    else if(dd > 4) c.face = dx < 0 ? -1 : 1;
    if(dd < 6){
      S.mode = (S.fish.inDish && S.fish.left > .02) ? 'eat' : 'rest';
      if(S.mode === 'eat') c.face = S.fish.x < c.x ? -1 : 1;
      S.eat = CFG.cat.appetite; S.target = null; if(S.mode === 'rest') c.stretch = 1;
    } else { const v = (S.mode === 'run' ? M.runSpeed : M.walkSpeed)*dt; c.x += dx/dd*v; c.y += dy/dd*v; }
  }

  if(S.mode === 'eat'){
    S.eat -= dt;
    S.fish.left = clamp(S.eat / CFG.cat.appetite, 0, 1);
    if(S.eat <= 0){
      S.fish.left = 0; S.fishEaten = true; S.mode = 'rest'; c.stretch = 1;
      c.puff = 1;                                     // full, pleased, and standing on end
    }
  }

  // the sequence owns her sleep: down before it starts, up while it runs, down at the end
  const busy = dragging || S.mode !== 'rest' || c.puff > .3;
  const awake = step === 'out' ? busy : (step === 'done' ? false : true);
  c.wake = awake ? clamp(c.wake + dt*M.wakeSpeed, 0, 1) : clamp(c.wake - dt*M.sleepSpeed, 0, 1);

  // her fur only comes down by hand. before the grooming step it settles by itself.
  if(step === 'groom') c.puff = lerp(c.puff, 1 - S.strokes/CFG.cat.strokes, Math.min(1, dt*7));
  else if(!dragging) c.puff = clamp(c.puff - dt*2.4, 0, 1);

  c.purr = Math.max(0, c.purr - dt*1.9);
  if(c.stretch > 0 && !dragging) c.stretch = Math.max(0, c.stretch - dt*2.4);
  c.bob = Math.sin(S.t * (c.wake > .5 ? 3.2 : 1.1)) * (c.wake > .5 ? 1.4 : 2.6);

  for(const cl of CLOUD){ cl.x += cl.v*dt*CFG.scene.cloud; if(cl.x - cl.w > W) cl.x = -cl.w; }
  for(let i=PING.length-1;i>=0;i--){ PING[i].a += dt*1.5; if(PING[i].a >= 1) PING.splice(i,1); }
  for(let i=SPARK.length-1;i>=0;i--){ SPARK[i].a += dt*1.3; if(SPARK[i].a >= 1) SPARK.splice(i,1); }
}

// ---- input -----------------------------------------------------------------
const near = (p, o, r) => Math.hypot(p.x - o.x, p.y - o.y) < r;
const onCat  = p => Math.hypot(p.x - S.cat.x, (p.y - S.cat.y)*1.25) < 62*catScale();
const onFish = p => fishShown() && S.fish.left > .02 && near(p, S.fish, 46*ps());
const onSun  = p => S.night < .99 && near(p, S.sun, 58*ps());
const hideTitle = () => { if(!S.touched){ S.touched = true; $('titleG').classList.add('gone'); } };

function stroke(){
  const c = S.cat;
  S.strokes = Math.min(CFG.cat.strokes, S.strokes + 1);
  c.purr = 1; S.idle = 0;
  for(let i=0;i<5;i++) SPARK.push({ x: c.x + rnd(-42,42), y: c.y - rnd(4,30), a: rnd(0,.25) });
}

svg.addEventListener('pointerdown', e => {
  const p = toSvg(e); hideTitle();
  const step = STEPS[S.hint.step];

  // it is over: once she has settled again, a touch anywhere starts the whole thing afresh
  if(step === 'done'){ if(S.cat.wake < .05) window.CATP.reset(); return; }

  // the grooming step is the one tap in the piece — five of them, and her fur lies flat
  if(step === 'groom'){ if(onCat(p)) stroke(); else reject(); return; }

  const hit = onSun(p) ? 'sun' : onFish(p) ? 'fish' : onCat(p) ? 'cat' : null;
  if(!hit || !allows(hit)) return reject();

  const o = hit === 'cat' ? S.cat : hit === 'fish' ? S.fish : S.sun;
  if(hit === 'cat'){ S.cat.puff = Math.min(1, S.cat.puff + .9); S.mode = 'held'; S.target = null; }
  if(hit === 'fish'){ S.fish.inDish = false; }
  if(hit === 'sun'){ S.sun.set = false; }
  S.drag = { what: hit, dx: o.x - p.x, dy: o.y - p.y, moved: 0 };
  S.idle = 0;
  svg.setPointerCapture(e.pointerId);
});

svg.addEventListener('pointermove', e => {
  if(!S.drag) return;
  const p = toSvg(e), d = S.drag;
  const nx = p.x + d.dx, ny = p.y + d.dy;
  if(d.what === 'cat'){
    const cx = clamp(nx, PEN.x0, PEN.x1), cy = clamp(ny, PEN.y0, PEN.y1);
    d.moved += Math.hypot(cx - S.cat.x, cy - S.cat.y);
    if(Math.abs(cx - S.cat.x) > 1.2) S.cat.face = cx < S.cat.x ? -1 : 1;
    S.cat.x = cx; S.cat.y = cy;
    if(d.moved > 14) S.cat.puff = Math.min(S.cat.puff, .35);
  } else if(d.what === 'fish'){
    d.moved += 1;
    S.fish.x = clamp(nx, 26, W-26); S.fish.y = clamp(ny, HORIZON + 40, FLOOR - 22);
  } else {
    d.moved += 1;
    S.sun.x = clamp(nx, 40, W-40); S.sun.y = clamp(ny, 90, SLOT.y + 24);
  }
  S.idle = 0;
});

function release(){
  if(!S.drag) return;
  const what = S.drag.what, k = ps();
  S.drag = null;
  const step = STEPS[S.hint.step];

  if(what === 'cat'){
    S.mode = 'rest'; S.cat.stretch = 1; S.idle = 0;
    const d = Math.hypot(S.cat.x - BED.x, S.cat.y - (BED.y - 12));
    if(step === 'out'){
      S.inBed = d < 70*k;
      if(!S.inBed) advance();                       // out of the basket, however far — that is the step
    } else if(step === 'bed'){
      if(d < 78*k){                                  // close enough counts: she curls up in it herself
        S.cat.x = BED.x; S.cat.y = BED.y - 12; S.cat.face = 1;
        S.inBed = true; S.mode = 'rest'; S.cat.stretch = 0; S.cat.puff = 0;
        advance();
      }
    }
  } else if(what === 'fish'){
    if(step === 'feed' && Math.hypot(S.fish.x - DISH.x, S.fish.y - DISH.y) < 52*k){
      S.fish.x = DISH.x; S.fish.y = DISH.y - 4; S.fish.inDish = true; S.idle = 0;
    }
  } else if(what === 'sun'){
    if(step === 'dusk' && Math.hypot(S.sun.x - SLOT.x, S.sun.y - SLOT.y) < 84*k){
      S.sun.set = true; S.idle = 0;
    }
  }
}
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('resize', layout);

// ---- loop ------------------------------------------------------------------
function applyColors(){
  const r = document.documentElement.style;
  r.setProperty('--cat', CFG.colors.cat);
  r.setProperty('--glow', CFG.colors.glow);
  r.setProperty('--fish', CFG.colors.fish);
}

let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  S.t += dt;
  think(dt); hintThink(dt);
  applyColors();
  drawSky(); drawCelestial(); drawField(); drawProps();
  drawHint(); drawFish(); drawCat(); drawDots();
  $('grainLayer').setAttribute('opacity', CFG.scene.grain);
  requestAnimationFrame(frame);
}
layout();
requestAnimationFrame(frame);

window.CAT  = () => S;
window.CATP = {
  skip: () => advance(),
  CFG, applyColors, relayout: layout,
  step: () => STEPS[S.hint.step],
  bed: () => BED, dish: () => DISH, slot: () => SLOT, sun0: () => SUN0, out: () => OUT,
  fish: () => S.fish, cat: () => S.cat,
  reset(){
    Object.assign(S.cat, { x: BED.x, y: BED.y - 12, wake: 0, puff: 0, stretch: 0, face: 1, purr: 0 });
    Object.assign(S.sun, { x: SUN0.x, y: SUN0.y, set: false });
    Object.assign(S.fish, { x: FISH0.x, y: FISH0.y, inDish: false, left: 1 });
    S.night = 0; S.fishEaten = false; S.strokes = 0; S.inBed = true;
    S.mode = 'rest'; S.target = null; S.drag = null; S.eat = 0; S.idle = 999;
    S.touched = false; $('titleG').classList.remove('gone');
    S.hint = { step: 0, k: 0, ping: 0, flare: 0 };
    PING.length = 0; SPARK.length = 0;
  }
};
})();
