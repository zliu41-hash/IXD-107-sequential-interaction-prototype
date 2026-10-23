/* Cat Naps — Night Shift
   One wet street filling the screen. She sleeps through the daylight and is up all night.
     touch her        -> she startles awake and her fur stands on end
     carry her        -> let go anywhere and she stretches once, then settles there
     put a fish down  -> she walks over, eats, and goes back to what the hour asks of her
   Nothing completes, nothing fails, and the sun and moon keep going on their own. */
(() => {
'use strict';

const CFG = JSON.parse(JSON.stringify(window.CAT_DEFAULTS));
const $   = id => document.getElementById(id);
const svg = $('stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp  = (a,b,k) => a + (b-a)*k;
const rnd   = (a,b) => a + Math.random()*(b-a);
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
                     return p.matrixTransform(svg.getScreenCTM().inverse()); };

const hex  = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const rgb  = a => `rgb(${a.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
const mixA = (a,b,k) => { const A=hex(a), B=hex(b); return [lerp(A[0],B[0],k), lerp(A[1],B[1],k), lerp(A[2],B[2],k)]; };
const mix  = (a,b,k) => rgb(mixA(a,b,k));
const burn = (base, warm, k) => { const Wc = hex(warm); return rgb(base.map((v,i)=>lerp(v, Wc[i], k))); };
const blend = (A,B,k) => A.map((v,i)=>lerp(v, B[i], k));
const PAL = { road: [20,34,42], sky: [11,26,36] };

// ---- the world, sized to whatever window it lands in -----------------------
const KERB = 470, FLOOR = 844;
let W = 390;                                   // design width; height is always 844
let LAMP = { post: 300, head: 266, top: 292, base: 476 };
let PEN  = { x0: 50, x1: 340, y0: 520, y1: 772 };
let TRAY = { x: 268, y: 736 };
let STARS = [], FAR = [], NEAR = [], RAIN = [], PUDDLE = [], CLOUD = [];
const SPLASH = [], PING = [];

function buildWorld(){
  LAMP = { post: Math.round(W*0.78), head: Math.round(W*0.78) - 34, top: 292, base: 476 };
  PEN  = { x0: 54, x1: W - 54, y0: 520, y1: 778 };
  TRAY = { x: W - 122, y: 736 };   // far enough in that she is never cut off while she eats

  STARS = [];
  for(let i=0;i<Math.round(W/11);i++) STARS.push({ x: rnd(6,W-6), y: rnd(26,430), r: rnd(.6,1.7), p: rnd(0,7) });

  // two rows of rooftops: the far one hazy, the near one a hard silhouette
  FAR = []; let x = -40;
  while(x < W + 40){ const w = rnd(46,104), h = rnd(96,208); FAR.push([x, KERB-26-h, w, h]); x += w + rnd(2,16); }
  NEAR = []; x = -30;
  while(x < W + 30){ const w = rnd(54,120), h = rnd(70,186); NEAR.push([x, KERB-h, w, h]); x += w + rnd(1,10); }

  RAIN = [];
  for(let i=0;i<Math.round(W/7);i++) RAIN.push({ x: rnd(0,W), y: rnd(0,FLOOR), v: rnd(340,620), l: rnd(10,26) });

  PUDDLE = [];
  for(let i=0;i<Math.round(W/150)+4;i++){
    const py = rnd(KERB+40, FLOOR-20);
    PUDDLE.push({ x: rnd(20,W-20), y: py, rx: rnd(26,78), ry: rnd(4,11) });
  }

  CLOUD = [];
  for(let i=0;i<5;i++) CLOUD.push({ x: rnd(-200,W), y: rnd(60,330), w: rnd(180,420), h: rnd(34,78), v: rnd(3,9), o: rnd(.25,.6) });
}

function layout(){
  const r = (innerWidth || 390) / (innerHeight || 844);
  W = clamp(Math.round(844 * r), 360, 2400);
  svg.setAttribute('viewBox', `0 0 ${W} ${FLOOR}`);
  $('roadClipRect').setAttribute('width', W);
  buildWorld();
  S.cat.x = clamp(S.cat.x, PEN.x0, PEN.x1);
  S.fish.x = clamp(S.fish.x, 30, W-30);
  cache.key = {};                                // force every cached layer to redraw
}

// ---- state -----------------------------------------------------------------
const S = {
  t: 0, day: 0.60,                               // 0 dawn · .25 noon · .5 dusk · .75 midnight
  cat: { x: 200, y: 648, wake: 0, puff: 0, stretch: 0, face: -1, bob: 0 },
  held: false, carrying: false, grabDX: 0, grabDY: 0, moved: 0,
  fish: { out: false, held: false, x: 268, y: 736, left: 1 },
  mode: 'rest', target: null, eat: 0, idle: 999, trayIn: 0, win: 0,   // idle starts high: she begins asleep
  drowsy: 1, touched: false, flick: 1
};
const cache = { key: {}, html: {} };
const once = (slot, key, make) => { if(cache.key[slot] !== key){ cache.key[slot] = key; $(slot).innerHTML = make(); } };

const daylight = () => clamp(Math.sin(S.day * Math.PI * 2) * 2.1 + 0.08, 0, 1);
const duskAmt  = () => { const d = daylight(); return clamp(1 - Math.abs(d - 0.40) / 0.40, 0, 1); };

// ---- sky -------------------------------------------------------------------
function drawSky(d, dusk){
  const C = CFG.colors, night = 1 - d;

  const top = mixA(C.skyNight, C.skyDay, d*0.58);
  const mid = mixA(C.skyNight, C.skyDay, d);
  const low = mixA(C.skyNight, C.skyDay, Math.min(1, d*1.32));
  $('skyTop').setAttribute('stop-color', burn(top, C.dusk, dusk*0.07));
  $('skyMid').setAttribute('stop-color', burn(mid, C.dusk, dusk*0.40));
  $('skyLow').setAttribute('stop-color', burn(low, C.dusk, dusk*0.82));
  PAL.sky  = mixA(C.skyNight, C.skyDay, d);
  PAL.road = hex(burn(mixA(C.roadNight, C.roadDay, d), C.dusk, dusk*0.22).replace(/rgb\((\d+),(\d+),(\d+)\)/, (m,r,g,b)=>'#'+[r,g,b].map(v=>(+v).toString(16).padStart(2,'0')).join('')));
  $('roadTop').setAttribute('stop-color', rgb(PAL.road.map(v=>v*0.82)));
  $('roadBot').setAttribute('stop-color', rgb(PAL.road));

  // the band of haze that pushes the far rooftops back
  const hz = burn(mixA(C.skyNight, C.skyDay, Math.min(1, d*1.2)), C.dusk, dusk*.6);
  $('hazeA').setAttribute('stop-color', hz); $('hazeA').setAttribute('stop-opacity', 0);
  $('hazeB').setAttribute('stop-color', hz); $('hazeB').setAttribute('stop-opacity', (0.78*CFG.scene.depth).toFixed(2));

  once('stars', `${W}|${Math.round(night*18)}`, () => night < .2 ? '' : STARS.map(s =>
    `<circle cx="${s.x.toFixed(0)}" cy="${s.y.toFixed(0)}" r="${s.r.toFixed(1)}" fill="#fff"
       opacity="${(((night-.2)/.8)*.85).toFixed(2)}"/>`).join(''));

  // one arc: the sun leads, the moon follows
  const u = S.day % 1, up = u < .5 ? u*2 : (u-.5)*2, isSun = u < .5;
  const cx = W*0.07 + W*0.86*up, cy = 320 - Math.sin(up*Math.PI)*196;
  $('celestial').innerHTML = isSun
    ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(120+dusk*60).toFixed(0)}" fill="url(#halo)" opacity="${(0.16+dusk*0.6).toFixed(2)}"/>
       <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="30" fill="${burn(hex('#fff7e6'), CFG.colors.dusk, dusk*0.85)}"/>`
    : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="86" fill="#dce9f2" opacity="${(night*.05).toFixed(2)}" filter="url(#cloudy)"/>
       <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="27" fill="#eef3f7"/>
       <circle cx="${(cx+12).toFixed(1)}" cy="${(cy-8).toFixed(1)}" r="23"
         fill="${burn(mixA(CFG.colors.skyNight, CFG.colors.skyDay, d), CFG.colors.dusk, dusk*0.5)}"/>`;

  $('clouds').innerHTML = CFG.scene.cloud <= 0 ? '' : CLOUD.map(c =>
    `<ellipse cx="${c.x.toFixed(0)}" cy="${c.y.toFixed(0)}" rx="${c.w/2}" ry="${c.h/2}" filter="url(#cloudy)"
       fill="${burn(mixA('#1b2a36','#f2f6f4', d), CFG.colors.dusk, dusk*.55)}"
       opacity="${(c.o*CFG.scene.cloud*(0.3+d*0.5)).toFixed(2)}"/>`).join('');

  const farCol  = burn(mixA('#16252f','#9db3ae', d*.5), CFG.colors.dusk, dusk*.34);
  const nearCol = burn(mixA('#030b11','#4a615d', d*.6),  CFG.colors.dusk, dusk*.22);
  const sig = `${W}|${Math.round(d*26)}|${Math.round(dusk*16)}|${Math.floor(S.win/3.5)}`;
  once('skylineFar',  sig, () => FAR.map(b => `<rect x="${b[0].toFixed(0)}" y="${b[1].toFixed(0)}" width="${b[2].toFixed(0)}" height="${b[3].toFixed(0)}" fill="${farCol}"/>`).join(''));
  once('skylineNear', sig, () => NEAR.map(b => {
    let w = '';
    for(let r=0;r<Math.floor(b[3]/36);r++) for(let q=0;q<Math.floor(b[2]/28);q++){
      const seed = (r*7 + q*13 + Math.round(b[0]));
      const lit = ((seed + Math.floor(S.win/3.5) * ((seed % 3) === 0 ? 1 : 0)) % 5) < 2;
      w += `<rect x="${(b[0]+9+q*28).toFixed(0)}" y="${(b[1]+16+r*36).toFixed(0)}" width="9" height="13"
             fill="${CFG.colors.sodium}" opacity="${(lit ? (1-d)*.82 : (1-d)*.08).toFixed(2)}"/>`;
    }
    return `<rect x="${b[0].toFixed(0)}" y="${b[1].toFixed(0)}" width="${b[2].toFixed(0)}" height="${b[3].toFixed(0)}" fill="${nearCol}"/>
      <rect x="${b[0].toFixed(0)}" y="${b[1].toFixed(0)}" width="${b[2].toFixed(0)}" height="3"
        fill="${burn(mixA('#2c3c42','#e6efec', d), CFG.colors.dusk, dusk*.7)}" opacity="${(.2+d*.5).toFixed(2)}"/>${w}`;
  }).join(''));
}

// ---- street ----------------------------------------------------------------
function drawStreet(d, dusk){
  const night = 1 - d, lamp = clamp(night*1.55, 0, 1) * S.flick, C = CFG.colors;
  const sway = Math.sin(S.t*0.55)*2.6 + Math.sin(S.t*1.6)*1.1;   // the lamp is on a pole, and it is windy

  once('paving', `${W}|${Math.round(d*18)}`, () => {
    let k = `<rect x="0" y="${KERB}" width="${W}" height="54" fill="#000" opacity="${(.12+d*.12).toFixed(2)}" filter="url(#soft)"/>
      <rect x="0" y="${KERB}" width="${W}" height="9" fill="${mix(C.roadDay,'#ffffff',.3)}" opacity="${(.14+d*.3).toFixed(2)}"/>
      <line x1="0" y1="${KERB}" x2="${W}" y2="${KERB}" stroke="${mix(C.roadDay,'#ffffff',.55)}" stroke-width="2" opacity="${(.3+d*.45).toFixed(2)}"/>
      <line x1="0" y1="${KERB+9}" x2="${W}" y2="${KERB+9}" stroke="#000" stroke-width="2" opacity="${(.3+(1-d)*.25).toFixed(2)}"/>`;
    for(let y = KERB+96; y < FLOOR; y += 96)
      k += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="#fff" stroke-width="1" opacity="${(.05+d*.07).toFixed(2)}"/>`;
    for(let x = 56; x < W; x += 108)
      k += `<line x1="${x}" y1="${KERB}" x2="${x}" y2="${FLOOR}" stroke="#fff" stroke-width="1" opacity="${(.04+d*.06).toFixed(2)}"/>`;
    return k;
  });

  once('puddles', `${W}|${Math.round(d*18)}|${Math.round(lamp*12)}|${Math.round(CFG.scene.reflection*20)}`, () =>
    PUDDLE.map(p => {
      const near = clamp(1 - Math.abs(p.x - LAMP.head)/360, 0, 1) * lamp;
      return `<ellipse cx="${p.x.toFixed(0)}" cy="${p.y.toFixed(0)}" rx="${p.rx}" ry="${p.ry}"
        fill="${rgb(blend(PAL.road, PAL.sky, .62))}"
        opacity="${(.5 + CFG.scene.reflection*.4).toFixed(2)}" filter="url(#wet)"/>
      <ellipse cx="${(p.x + p.rx*.2).toFixed(0)}" cy="${p.y.toFixed(0)}" rx="${(p.rx*.5).toFixed(0)}" ry="${(p.ry*.5).toFixed(1)}"
        fill="${C.sodium}" opacity="${(near*.42).toFixed(2)}" filter="url(#wet)"/>`;
    }).join(''));

  // a faint sheen along the near edge, so the foreground is wet rather than empty
  once('sheen', `${W}|${Math.round(d*18)}|${Math.round(lamp*10)}`, () =>
    `<rect x="0" y="${FLOOR-230}" width="${W}" height="230"
       fill="${rgb(blend(PAL.road, PAL.sky, .5))}" opacity="${(.28+d*.16).toFixed(2)}" filter="url(#soft)"/>`);

  const wob = Math.sin(S.t*1.2)*6;
  $('wetwork').innerHTML = `
    <ellipse cx="${(LAMP.head+sway*2.2).toFixed(1)}" cy="690" rx="${Math.min(W*0.62, 230)}" ry="162" fill="url(#pool)" opacity="${lamp.toFixed(2)}"/>
    <path d="M${LAMP.head-9} ${LAMP.base} L${LAMP.head+9} ${LAMP.base}
             L${(LAMP.head+70+wob).toFixed(1)} ${FLOOR} L${(LAMP.head-70+wob).toFixed(1)} ${FLOOR} Z"
          fill="url(#lampSmear)" opacity="${(lamp*.5).toFixed(2)}" filter="url(#soft)"/>`;

  const spread = 190;
  $('coneShape').setAttribute('d',
    `M${LAMP.head-16} ${LAMP.top+8} L${LAMP.head+16} ${LAMP.top+8} L${LAMP.head+spread} ${FLOOR} L${LAMP.head-spread} ${FLOOR} Z`);
  $('coneG').innerHTML = lamp < .04 ? '' :
    `<path d="M${LAMP.head-16} ${LAMP.top+8} L${LAMP.head+16} ${LAMP.top+8} L${LAMP.head+spread} ${FLOOR} L${LAMP.head-spread} ${FLOOR} Z"
       fill="url(#cone)" opacity="${(lamp*.68).toFixed(2)}" filter="url(#soft)"/>`;

  if(CFG.scene.rain > 0 && lamp > .25){
    $('rainAll').innerHTML = RAIN.map(r =>
      `<line x1="${r.x.toFixed(1)}" y1="${r.y.toFixed(1)}" x2="${(r.x-4).toFixed(1)}" y2="${(r.y+r.l).toFixed(1)}"
         stroke="#cfe0e4" stroke-width="1" opacity="${(.09*lamp*CFG.scene.rain).toFixed(2)}"/>`).join('');
    $('rain').innerHTML = RAIN.map(r =>
      `<line x1="${r.x.toFixed(1)}" y1="${r.y.toFixed(1)}" x2="${(r.x-4).toFixed(1)}" y2="${(r.y+r.l).toFixed(1)}"
         stroke="${C.sodium}" stroke-width="1.2" opacity="${(.32*lamp*CFG.scene.rain).toFixed(2)}"/>`).join('');
    $('splash').innerHTML = SPLASH.map(s =>
      `<ellipse cx="${s.x.toFixed(0)}" cy="${s.y.toFixed(0)}" rx="${(2+s.a*10).toFixed(1)}" ry="${(0.6+s.a*3).toFixed(1)}"
         fill="none" stroke="${C.sodium}" stroke-width="1" opacity="${((1-s.a)*.45*lamp).toFixed(2)}"/>`).join('');
  } else { $('rain').innerHTML = ''; $('rainAll').innerHTML = ''; $('splash').innerHTML = ''; }

  const metal = burn(mixA('#070f16','#445b57', d*.72), C.dusk, dusk*.24);
  $('props').innerHTML = `
    <g fill="none" stroke="${metal}" stroke-width="4.4" stroke-linecap="round">
      <path d="M${LAMP.post} ${LAMP.base} V${LAMP.top+2}"/>
      <path d="M${LAMP.post} ${LAMP.top+4} q0 -15 -17 -15 h${(-17+sway).toFixed(1)}"/>
    </g>
    <circle cx="${(LAMP.head+sway).toFixed(1)}" cy="${LAMP.top+4}" r="104" fill="url(#halo)" opacity="${(lamp*.95).toFixed(2)}"/>
    <path d="M${(LAMP.head-15+sway).toFixed(1)} ${LAMP.top-5} h30 l-6 19 h-18 Z"
          fill="${lamp > .22 ? C.sodium : metal}" opacity="${(0.45+lamp*.55).toFixed(2)}"/>
    <g fill="${burn(mixA('#030a10','#3f5551', d*.6), C.dusk, dusk*.16)}" stroke="${metal}" stroke-width="3.4" stroke-linejoin="round">
      <rect x="${Math.round(W*0.05)}" y="384" width="54" height="86" rx="6"/>
      <path d="M${Math.round(W*0.05)+8} 384 v-14 h38 v14" fill="none"/>
      <path d="M${Math.round(W*0.05)+13} 404 v50 M${Math.round(W*0.05)+27} 404 v50 M${Math.round(W*0.05)+41} 404 v50" stroke-width="2" opacity=".45"/>
    </g>
    <g opacity="${(0.6+lamp*0.4).toFixed(2)}">
      <g fill="none" stroke="${metal}" stroke-width="3.4" stroke-linecap="round">
        <path d="M${Math.round(W*0.19)} 474 V318"/><path d="M${Math.round(W*0.19)} 320 q0 -12 -13 -12 h-13"/>
      </g>
      <circle cx="${Math.round(W*0.19)-26}" cy="322" r="70" fill="url(#halo)" opacity="${(lamp*.72).toFixed(2)}"/>
      <path d="M${Math.round(W*0.19)-37} 314 h22 l-5 15 h-12 Z" fill="${lamp > .22 ? C.sodium : metal}" opacity="${(0.45+lamp*.55).toFixed(2)}"/>
      <ellipse cx="${Math.round(W*0.19)-26}" cy="620" rx="128" ry="104" fill="url(#pool)" opacity="${(lamp*.5).toFixed(2)}"/>
    </g>
    <g stroke="${metal}" stroke-width="3" fill="none" opacity=".9">
      <path d="M${Math.round(W*0.30)} 470 v-56 M${Math.round(W*0.30)+22} 470 v-56 M${Math.round(W*0.30)+44} 470 v-56"/>
      <path d="M${Math.round(W*0.30)-8} 416 h60"/>
    </g>`;
}

