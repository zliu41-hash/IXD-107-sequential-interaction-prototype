/* Cat Naps — Night Shift
   One wet street, one lamp, one cat. A single scene that never cuts away.
   There are no steps, no score and no ending; the cat always goes back to sleep.
     touch her        -> she startles awake and her fur stands up
     carry her        -> let go anywhere and she stretches once, then sleeps there
     put a fish down  -> she gets up, walks over, eats, and sleeps where she ate
   The sun and moon keep going whether or not anyone is watching. */
(() => {
'use strict';

const CFG = JSON.parse(JSON.stringify(window.CAT_DEFAULTS));
const $   = id => document.getElementById(id);
const svg = $('stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp  = (a,b,k) => a + (b-a)*k;
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
                     return p.matrixTransform(svg.getScreenCTM().inverse()); };

const hex = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const rgb = a => `rgb(${a.map(v=>Math.round(clamp(v,0,255))).join(',')})`;
const mixA = (a,b,k) => { const A=hex(a), B=hex(b); return [lerp(A[0],B[0],k), lerp(A[1],B[1],k), lerp(A[2],B[2],k)]; };
const mix  = (a,b,k) => rgb(mixA(a,b,k));
const burn = (base, warm, k) => { const W = hex(warm); return rgb(base.map((v,i)=>lerp(v, W[i], k))); };

// ---- the stage -------------------------------------------------------------
const KERB = 470;                            // where the pavement starts
const PEN  = { x0: 46, x1: 344, y0: 520, y1: 756 };
const TRAY = { x: 324, y: 788 };
const LAMP = { post: 322, head: 288, top: 292, base: 476 };

const S = {
  t: 0, day: 0.62,                           // 0 dawn · .25 noon · .5 dusk · .75 midnight
  cat: { x: 236, y: 640, wake: 0, puff: 0, stretch: 0, face: -1, bob: 0 },
  held: false, carrying: false, grabDX: 0, grabDY: 0, moved: 0,
  fish: { out: false, held: false, x: TRAY.x, y: TRAY.y, left: 1 },
  mode: 'rest', target: null, eat: 0, idle: 0, roamIn: 9, touched: false, flick: 1
};

const daylight = () => clamp(Math.sin(S.day * Math.PI * 2) * 2.1 + 0.08, 0, 1);
const duskAmt  = () => { const d = daylight(); return clamp(1 - Math.abs(d - 0.40) / 0.40, 0, 1); };

const STAR = Array.from({length: 30}, (_, i) => ({
  x: 14 + ((i * 97) % 362), y: 40 + ((i * 53) % 350), r: .7 + ((i * 7) % 10) / 10 }));
const SKYLINE = [[-14,350,86,120],[66,304,52,166],[112,366,44,104],[152,286,70,184],
                 [214,352,46,118],[254,312,60,158],[308,356,54,114],[356,298,52,172]];
const RAIN = Array.from({length: 46}, (_, i) => ({
  x: 150 + Math.random()*300, y: Math.random()*560, v: 320 + Math.random()*260, l: 9 + Math.random()*16 }));

// ---- backdrop --------------------------------------------------------------
function drawSky(d, dusk){
  const C = CFG.colors;
  const top = mixA(C.skyNight, C.skyDay, d*0.62);
  const mid = mixA(C.skyNight, C.skyDay, d);
  const low = mixA(C.skyNight, C.skyDay, Math.min(1, d*1.3));
  $('skyTop').setAttribute('stop-color', burn(top, C.dusk, dusk*0.07));
  $('skyMid').setAttribute('stop-color', burn(mid, C.dusk, dusk*0.40));
  $('skyLow').setAttribute('stop-color', burn(low, C.dusk, dusk*0.80));

  const rd = mixA(C.roadNight, C.roadDay, d);
  $('roadTop').setAttribute('stop-color', burn(rd, C.dusk, dusk*0.30));
  $('roadBot').setAttribute('stop-color', rgb(mixA(C.roadNight, C.roadDay, d*0.55)));

  const night = 1 - d;
  $('stars').innerHTML = night < .22 ? '' : STAR.map((s,i) =>
    `<circle cx="${s.x}" cy="${s.y}" r="${(s.r*(.65+Math.sin(S.t*1.7+i)*.35)).toFixed(2)}"
       fill="#fff" opacity="${(((night-.22)/.78)*.85).toFixed(2)}"/>`).join('');

  // one arc, the sun leading and the moon following
  const u = S.day % 1, up = u < .5 ? u*2 : (u-.5)*2, isSun = u < .5;
  const cx = 42 + 306*up, cy = 304 - Math.sin(up*Math.PI)*176;
  $('celestial').innerHTML = isSun
    ? `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="112" fill="url(#halo)" opacity="${(0.14+dusk*0.62).toFixed(2)}"/>
       <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="27"
         fill="${burn(hex('#fff6e2'), CFG.colors.dusk, dusk*0.85)}"/>`
    : `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="64" fill="#dce9f2" opacity="${(night*.07).toFixed(2)}" filter="url(#soft)"/>
       <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="25" fill="#e9f1f6"/>
       <circle cx="${(cx+11).toFixed(1)}" cy="${(cy-7).toFixed(1)}" r="21"
         fill="${burn(mixA(CFG.colors.skyNight, CFG.colors.skyDay, d), CFG.colors.dusk, dusk*0.5)}"/>`;

  $('skyline').innerHTML = SKYLINE.map(b => {
    let w = '';
    for(let r=0;r<Math.floor(b[3]/34);r++) for(let q=0;q<Math.floor(b[2]/26);q++){
      const lit = ((r*7 + q*13 + b[0]) % 5) < 2;
      w += `<rect x="${b[0]+8+q*26}" y="${b[1]+14+r*34}" width="9" height="12"
             fill="${CFG.colors.sodium}" opacity="${(lit ? night*.8 : night*.1).toFixed(2)}"/>`;
    }
    return `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}"
             fill="${burn(mixA('#04101a', '#5e7873', d*.62), CFG.colors.dusk, dusk*.26)}"/>${w}`;
  }).join('');
}

function drawStreet(d, dusk){
  const night = 1 - d, lamp = clamp(night*1.5, 0, 1) * S.flick;
  const C = CFG.colors;

  // kerb line and a few slab joints — quiet, just enough to read as paving
  let k = `<rect x="0" y="${KERB}" width="390" height="46" fill="#000" opacity="${(.10+d*.12).toFixed(2)}" filter="url(#soft)"/>
    <line x1="0" y1="${KERB}" x2="390" y2="${KERB}" stroke="${mix(C.roadDay, '#ffffff', .4)}"
      stroke-width="2" opacity="${(.22+d*.4).toFixed(2)}"/>`;
  for(let y = KERB+92; y < 844; y += 92)
    k += `<line x1="0" y1="${y}" x2="390" y2="${y}" stroke="#fff" stroke-width="1" opacity="${(.05+d*.07).toFixed(2)}"/>`;
  for(let x = 58; x < 390; x += 104)
    k += `<line x1="${x}" y1="${KERB}" x2="${x}" y2="844" stroke="#fff" stroke-width="1" opacity="${(.04+d*.06).toFixed(2)}"/>`;
  $('kerb').innerHTML = k;

  // the pool of lamplight on the wet road, and the lamp's own smear running toward us
  const wob = Math.sin(S.t*1.3)*5;
  $('wetwork').innerHTML = `
    <ellipse cx="${LAMP.head}" cy="672" rx="196" ry="150" fill="url(#pool)" opacity="${lamp.toFixed(2)}"/>
    <path d="M${LAMP.head-9} ${LAMP.base} L${LAMP.head+9} ${LAMP.base}
             L${(LAMP.head+62+wob).toFixed(1)} 844 L${(LAMP.head-62+wob).toFixed(1)} 844 Z"
          fill="url(#lampSmear)" opacity="${(lamp*.55).toFixed(2)}" filter="url(#soft)"/>`;

  // the cone of light, and drizzle falling only inside it
  const spread = 166;
  $('coneShape').setAttribute('d',
    `M${LAMP.head-15} ${LAMP.top+8} L${LAMP.head+15} ${LAMP.top+8} L${LAMP.head+spread} 844 L${LAMP.head-spread} 844 Z`);
  $('coneG').innerHTML = lamp < .04 ? '' :
    `<path d="M${LAMP.head-15} ${LAMP.top+8} L${LAMP.head+15} ${LAMP.top+8} L${LAMP.head+spread} 844 L${LAMP.head-spread} 844 Z"
       fill="url(#cone)" opacity="${(lamp*.62).toFixed(2)}" filter="url(#soft)"/>`;

  if(CFG.scene.rain > 0 && lamp > .3){
    $('rain').innerHTML = RAIN.map(r =>
      `<line x1="${r.x.toFixed(1)}" y1="${r.y.toFixed(1)}" x2="${(r.x-3).toFixed(1)}" y2="${(r.y+r.l).toFixed(1)}"
         stroke="${C.sodium}" stroke-width="1.1" opacity="${(.34*lamp*CFG.scene.rain).toFixed(2)}"/>`).join('');
  } else $('rain').innerHTML = '';

  // lamp post, bin — kept spare so the light is the thing you look at
  const metal = burn(mixA('#081118', '#4a615d', d*.7), C.dusk, dusk*.26);
  $('props').innerHTML = `
    <g fill="none" stroke="${metal}" stroke-width="4" stroke-linecap="round">
      <path d="M${LAMP.post} ${LAMP.base} V${LAMP.top+2}"/>
      <path d="M${LAMP.post} ${LAMP.top+4} q0 -14 -16 -14 h-18"/>
    </g>
    <circle cx="${LAMP.head}" cy="${LAMP.top+4}" r="92" fill="url(#halo)" opacity="${(lamp*.95).toFixed(2)}"/>
    <path d="M${LAMP.head-14} ${LAMP.top-4} h28 l-6 18 h-16 Z"
          fill="${lamp > .25 ? C.sodium : metal}" opacity="${(0.45+lamp*.55).toFixed(2)}"/>
    <g fill="none" stroke="${metal}" stroke-width="3.4" stroke-linejoin="round">
      <rect x="24" y="388" width="50" height="82" rx="6" fill="${burn(mixA('#030b11','#4e6763',d*.55), C.dusk, dusk*.18)}"/>
      <path d="M32 388 v-13 h34 v13"/>
      <path d="M38 406 v48 M50 406 v48 M62 406 v48" stroke-width="2" opacity=".5"/>
    </g>`;
}

// ---- the cat ---------------------------------------------------------------
function bristles(x, y, k){
  if(k <= .03) return '';
  let s = '';
  for(let i=0;i<32;i++){
    const a  = Math.PI*(1.16 + i/31*0.92);
    const px = x + Math.cos(a)*54, py = y - 6 + Math.sin(a)*30;
    const len = ((7 + Math.sin(i*1.9)*4.5)*k + Math.sin(i*2.7 + S.t*18)*2.2*k) * CFG.scene.lampFlicker * CFG.cat.bristle;
    s += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}"
            x2="${(px+Math.cos(a)*len).toFixed(1)}" y2="${(py-6+Math.sin(a)*len).toFixed(1)}"
            stroke="var(--cat)" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s;
}

function drawCat(d){
  const c = S.cat, k = c.puff, w = c.wake, sz = CFG.cat.size;
  const night = 1 - d;
  // the lamp only reaches so far: the further she wanders, the less of it lands on her
  const reach = clamp(1 - Math.hypot(c.x - LAMP.head, (c.y - 660)*0.6) / 250, 0.06, 1);
  const rim = clamp(night*1.4, 0, 1) * S.flick * reach;
  const tf = `translate(${c.x.toFixed(1)} ${c.y.toFixed(1)}) scale(${(c.face*sz).toFixed(3)} ${sz}) translate(${(-c.x).toFixed(1)} ${(-c.y).toFixed(1)})`;
  $('catArt').setAttribute('transform', tf);
  $('zzz').setAttribute('transform', tf);
  $('catShadow').setAttribute('transform', tf);

  const x = c.x, arch = Math.sin(c.stretch*Math.PI)*11;
  const y = c.y + c.bob - k*9 - arch;
  const ears = k*3, walking = S.mode === 'walk', carried = S.carrying,
        upright = walking || carried || w > .55;

  $('catShadow').innerHTML = `<ellipse cx="${x}" cy="${(c.y+22).toFixed(1)}"
      rx="${(upright?31:48)+k*8}" ry="8" fill="#000" opacity="${carried ? '.10' : '.34'}"/>`;

  let body;
  if(carried){
    const sw = Math.sin(S.t*3.4)*17;
    body = `<path d="M${x+40} ${y+10} q${(24+sw).toFixed(1)} 8 ${(16+sw*.6).toFixed(1)} -18"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-26} ${y+16} l${(-6+Math.sin(S.t*6)*4).toFixed(1)} 21
               M${x-6} ${y+18} l${(2+Math.sin(S.t*6+2)*4).toFixed(1)} 23
               M${x+12} ${y+16} l${(6+Math.sin(S.t*6+4)*4).toFixed(1)} 21"
            stroke="var(--cat)" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M${x-48} ${y+14} q-6 -32 26 -38 q34 -6 48 14 q15 21 -6 28 q-34 10 -68 -4 Z" fill="var(--cat)"/>`;
  } else if(walking){
    body = `<path d="M${x+26} ${y-16} q22 ${(-10+Math.sin(S.t*5)*8).toFixed(1)} 16 -26"
              fill="none" stroke="var(--cat)" stroke-width="7" stroke-linecap="round"/>
      <path d="M${x-22} ${y-4} q-6 -34 14 -40 q26 -8 34 16 q6 22 -6 24 Z" fill="var(--cat)"/>
      <path d="M${x-14} ${y-6} l${(Math.sin(S.t*9)*6).toFixed(1)} 18
               M${x+2} ${y-6} l${(Math.sin(S.t*9+3)*6).toFixed(1)} 18"
            stroke="var(--cat)" stroke-width="5" stroke-linecap="round"/>`;
  } else {
    const tail = Math.sin(S.t*(6+k*9))*(5+k*20);
    body = `${bristles(x,y,k)}
      <path d="M${x+42} ${y+8} q${(26+tail*.4).toFixed(1)} ${(-6-k*16).toFixed(1)} ${(14+tail*.5).toFixed(1)} ${(-28-k*10).toFixed(1)}"
            fill="none" stroke="var(--cat)" stroke-width="${(7+k*3).toFixed(1)}" stroke-linecap="round"/>
      <path d="M${x-48} ${y+14} q-6 ${(-32-arch).toFixed(1)} 26 -38 q34 -6 48 14 q15 21 -6 28 q-34 10 -68 -4 Z" fill="var(--cat)"/>`;
  }

  const hy = walking ? y - 34 : y - 9 - w*6;
  const hx = walking ? x - 4  : x - 17;
  const open = walking || w > .3 || k > .25;
  const eyeCol = rim > .32 ? CFG.colors.sodium : '#eaf1ee';
  const eye = open
    ? `<circle cx="${hx-8}" cy="${hy-2}" r="${(2.4+k*2.2).toFixed(1)}" fill="${eyeCol}"/>${walking?`<circle cx="${hx+8}" cy="${hy-2}" r="2.4" fill="${eyeCol}"/>`:''}`
    : `<path d="M${hx-13} ${hy-1} q5 4 10 0" fill="none" stroke="${eyeCol}" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;

  // a thin sodium edge on the lamp side — the only light that touches her
  const sd = (LAMP.head - c.x) >= 0 ? 1 : -1;              // which side the lamp is on, on screen
  const unflip = `translate(${x.toFixed(1)} 0) scale(${c.face} 1) translate(${(-x).toFixed(1)} 0)`;
  const shx = x + (hx - x)*c.face, hr = walking ? 19 : 18;   // her head, in screen space
  const rimLine = rim < .08 ? '' : `
    <g transform="${unflip}" fill="none" stroke="${CFG.colors.sodium}" stroke-linecap="round"
       opacity="${(rim*.95).toFixed(2)}">
      <path stroke-width="2.4" d="M${(shx+hr*0.34*sd).toFixed(1)} ${(hy-hr*0.94).toFixed(1)}
            A ${hr} ${hr} 0 0 ${sd>0?1:0} ${(shx+hr*0.57*sd).toFixed(1)} ${(hy+hr*0.82).toFixed(1)}"/>
      <path stroke-width="2.2" d="M${(x+26*sd).toFixed(1)} ${(y-26).toFixed(1)}
            q${(16*sd).toFixed(1)} 9 ${(14*sd).toFixed(1)} 28"/>
    </g>`;

  $('catArt').innerHTML = `${body}
    <circle cx="${hx}" cy="${hy}" r="${walking?19:18}" fill="var(--cat)"/>
    <path d="M${hx-15} ${hy-11} l${(-3+ears).toFixed(1)} ${(-15+ears*2.1).toFixed(1)} l15 6 Z" fill="var(--cat)"/>
    <path d="M${hx+10} ${hy-14} l${(6-ears).toFixed(1)} ${(-14+ears*2.1).toFixed(1)} l9 10 Z" fill="var(--cat)"/>
    ${rimLine}${eye}
    <path d="M${hx} ${hy+6} l-3 3 l3 2 l3 -2 Z" fill="${eyeCol}" opacity=".75"/>
    <g stroke="${rim>.32?CFG.colors.sodium:'#cfdcd7'}" stroke-width="1.5" stroke-linecap="round" opacity="${(.28+k*.62).toFixed(2)}">
      <path d="M${hx-9} ${hy+7} l${(-16-k*9).toFixed(1)} ${(1-k*7).toFixed(1)}"/>
      <path d="M${hx-9} ${hy+11} l${(-17-k*9).toFixed(1)} ${(5+k*4).toFixed(1)}"/>
    </g>`;

  // her reflection in the wet road, mirrored about where she touches it
  const B = c.y + 22, squash = 0.55;
  const ref = $('catRef');
  ref.setAttribute('transform', `translate(0 ${(B*(1+squash)).toFixed(1)}) scale(1 ${-squash})`);
  ref.setAttribute('opacity', (CFG.scene.reflection * (0.45 + (1-d)*0.55)).toFixed(2));

  if(!S.carrying && S.mode === 'rest' && w < .12 && k < .1){
    let z = '';
    for(let i=0;i<3;i++){ const p = ((S.t*.35 + i*.33) % 1);
      z += `<text x="${(x+36+p*24).toFixed(0)}" y="${(y-32-p*62).toFixed(0)}" font-family="Fraunces, Georgia, serif"
              font-size="${13+i*5}" fill="${rim > .32 ? CFG.colors.sodium : (d > .45 ? '#2b4440' : '#d8e4e0')}"
              opacity="${((1-p)*.62).toFixed(2)}">z</text>`; }
    $('zzz').innerHTML = z;
  } else $('zzz').innerHTML = '';
}

// ---- the fish --------------------------------------------------------------
function drawFish(d){
  const f = S.fish;
  const x = f.out ? f.x : TRAY.x, y = f.out ? f.y : TRAY.y, w = f.out ? f.left : 1;
  const wob = f.held ? Math.sin(S.t*9)*6 : Math.sin(S.t*1.6)*1.6;
  $('fish').innerHTML = w <= .02 ? '' : `
    <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${wob.toFixed(1)}) scale(${(.6+w*.5).toFixed(2)})">
      <path d="M-17 0 q10 -13 22 0 q-12 13 -22 0 Z" fill="${CFG.colors.sodium}" opacity=".92"/>
      <path d="M-17 0 l-12 -9 v18 Z" fill="${CFG.colors.sodium}" opacity=".75"/>
      <circle cx="-1" cy="-2" r="1.9" fill="var(--cat)"/>
    </g>`;
  // the fish gets a reflection too, so it sits on the same wet ground
  $('fishRef').innerHTML = (!f.out || w <= .02) ? '' : `
    <g transform="translate(${x.toFixed(1)} ${(y+14).toFixed(1)}) scale(${(.6+w*.5).toFixed(2)} ${(-(.6+w*.5)*.5).toFixed(2)})" filter="url(#wet)">
      <path d="M-17 0 q10 -13 22 0 q-12 13 -22 0 Z" fill="${CFG.colors.sodium}"/>
    </g>`;
  $('fishRef').setAttribute('opacity', f.out ? (CFG.scene.reflection*0.8).toFixed(2) : '0');

  $('tray').innerHTML = f.out ? '' : `
    <circle cx="${TRAY.x}" cy="${TRAY.y}" r="30" fill="none" stroke="${CFG.colors.sodium}"
            stroke-width="1.6" stroke-dasharray="3 7" opacity="${(.4+Math.sin(S.t*1.8)*.2).toFixed(2)}"/>`;
}

// ---- behaviour -------------------------------------------------------------
function think(dt){
  const c = S.cat, M = CFG.motion, night = 1 - daylight();

  if(S.held){ S.mode = 'held'; S.idle = 0; }
  else if(S.fish.out && !S.fish.held && S.fish.left > .02 && S.mode !== 'eat'){
    S.mode = 'walk'; S.target = { x: S.fish.x - 32, y: S.fish.y }; S.idle = 0;
  }

  if(S.mode === 'walk' && S.target){
    const dx = S.target.x - c.x, dy = S.target.y - c.y, dd = Math.hypot(dx, dy);
    if(dd > 4) c.face = dx < 0 ? -1 : 1;
    if(dd < 6){ S.mode = (S.fish.out && S.fish.left > .02) ? 'eat' : 'rest';
                S.eat = CFG.cat.appetite; S.target = null; S.idle = 0; }
    else { const v = M.walkSpeed*dt; c.x += dx/dd*v; c.y += dy/dd*v; }
  }

  if(S.mode === 'eat'){
    S.eat -= dt;
    S.fish.left = clamp(S.eat / CFG.cat.appetite, 0, 1);
    if(S.eat <= 0){ S.fish.out = false; S.fish.left = 1; S.mode = 'rest'; S.idle = 0; c.stretch = 1; }
  }

  if(S.mode === 'rest'){
    S.idle += dt;
    if(CFG.cat.nightRoam > 0 && night > .55 && S.idle > M.settleDelay){
      S.roamIn -= dt * night * CFG.cat.nightRoam;
      if(S.roamIn <= 0){
        S.roamIn = 11 + Math.random()*13; S.mode = 'walk';
        S.target = { x: PEN.x0+24 + Math.random()*(PEN.x1-PEN.x0-48),
                     y: PEN.y0+18 + Math.random()*(PEN.y1-PEN.y0-36) };
      }
    }
  }

  const up = S.held || S.mode === 'walk' || S.mode === 'eat' || c.puff > .3;
  c.wake = up ? clamp(c.wake + dt*M.wakeSpeed, 0, 1) : clamp(c.wake - dt*M.sleepSpeed, 0, 1);
  if(!S.held) c.puff = clamp(c.puff - dt*2.4, 0, 1);   // the fur drops as soon as you let go
  if(c.stretch > 0 && !S.held) c.stretch = Math.max(0, c.stretch - dt*2.4);
  c.bob = Math.sin(S.t * (c.wake > .5 ? 3.2 : 1.1)) * (c.wake > .5 ? 1.5 : 2.6);

  // the lamp is old and not quite steady
  S.flick = 1 - Math.max(0, Math.sin(S.t*2.3)*Math.sin(S.t*7.9) - .72) * .5 * CFG.scene.lampFlicker;

  if(CFG.scene.rain > 0) for(const r of RAIN){
    r.y += r.v*dt; r.x -= r.v*dt*0.1;
    if(r.y > 850){ r.y = 280 + Math.random()*60; r.x = 190 + Math.random()*260; }
  }
}

// ---- input -----------------------------------------------------------------
const onCat  = p => Math.hypot(p.x - S.cat.x, (p.y - S.cat.y)*1.4) < 92;
const onFish = p => { const f = S.fish, x = f.out ? f.x : TRAY.x, y = f.out ? f.y : TRAY.y;
                      return Math.hypot(p.x - x, p.y - y) < 38; };
const hideTitle = () => { if(!S.touched){ S.touched = true; $('titleG').classList.add('gone'); } };

svg.addEventListener('pointerdown', e => {
  const p = toSvg(e); hideTitle();
  if(onFish(p)){ S.fish.held = true; S.fish.out = true; S.fish.left = 1;
                 S.fish.x = p.x; S.fish.y = p.y; svg.setPointerCapture(e.pointerId); return; }
  if(onCat(p)){
    S.held = true; S.moved = 0; S.carrying = false;
    S.cat.puff = Math.min(1, S.cat.puff + .95);        // the touch itself is the fright
    S.cat.stretch = 0; S.mode = 'held';
    S.grabDX = S.cat.x - p.x; S.grabDY = S.cat.y - p.y;
    svg.setPointerCapture(e.pointerId);
  }
});

svg.addEventListener('pointermove', e => {
  const p = toSvg(e);
  if(S.fish.held){ S.fish.x = clamp(p.x, 36, 354); S.fish.y = clamp(p.y, PEN.y0-30, 800); return; }
  if(!S.held) return;
  const nx = clamp(p.x + S.grabDX, PEN.x0, PEN.x1), ny = clamp(p.y + S.grabDY, PEN.y0, PEN.y1);
  S.moved += Math.hypot(nx - S.cat.x, ny - S.cat.y);
  if(S.moved > 10) S.carrying = true;
  if(Math.abs(nx - S.cat.x) > 1.2) S.cat.face = nx < S.cat.x ? -1 : 1;
  S.cat.x = nx; S.cat.y = ny;
  if(S.moved > 14) S.cat.puff = Math.min(S.cat.puff, .35);   // once carried, she stops bristling
});

function release(){
  if(S.fish.held){ S.fish.held = false; return; }
  if(S.held){ S.held = false; S.carrying = false; S.mode = 'rest'; S.idle = 0; S.cat.stretch = 1; }
}
addEventListener('pointerup', release);
addEventListener('pointercancel', release);

// ---- loop ------------------------------------------------------------------
function applyColors(){
  const r = document.documentElement.style;
  r.setProperty('--sodium', CFG.colors.sodium);
  r.setProperty('--cat',    CFG.colors.cat);
}

let last = performance.now();
function frame(now){
  const dt = Math.min(.05, (now - last)/1000); last = now;
  S.t += dt;
  if(!reduce) S.day = (S.day + dt / Math.max(10, CFG.motion.dayLength)) % 1;
  think(dt);
  const d = daylight(), k = duskAmt();
  applyColors(); drawSky(d, k); drawStreet(d, k); drawFish(d); drawCat(d);
  $('grainLayer').setAttribute('opacity', CFG.scene.grain);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.CAT  = () => S;
window.CATP = { CFG, applyColors, setDay: v => S.day = v,
                reset(){ Object.assign(S.cat, { x:236, y:640, wake:0, puff:0, stretch:0, face:-1 });
                         S.fish.out = false; S.fish.left = 1; S.mode = 'rest';
                         S.idle = 0; S.target = null; S.held = S.carrying = false; } };
})();