// ---- the cat ---------------------------------------------------------------
function bristles(x, y, k){
  if(k <= .03) return '';
  let s = '';
  for(let i=0;i<32;i++){
    const a  = Math.PI*(1.16 + i/31*0.92);
    const px = x + Math.cos(a)*54, py = y - 6 + Math.sin(a)*30;
    const len = ((7 + Math.sin(i*1.9)*4.5)*k + Math.sin(i*2.7 + S.t*18)*2.2*k) * CFG.cat.bristle;
    s += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}"
            x2="${(px+Math.cos(a)*len).toFixed(1)}" y2="${(py-6+Math.sin(a)*len).toFixed(1)}"
            stroke="var(--cat)" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s;
}

function drawCat(d){
  const c = S.cat, k = c.puff, w = c.wake;
  const sz = CFG.cat.size * clamp(1 + (W/390 - 1)*0.17, 1, 1.75);
  const night = 1 - d;

  // she is drawn facing left, so travelling right mirrors her — otherwise she walks backwards
  const tf = `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${(-c.face*sz).toFixed(3)} ${sz}) translate(${(-c.x).toFixed(1)} ${(-c.y).toFixed(1)})`;
  $('catArt').setAttribute('transform', tf);
  $('zzz').setAttribute('transform', tf);
  $('catShadow').setAttribute('transform', tf);

  const x = c.x, arch = Math.sin(c.stretch*Math.PI)*11;
  const y = c.y + c.bob - k*9 - arch;
  const twitch = Math.max(0, Math.sin(S.t*0.7)*Math.sin(S.t*2.3) - .86) * 26;
  const ears = k*3 + twitch;
  const walking = S.mode === 'walk', carried = S.carrying, eating = S.mode === 'eat';
  const sitting = !walking && !carried && !eating && w > .62 && k < .25;   // a fright keeps her low and bristling
  const upright = walking || carried || sitting;

  $('catShadow').innerHTML = `<ellipse cx="${x}" cy="${(c.y+22).toFixed(1)}"
      rx="${(upright?32:48)+k*8}" ry="8" fill="#000" opacity="${carried ? '.10' : (.22+night*.14).toFixed(2)}"/>`;

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
    hx = x - 30; hy = y - 7 + nib;                    // head down and forward, over the fish
    body = `<path d="M${x+24} ${y+12} q${(26+tw).toFixed(1)} 5 ${(18+tw*.5).toFixed(1)} -13"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-34} ${y+16} q-7 -29 18 -34 q30 -6 38 14 q8 22 -8 24 Z" fill="var(--cat)"/>`;
  } else if(sitting){
    const tw = Math.sin(S.t*2.1)*9;
    hx = x - 4; hy = y - 36;
    body = `<path d="M${x+22} ${y+14} q${(28+tw).toFixed(1)} 7 ${(20+tw*.5).toFixed(1)} -15"
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
  const eyeCol = '#eaf1ee';          // nothing on her glows: she stays a silhouette
  const two = walking || sitting;   // both eyes show in the three-quarter poses
  const eye = open
    ? `<circle cx="${hx-8}" cy="${hy-2}" r="${(2.4+k*2.2).toFixed(1)}" fill="${eyeCol}"/>${two?`<circle cx="${hx+8}" cy="${hy-2}" r="2.4" fill="${eyeCol}"/>`:''}`
    : `<path d="M${hx-13} ${hy-1} q5 4 10 0" fill="none" stroke="${eyeCol}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;

  // Three whiskers on each cheek, mirrored about the muzzle: same count, same lengths,
  // same angles on both sides.
  const wfan = (side, len) => `
      <path d="M${(hx+side*4).toFixed(1)} ${(hy+6).toFixed(1)} q${(side*len*.5).toFixed(1)} ${(-3-k*5).toFixed(1)} ${(side*len).toFixed(1)} ${(-7-k*9).toFixed(1)}"/>
      <path d="M${(hx+side*5).toFixed(1)} ${(hy+9).toFixed(1)} q${(side*len*.52).toFixed(1)} 1 ${(side*len*1.04).toFixed(1)} ${(1+k*1).toFixed(1)}"/>
      <path d="M${(hx+side*4).toFixed(1)} ${(hy+12).toFixed(1)} q${(side*len*.5).toFixed(1)} ${(4+k*3).toFixed(1)} ${(side*len).toFixed(1)} ${(9+k*7).toFixed(1)}"/>`;
  const whiskers = `<g fill="none" stroke="#cfdcd7" stroke-width="1.15" stroke-linecap="round"
      opacity="${(.5+k*.4).toFixed(2)}">${wfan(-1, 15+k*6)}${wfan(1, 15+k*6)}</g>`;

  $('catArt').innerHTML = `${body}
    <circle cx="${hx}" cy="${hy}" r="${hr}" fill="var(--cat)"/>
    <path d="M${hx-15} ${hy-11} l${(-3+ears).toFixed(1)} ${(-15+ears*2.1).toFixed(1)} l15 6 Z" fill="var(--cat)"/>
    <path d="M${hx+10} ${hy-14} l${(6-ears).toFixed(1)} ${(-14+ears*2.1).toFixed(1)} l9 10 Z" fill="var(--cat)"/>
    ${eye}
    <path d="M${hx} ${hy+6} l-3 3 l3 2 l3 -2 Z" fill="${eyeCol}" opacity=".75"/>
    ${whiskers}`;

  const B = c.y + 22, squash = 0.55;
  const ref = $('catRef');
  ref.setAttribute('transform', `translate(0 ${(B*(1+squash)).toFixed(1)}) scale(1 ${-squash})`);
  ref.setAttribute('opacity', (CFG.scene.reflection * (0.4 + night*0.6)).toFixed(2));

  if(!carried && S.mode === 'rest' && w < .12 && k < .1){
    let z = '';
    for(let i=0;i<3;i++){ const p = ((S.t*.35 + i*.33) % 1);
      z += `<text x="${(x+36+p*24).toFixed(0)}" y="${(y-32-p*62).toFixed(0)}" font-family="Fraunces, Georgia, serif"
              font-size="${13+i*5}" fill="${d > .45 ? '#2b4440' : '#d8e4e0'}"
              opacity="${((1-p)*.62).toFixed(2)}">z</text>`; }
    $('zzz').innerHTML = z;
  } else $('zzz').innerHTML = '';
}

// ---- the fish --------------------------------------------------------------
function drawFish(){
  const f = S.fish;
  const x = f.out ? f.x : TRAY.x, y = f.out ? f.y : TRAY.y, w = f.out ? f.left : (S.trayIn > 0 ? 0 : 1);
  const wob = f.held ? Math.sin(S.t*9)*6 : Math.sin(S.t*1.6)*1.6;
  $('fish').innerHTML = w <= .02 ? '' : `
    <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${wob.toFixed(1)}) scale(${(.6+w*.5).toFixed(2)})">
      <path d="M-17 0 q10 -13 22 0 q-12 13 -22 0 Z" fill="${CFG.colors.sodium}" opacity=".92"/>
      <path d="M-17 0 l-12 -9 v18 Z" fill="${CFG.colors.sodium}" opacity=".75"/>
      <circle cx="-1" cy="-2" r="1.9" fill="var(--cat)"/>
    </g>`;
  $('fishRef').innerHTML = (!f.out || w <= .02) ? '' : `
    <g transform="translate(${x.toFixed(1)} ${(y+14).toFixed(1)}) scale(${(.6+w*.5).toFixed(2)} ${(-(.6+w*.5)*.5).toFixed(2)})" filter="url(#wet)">
      <path d="M-17 0 q10 -13 22 0 q-12 13 -22 0 Z" fill="${CFG.colors.sodium}"/></g>`;
  $('fishRef').setAttribute('opacity', f.out ? (CFG.scene.reflection*0.8).toFixed(2) : '0');
  $('tray').innerHTML = (f.out || S.trayIn > 0) ? '' : `
    <circle cx="${TRAY.x}" cy="${TRAY.y}" r="30" fill="none" stroke="${CFG.colors.sodium}"
            stroke-width="1.6" stroke-dasharray="3 7" opacity="${(.4+Math.sin(S.t*1.8)*.2).toFixed(2)}"/>`;
  $('ping').innerHTML = PING.map(q =>
    `<ellipse cx="${q.x.toFixed(0)}" cy="${q.y.toFixed(0)}" rx="${(10+q.a*44).toFixed(0)}" ry="${(3+q.a*14).toFixed(0)}"
       fill="none" stroke="${daylight() > .45 ? '#22383a' : CFG.colors.sodium}" stroke-width="1.8"
       opacity="${((1-q.a)*.6).toFixed(2)}"/>`).join('');
}

// ---- behaviour -------------------------------------------------------------
function think(dt){
  const c = S.cat, M = CFG.motion, d = daylight();

  S.idle += dt;                       // time since you last did anything to her

  if(S.held){ S.mode = 'held'; S.idle = 0; }
  else if(S.fish.out && !S.fish.held && S.fish.left > .02 && S.mode !== 'eat'){
    // she comes right up to it, close enough that lowering her head reaches it
    const side = S.fish.x > W*0.5 ? -1 : 1;
    S.mode = 'run'; S.target = { x: clamp(S.fish.x + side*82, PEN.x0, PEN.x1),
                                 y: clamp(S.fish.y, PEN.y0, PEN.y1) };
  }

  if((S.mode === 'walk' || S.mode === 'run') && S.target){
    const dx = S.target.x - c.x, dy = S.target.y - c.y, dd = Math.hypot(dx, dy);
    if(dd > 4) c.face = dx < 0 ? -1 : 1;
    if(dd < 6){ S.mode = (S.fish.out && S.fish.left > .02) ? 'eat' : 'rest';
                S.eat = CFG.cat.appetite; S.target = null; if(S.mode === 'rest') c.stretch = 1; }
    else { const v = (S.mode === 'run' ? M.runSpeed : M.walkSpeed)*dt; c.x += dx/dd*v; c.y += dy/dd*v; }
  }

  if(S.mode === 'eat'){
    S.eat -= dt;
    S.fish.left = clamp(S.eat / CFG.cat.appetite, 0, 1);
    if(S.eat <= 0){ S.fish.out = false; S.fish.left = 0; S.trayIn = 3.2;   // eaten: nothing left on the street
                    S.mode = 'rest'; c.stretch = 1; }
  }

  // she is awake while something is happening, and for CFG.motion.sleepAfter seconds after it
  const busy  = S.held || S.mode === 'walk' || S.mode === 'run' || S.mode === 'eat' || c.puff > .3;
  const awake = busy || S.idle < M.sleepAfter;
  c.wake = awake ? clamp(c.wake + dt*M.wakeSpeed, 0, 1) : clamp(c.wake - dt*M.sleepSpeed, 0, 1);

  if(!S.held) c.puff = clamp(c.puff - dt*2.4, 0, 1);
  if(c.stretch > 0 && !S.held) c.stretch = Math.max(0, c.stretch - dt*2.4);
  c.bob = Math.sin(S.t * (c.wake > .5 ? 3.2 : 1.1)) * (c.wake > .5 ? 1.4 : 2.6);

  S.flick = 1 - Math.max(0, Math.sin(S.t*2.3)*Math.sin(S.t*7.9) - .74) * .45 * CFG.scene.lampFlicker;

  for(const cl of CLOUD){ cl.x += cl.v*dt*CFG.scene.cloud; if(cl.x - cl.w > W) cl.x = -cl.w; }

  if(S.trayIn > 0){ S.trayIn -= dt; if(S.trayIn <= 0) S.fish.left = 1; }
  S.win += dt;

  for(let i=PING.length-1;i>=0;i--){ PING[i].a += dt*1.6; if(PING[i].a >= 1) PING.splice(i,1); }

  if(CFG.scene.rain > 0) for(const r of RAIN){
    r.y += r.v*dt; r.x -= r.v*dt*0.11;
    if(r.y > FLOOR){
      if(SPLASH.length < 26 && Math.abs(r.x - LAMP.head) < 190)
        SPLASH.push({ x: r.x, y: rnd(KERB+30, FLOOR-6), a: 0 });
      r.y = rnd(240, 330); r.x = rnd(0, W + 60);
    }
  }
  for(let i=SPLASH.length-1;i>=0;i--){ SPLASH[i].a += dt*2.2; if(SPLASH[i].a >= 1) SPLASH.splice(i,1); }
}

// ---- input -----------------------------------------------------------------
const onCat  = p => Math.hypot(p.x - S.cat.x, (p.y - S.cat.y)*1.3) < 96;
const onFish = p => { const f = S.fish, x = f.out ? f.x : TRAY.x, y = f.out ? f.y : TRAY.y;
                      return Math.hypot(p.x - x, p.y - y) < 40; };
const hideTitle = () => { if(!S.touched){ S.touched = true; $('titleG').classList.add('gone'); } };
const noticed = () => { S.idle = 0; };      // anything you do buys her another ten seconds

svg.addEventListener('pointerdown', e => {
  const p = toSvg(e); hideTitle(); noticed();
  if(onFish(p)){
    S.fish.held = true; S.fish.out = true; S.fish.left = 1;
    // a plain click drops it on the street beside the tray, so she never eats on top of the ring
    S.fish.x = S.fish.out && p.x === S.fish.x ? p.x : clamp(TRAY.x - 110, 60, W-60);
    S.fish.y = clamp(TRAY.y + 26, PEN.y0, PEN.y1);
    svg.setPointerCapture(e.pointerId); return; }
  if(onCat(p)){
    S.held = true; S.moved = 0; S.carrying = false;
    S.cat.puff = Math.min(1, S.cat.puff + .95);
    S.cat.stretch = 0; S.mode = 'held'; S.target = null;
    S.grabDX = S.cat.x - p.x; S.grabDY = S.cat.y - p.y;
    svg.setPointerCapture(e.pointerId);
    return;
  }
  // anywhere else on the street: she goes there
  if(p.y > KERB + 20){
    S.mode = 'walk';
    S.target = { x: clamp(p.x, PEN.x0, PEN.x1), y: clamp(p.y, PEN.y0, PEN.y1) };
    PING.push({ x: S.target.x, y: S.target.y, a: 0 });
  }
});

svg.addEventListener('pointermove', e => {
  const p = toSvg(e);
  if(S.fish.held){ noticed(); S.fish.x = clamp(p.x, 30, W-30); S.fish.y = clamp(p.y, PEN.y0-30, FLOOR-24); return; }
  if(!S.held) return;
  noticed();
  const nx = clamp(p.x + S.grabDX, PEN.x0, PEN.x1), ny = clamp(p.y + S.grabDY, PEN.y0, PEN.y1);
  S.moved += Math.hypot(nx - S.cat.x, ny - S.cat.y);
  if(S.moved > 10) S.carrying = true;
  if(Math.abs(nx - S.cat.x) > 1.2) S.cat.face = nx < S.cat.x ? -1 : 1;
  S.cat.x = nx; S.cat.y = ny;
  if(S.moved > 14) S.cat.puff = Math.min(S.cat.puff, .35);
});

function release(){
  if(S.fish.held){ S.fish.held = false; return; }
  if(S.held){ S.held = false; S.carrying = false; S.mode = 'rest'; noticed(); S.cat.stretch = 1; }
}
addEventListener('pointerup', release);
addEventListener('pointercancel', release);
addEventListener('resize', layout);

// ---- loop ------------------------------------------------------------------
function applyColors(){
  const r = document.documentElement.style;
  r.setProperty('--sodium', CFG.colors.sodium);
  r.setProperty('--cat', CFG.colors.cat);
}

let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  S.t += dt;
  if(!reduce) S.day = (S.day + dt / Math.max(10, CFG.motion.dayLength)) % 1;
  think(dt);
  const d = daylight(), k = duskAmt();
  applyColors(); drawSky(d, k); drawStreet(d, k); drawFish(); drawCat(d);
  $('grainLayer').setAttribute('opacity', CFG.scene.grain);
  requestAnimationFrame(frame);
}
layout();
requestAnimationFrame(frame);

window.CAT  = () => S;
window.CATP = { CFG, applyColors, relayout: layout, setDay: v => { S.day = v; S.drowsy = daylight(); },
                reset(){ Object.assign(S.cat, { x: Math.round(W*0.42), y: 648, wake: 0, puff: 0, stretch: 0, face: -1 });
                         S.fish.out = false; S.fish.left = 1; S.mode = 'rest';
                         S.idle = 999; S.target = null; S.held = S.carrying = false; } };
})();
