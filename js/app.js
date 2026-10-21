/* Gongfu Tea — one linear sequence built from three interaction studies:
   1 Heat the water (press + hold) → 2 Add the leaves (tap) → 3 Pour the tea (drag to tilt) → Your cup.
   Each step unlocks only after the previous one succeeds, and each choice is carried forward:
   the water temperature and the amount of leaf change how fast the tea steeps in step 3. */
(() => {
const CFG = JSON.parse(JSON.stringify(window.TEA_DEFAULTS));
const $ = id => document.getElementById(id);
const svg = $('stage');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------- colour ---------- */
const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(',')})`; };
function teaColor(s) {
  s = clamp(s, 0, 1);
  return s < 0.5 ? mixHex(CFG.colors.teaLight, CFG.colors.teaMid, s / 0.5) : mixHex(CFG.colors.teaMid, CFG.colors.teaStrong, (s - 0.5) / 0.5);
}
function applyColors() {
  const r = document.documentElement.style, c = CFG.colors;
  r.setProperty('--bg', c.background); r.setProperty('--porcelain', c.porcelain); r.setProperty('--ink', c.ink);
  r.setProperty('--accent', c.accent); r.setProperty('--water', c.water);
  $('g0').setAttribute('stop-color', c.teaLight); $('g1').setAttribute('stop-color', c.teaMid); $('g2').setAttribute('stop-color', c.teaStrong);
}

/* ---------- easing for scene changes ---------- */
const EASE = {
  linear: t => t,
  easeIn: t => t * t * t,
  easeOut: t => 1 - Math.pow(1 - t, 3),
  easeInOut: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: t => 1 - Math.cos(t * Math.PI * 3.5) * Math.exp(-t * 6)
};

/* ---------- sequence state ---------- */
const HEAD = ['Heat the water', 'Add the leaves', 'Pour the tea', 'Your cup'];
const LABEL = ['Heat', 'Leaves', 'Pour'];
const scenes = [$('sHeat'), $('sLeaves'), $('sPour'), $('sEnd')];
const G = { stage: 0, done: [false, false, false], trans: null, temp: 93, grams: 6, steep: 0, strength: .5, clock: 0, wait: null };
const live = i => G.stage === i && !G.trans;

function place(i, x) { scenes[i].setAttribute('transform', `translate(${x.toFixed(1)} 0)`); scenes[i].style.visibility = Math.abs(x) >= 389 ? 'hidden' : 'visible'; }
function goTo(n) { G.trans = { from: G.stage, to: n, t: 0 }; G.wait = null; }
function later(sec, fn) { G.wait = { t: sec, fn }; }

function drawSteps() {
  const xs = [95, 195, 295]; let s = `<line x1="95" x2="295" y1="128" y2="128" stroke="var(--soft)" stroke-width="2"/>`;
  if (G.done[0]) s += `<line x1="95" x2="${G.done[1] ? 295 : 195}" y1="128" y2="128" stroke="var(--accent)" stroke-width="2.5"/>`;
  xs.forEach((x, i) => {
    const done = G.done[i], active = G.stage === i;
    if (done) s += `<circle cx="${x}" cy="128" r="11" fill="var(--accent)"/><path d="M${x - 5} 128 l3.5 3.5 l6.5 -7" fill="none" stroke="var(--porcelain)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
    else if (active) {
      const p = reduce ? 0 : (G.clock % 1.6) / 1.6;
      s += `<circle cx="${x}" cy="128" r="${(11 + p * 9).toFixed(1)}" fill="none" stroke="var(--accent)" stroke-width="1.5" opacity="${(1 - p).toFixed(2)}"/><circle cx="${x}" cy="128" r="11" fill="var(--porcelain)" stroke="var(--accent)" stroke-width="2.5"/><circle cx="${x}" cy="128" r="4" fill="var(--accent)"/>`;
    } else s += `<circle cx="${x}" cy="128" r="10" fill="var(--porcelain)" stroke="var(--soft)" stroke-width="2"/>`;
    s += `<text x="${x}" y="158" font-size="11" text-anchor="middle" fill="${done || active ? 'var(--ink)' : 'var(--mid)'}">${LABEL[i]}</text>`;
  });
  $('steps').innerHTML = s;
}

function button(el, fn) {
  el.addEventListener('click', fn);
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } });
}

/* =====================================================================
   1  HEAT THE WATER — press + hold
   ===================================================================== */
const H = (() => {
  const T0 = 20, TMAX = 110, Y_TOP = 262, Y_BOT = 640;
  const yOf = t => Y_BOT - (t - T0) / (TMAX - T0) * (Y_BOT - Y_TOP);
  let tk = '';
  for (let t = 20; t <= 110; t += 10) {
    const y = yOf(t);
    tk += `<line x1="334" x2="${t % 20 === 0 ? 346 : 341}" y1="${y}" y2="${y}" stroke="var(--soft)" stroke-width="2"/>`;
    if (t % 20 === 0) tk += `<text x="352" y="${y + 4}" font-size="10" fill="var(--mid)">${t}</text>`;
  }
  $('hTicks').innerHTML = tk;
  let S;
  const reset = () => { S = { temp: T0, power: 0, holding: false, done: false, settle: 0, t: 0, pressR: 0, bub: [] }; };
  reset();
  const hit = $('hHit');
  const down = e => { if (!live(0) || S.done) return; S.holding = true; if (e && e.pointerId !== undefined) hit.setPointerCapture(e.pointerId); };
  const up = () => { S.holding = false; };
  hit.addEventListener('pointerdown', down); hit.addEventListener('pointerup', up);
  hit.addEventListener('pointercancel', up); hit.addEventListener('lostpointercapture', up);
  hit.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); down(e); } });
  hit.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') up(); });
  hit.addEventListener('contextmenu', e => e.preventDefault());
  const steamPath = (x, ph, h) => { let d = `M${x} 318`; for (let i = 1; i <= 6; i++) d += ` L${(x + Math.sin(ph + i * .9) * 6).toFixed(1)} ${(318 - i * h / 6).toFixed(1)}`; return d; };

  function update(dt) {
    const B = [CFG.targets.tempLow, CFG.targets.tempHigh];
    S.t += dt;
    S.power += ((S.holding ? 1 : 0) - S.power) * Math.min(1, dt * 3.2);
    const rate = (9 + .16 * (S.temp - T0)) * CFG.motion.heatSpeed;
    S.temp += S.power * rate * dt;
    const cool = S.temp > B[1] + 1 ? 2.2 : .6;
    if (!S.holding && !S.done) S.temp -= cool * dt * (1 - S.power);
    S.temp = clamp(S.temp, T0, TMAX);
    const inBand = S.temp >= B[0] && S.temp <= B[1];
    if (live(0) && !S.done && !S.holding && S.power < .15 && inBand) {
      S.settle += dt;
      if (S.settle > .8) { S.done = true; G.done[0] = true; G.temp = Math.round(S.temp); later(1.1, () => goTo(1)); }
    } else if (!S.done) S.settle = 0;

    $('hBand').setAttribute('y', yOf(B[1]) - 3); $('hBand').setAttribute('height', yOf(B[0]) - yOf(B[1]) + 6);
    $('hBandLbl').setAttribute('y', (yOf(B[0]) + yOf(B[1])) / 2 + 4); $('hBandLbl').textContent = `${B[0]}–${B[1]}°`;
    $('hBand').setAttribute('fill', S.done || inBand ? 'var(--accent)' : 'none');
    $('hBand').setAttribute('fill-opacity', S.done ? .35 : .15);
    const y = yOf(S.temp);
    $('hMerc').setAttribute('y', y); $('hMerc').setAttribute('height', 662 - y);
    $('hReadout').textContent = Math.round(S.temp) + '°';
    const tooHot = S.temp > 100;
    $('hHot').setAttribute('opacity', tooHot ? (.6 + .4 * Math.sin(S.t * 10)).toFixed(2) : 0);
    const k = (S.temp - T0) / (TMAX - T0);
    $('hWater').setAttribute('fill', mixHex(CFG.colors.water, CFG.colors.ink, k * .35));
    $('hCoil').setAttribute('stroke', mixHex(CFG.colors.ink, '#c0502e', S.power * .8));
    $('hCoil').setAttribute('stroke-width', (4 + S.power * 3).toFixed(1));
    const st = clamp((S.temp - 60) / 35, 0, 1);
    $('hSteam').setAttribute('opacity', st.toFixed(2));
    for (let i = 0; i < 3; i++) $('hSt' + i).setAttribute('d', steamPath(140 + i * 20, S.t * 4 + i * 2, 30 + st * 60));
    const boil = Math.max(0, (S.temp - 80) / 25);
    if (Math.random() < boil * dt * 30) S.bub.push({ x: 112 + Math.random() * 96, y: 500, r: 2 + Math.random() * 3 * boil });
    S.bub = S.bub.filter(b => (b.y -= (30 + 60 * boil) * dt) > 428);
    $('hBubbles').innerHTML = S.bub.map(b => `<circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="${b.r.toFixed(1)}"/>`).join('');
    const sh = tooHot && !reduce ? Math.sin(S.t * 60) * 2.2 * (S.temp - 100) / 10 : 0;
    $('hKettle').setAttribute('transform', `translate(${sh.toFixed(2)},0)`);
    S.pressR += ((S.holding ? 120 : 0) - S.pressR) * Math.min(1, dt * 8);
    $('hPress').setAttribute('r', S.pressR.toFixed(1));
    const idle = !S.done && !S.holding && S.temp < 40;
    if (idle && !reduce) { const p = (S.t % 2.2) / 2.2; $('hCue').setAttribute('r', 90 + p * 40); $('hCue').setAttribute('opacity', ((1 - p) * .9).toFixed(2)); }
    else $('hCue').setAttribute('opacity', idle ? .6 : 0);
    $('hDone').setAttribute('opacity', S.done ? 1 : 0);
  }
  return { reset, update, get state() { return S; } };
})();

/* =====================================================================
   2  ADD THE LEAVES — tap
   ===================================================================== */
const L = (() => {
  const N = 10, DX = 26, X0 = 195 - (N - 1) * DX / 2, MY = 698;
  const dotX = i => X0 + i * DX;
  let S;
  function drawMeter() {
    const HI = CFG.targets.gramsHigh; let m = '';
    for (let i = 0; i < N; i++) {
      const filled = i < S.count, extra = i >= HI, r = 7 + (i === S.pop ? 5 * (1 - S.popT) : 0);
      m += filled
        ? `<circle cx="${dotX(i)}" cy="${MY}" r="${r.toFixed(1)}" fill="${extra ? 'var(--porcelain)' : 'var(--ink)'}" stroke="var(--ink)" stroke-width="${extra ? 3 : 0}"/>` + (extra ? `<path d="M${dotX(i) - 4} ${MY - 4} l8 8 M${dotX(i) + 4} ${MY - 4} l-8 8" stroke="var(--ink)" stroke-width="2"/>` : '')
        : `<circle cx="${dotX(i)}" cy="${MY}" r="6" fill="none" stroke="var(--soft)" stroke-width="2"/>`;
    }
    $('lMeter').innerHTML = m;
  }
  function reset() {
    S = { count: 0, tiltT: 1, since: 0, done: false, over: false, t: 0, air: [], landed: [], spilled: [], pop: -1, popT: 1, ring: 1, shake: 0, no: 0 };
    $('lPile').innerHTML = ''; $('lSpill').innerHTML = ''; $('lAir').innerHTML = '';
    drawMeter(); retry(false);
  }
  function retry(on) { const r = $('lRetry'); r.setAttribute('opacity', on ? 1 : 0); r.style.pointerEvents = on ? 'auto' : 'none'; r.setAttribute('tabindex', on ? 0 : -1); }
  function pinch() {
    if (!live(1)) return;
    if (S.done || S.over || S.count >= N) { S.no = 1; return; }
    S.count++; S.since = 0; S.tiltT = 0; S.ring = 0; S.pop = S.count - 1; S.popT = 0;
    if (S.count > CFG.targets.gramsHigh) { S.over = true; S.shake = 1; }
    for (let i = 0; i < 7; i++) S.air.push({ x: 214 + Math.random() * 22, y: 250 + Math.random() * 10, vx: -10 - Math.random() * 55, vy: -60 + Math.random() * 40,
      a: Math.random() * 180, va: (Math.random() - .5) * 600, g: Math.random() < .5 ? 'var(--ink)' : 'var(--mid)', over: S.over });
    drawMeter();
  }
  const jar = $('lJarHit');
  jar.addEventListener('pointerdown', e => { e.preventDefault(); pinch(); });
  jar.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); pinch(); } });
  jar.addEventListener('contextmenu', e => e.preventDefault());
  button($('lRetry'), () => { if (live(1)) reset(); });
  reset();
  const surf = x => { const h = Math.min(S.count, CFG.targets.gramsHigh) * 7, u = (x - 195) / 80; return 584 - Math.max(0, h * (1 - u * u)) - 4; };
  const leaf = p => `<ellipse cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" rx="6" ry="2.6" fill="${p.g}" transform="rotate(${p.a.toFixed(0)} ${p.x.toFixed(1)} ${p.y.toFixed(1)})"/>`;

  function update(dt) {
    const LO = CFG.targets.gramsLow, HI = CFG.targets.gramsHigh, X = dotX;
    S.t += dt; S.since += dt;
    $('lBracket').setAttribute('x', X(LO - 1) - 16); $('lBracket').setAttribute('width', X(HI - 1) - X(LO - 1) + 32);
    $('lBracketLbl').setAttribute('x', (X(LO - 1) + X(HI - 1)) / 2); $('lBracketLbl').textContent = `${LO}–${HI} g`;
    S.tiltT = Math.min(1, S.tiltT + dt / .45);
    const tip = Math.sin(Math.PI * S.tiltT) * -32;
    const wob = (live(1) && !S.done && S.count === 0 && !reduce) ? Math.sin(S.t * 6) * 4 * Math.pow(Math.max(0, Math.sin(S.t * 1.3)), 8) : 0;
    S.no = Math.max(0, S.no - dt * 2.5);
    const noShake = reduce ? 0 : Math.sin(S.t * 40) * 5 * S.no;
    $('lJar').setAttribute('transform', `translate(${noShake.toFixed(1)},0) rotate(${(tip + wob).toFixed(1)} 230 320)`);
    S.ring = Math.min(1, S.ring + dt * 2.5);
    $('lTapRing').setAttribute('r', (20 + S.ring * 70).toFixed(1)); $('lTapRing').setAttribute('opacity', ((1 - S.ring) * .8).toFixed(2));
    let landed = false, spilled = false;
    for (const p of S.air) {
      p.vy += CFG.motion.leafGravity * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
      const inside = p.x > 112 && p.x < 278;
      if (p.over && p.y > 455 && inside && !p.bounced) { p.bounced = true; p.vy = -260; p.vx = (p.x < 195 ? -1 : 1) * (90 + Math.random() * 80); }
      else if (!p.over && inside && p.y >= surf(p.x)) { p.y = surf(p.x); p.dead = 'pile'; }
      if (p.bounced && p.y >= 594) { p.y = 594 - Math.random() * 6; p.dead = 'spill'; }
      if (p.y > 900) p.dead = 'gone';
    }
    for (const p of S.air) { if (p.dead === 'pile') { S.landed.push(p); landed = true; } if (p.dead === 'spill') { S.spilled.push(p); spilled = true; } }
    if (landed) $('lPile').innerHTML = S.landed.map(leaf).join('');
    if (spilled) $('lSpill').innerHTML = S.spilled.map(leaf).join('');
    S.air = S.air.filter(p => !p.dead);
    $('lAir').innerHTML = S.air.map(leaf).join('');
    if (live(1) && !S.done && !S.over && S.count >= LO && S.count <= HI && S.since > 1.4 && S.air.length === 0) {
      S.done = true; G.done[1] = true; G.grams = S.count; later(1.1, () => goTo(2));
    }
    $('lTarget').setAttribute('opacity', S.done ? 0 : (S.count >= LO && !S.over ? 1 : (.5 + .5 * Math.pow(Math.sin(S.t * 3), 2)).toFixed(2)));
    S.shake = Math.max(0, S.shake - dt * 1.8);
    $('lBowlG').setAttribute('transform', `translate(${reduce ? 0 : (Math.sin(S.t * 50) * 4 * S.shake).toFixed(1)},0)`);
    if (S.popT < 1) { S.popT = Math.min(1, S.popT + dt * 4); drawMeter(); }
    $('lDone').setAttribute('opacity', S.done ? 1 : 0);
    $('lOver').setAttribute('opacity', S.over ? 1 : 0);
    if (S.over && S.air.length === 0 && $('lRetry').getAttribute('opacity') === '0') retry(true);
  }
  return { reset, update, redraw: () => drawMeter(), get state() { return S; } };
})();

/* =====================================================================
   3  POUR THE TEA — drag to tilt
   ===================================================================== */
const P = (() => {
  const PIV = [210, 280], TSPAN = 30, SMAX = 35, SHIFT = 40;   // the scene is drawn 40px lower so the tilted bowl clears the header
  const scaleX = s => 60 + clamp(s, 0, 1) * 270;
  const arc = (cx, cy, r, a0, a1) => {
    const p = a => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  let S;
  const rate = () => clamp(((G.temp - 60) / 33) * (G.grams / 6), .4, 2.5);     // your earlier choices speed up or slow down the steep
  const win = () => [CFG.targets.steepLow / SMAX, CFG.targets.steepHigh / SMAX]; // target strength window
  function retry(on) { const r = $('pRetry'); r.setAttribute('opacity', on ? 1 : 0); r.style.pointerEvents = on ? 'auto' : 'none'; r.setAttribute('tabindex', on ? 0 : -1); }
  function reset() {
    S = { phase: 'fill', ft: 0, t: 0, ang: 0, target: 0, drag: null, v: 0, pv: 0, pSum: 0, done: false, good: false, clock: 0, grip: 0 };
    $('pMarker').setAttribute('opacity', 0); $('pVerdict').setAttribute('opacity', 0); retry(false);
    // leaves sitting in the bottom of the gaiwan (3 shapes per gram)
    let lv = ''; const n = G.grams * 3;
    for (let i = 0; i < n; i++) { const x = 92 + Math.random() * 96, y = 340 + Math.random() * 16 - Math.abs(x - 140) * .12; lv += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="7" ry="3" fill="var(--ink)" opacity=".75" transform="rotate(${(Math.random() * 180).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    $('pLeafIn').innerHTML = lv;
    $('pLid').style.display = 'none';
  }
  const hit = $('pGwHit');
  hit.addEventListener('pointerdown', e => {
    if (!live(2) || S.phase !== 'steep') return;
    const p = toSvg(e); S.drag = { x: p.x, y: p.y }; hit.setPointerCapture(e.pointerId); hit.classList.add('grabbing');
    $('pGrip').setAttribute('cx', p.x); $('pGrip').setAttribute('cy', p.y - SHIFT);
  });
  hit.addEventListener('pointermove', e => {
    if (!S.drag) return;
    const p = toSvg(e); $('pGrip').setAttribute('cx', p.x); $('pGrip').setAttribute('cy', p.y - SHIFT);
    const d = (p.x - S.drag.x) * .55 + (p.y - S.drag.y) * .45;
    S.target = d < 0 ? Math.max(-6, d * .08) : Math.min(115, d * .75);
  });
  const end = () => { S.drag = null; S.target = 0; hit.classList.remove('grabbing'); };
  hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end); hit.addEventListener('lostpointercapture', end);
  hit.addEventListener('keydown', e => {
    if (!live(2) || S.phase !== 'steep') return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); S.target = Math.min(115, S.target + 12); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); S.target = Math.max(0, S.target - 12); }
  });
  button($('pRetry'), () => { if (live(2)) reset(); });
  reset();

  // kettle pose for the fill bridge
  function kettle(x, y, a, alpha) {
    $('pKettle').setAttribute('opacity', alpha.toFixed(2));
    $('pKBody').setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(.55) rotate(${a.toFixed(1)} 160 432)`);
    const r = a * Math.PI / 180, dx = 60 - 160, dy = 356 - 432;
    return [x + .55 * (160 + dx * Math.cos(r) - dy * Math.sin(r)), y + .55 * (432 + dx * Math.sin(r) + dy * Math.cos(r))];
  }

  function update(dt) {
    S.clock += dt;
    const rt = rate(), W = win();
    const s = clamp(S.t * rt / SMAX, 0, 1);       // strength of the brew right now
    // ---- fill bridge: the hot kettle comes back and fills the gaiwan ----
    if (S.phase === 'fill') {
      if (live(2)) S.ft += dt;
      const f = S.ft; let x = 182, y = -8, a = 0, al = 1;
      if (f < .6) { const e = EASE.easeOut(f / .6); x = 182 + (1 - e) * 140; al = e; }
      else if (f < 1) a = -40 * EASE.easeInOut((f - .6) / .4);
      else if (f < 2.4) { a = -40; S.v = clamp((f - 1) / 1.4, 0, 1); }
      else if (f < 2.8) a = -40 * (1 - EASE.easeInOut((f - 2.4) / .4));
      else if (f < 3.3) { const e = EASE.easeIn((f - 2.8) / .5); x = 182 + e * 160; al = 1 - e; }
      else { S.phase = 'steep'; S.t = 0; al = 0; $('pLid').style.display = ''; }
      const tip = kettle(x, y, a, al);
      if (f > 1 && f < 2.4) $('pKStream').setAttribute('d', `M${tip[0].toFixed(1)} ${tip[1].toFixed(1)} Q${(tip[0] - 20).toFixed(1)} ${(tip[1] + 10).toFixed(1)} 145 ${(350 - S.v * 50).toFixed(1)}`);
      else $('pKStream').setAttribute('d', '');
      $('pKStream').setAttribute('stroke', CFG.colors.water);
    } else if (!S.done && live(2)) S.t += dt;

    // ---- tilt ----
    S.ang += (S.target - S.ang) * Math.min(1, dt * (S.drag ? 10 : 6));
    const nudge = (!S.drag && !S.done && S.phase === 'steep' && S.t * rt >= CFG.targets.steepLow && !reduce) ? 5 * Math.pow(Math.max(0, Math.sin(S.clock * 2.4)), 6) : 0;
    const ang = S.ang + nudge, tf = `rotate(${ang.toFixed(2)} ${PIV[0]} ${PIV[1]})`;
    $('pGw').setAttribute('transform', tf); $('bowlClipPath').setAttribute('transform', tf);
    hit.setAttribute('aria-valuenow', Math.round(S.ang));
    const thr = 22 + (1 - S.v) * 78;
    const flow = S.done || S.phase !== 'steep' ? 0 : clamp((S.ang - thr) / 28, 0, 1.2) * CFG.motion.pourFlow;
    const dv = Math.min(S.v, flow * .42 * dt);
    S.v -= dv; S.pv += dv; S.pSum += dv * s;
    const upright = 356 - S.v * 66;
    const top = S.v < .005 ? 640 : PIV[1] + (upright - PIV[1]) * clamp(1 - S.ang / thr, 0, 1);
    $('pBowlTea').setAttribute('y', top.toFixed(1));
    $('pBowlTea').setAttribute('fill', S.phase === 'fill' ? mixHex(CFG.colors.water, CFG.colors.teaLight, S.v * .6) : teaColor(s));
    const pS = S.pv > 0 ? S.pSum / S.pv : s, pTop = 686 - S.pv * 140;
    $('pPotTea').setAttribute('y', pTop.toFixed(1)); $('pPotTea').setAttribute('height', (700 - pTop).toFixed(1));
    $('pPotTea').setAttribute('fill', teaColor(pS));
    if (flow > .01) {
      $('pStream').setAttribute('d', `M${PIV[0] + 2} ${PIV[1] + 2} Q${PIV[0] + 34} ${PIV[1] + 14} ${(258 + flow * 6).toFixed(1)} ${Math.max(540, pTop).toFixed(1)}`);
      $('pStream').setAttribute('stroke-width', (2 + flow * 7).toFixed(1)); $('pStream').setAttribute('stroke', teaColor(s));
    } else $('pStream').setAttribute('stroke-width', 0);
    S.grip += ((S.drag ? 34 : 0) - S.grip) * Math.min(1, dt * 10);
    $('pGrip').setAttribute('r', S.grip.toFixed(1));
    $('pGuide').setAttribute('opacity', !S.done && S.phase === 'steep' && S.t * rt >= CFG.targets.steepLow && S.pv < .02 ? (.5 + .5 * Math.pow(Math.sin(S.clock * 3), 2)).toFixed(2) : 0);

    // ---- timer (seconds on the clock; the shaded window shifts with your water and leaf) ----
    const w0 = CFG.targets.steepLow / rt, w1 = CFG.targets.steepHigh / rt;
    $('pWin').setAttribute('d', arc(95, 600, 32, Math.min(w0, TSPAN - .1) / TSPAN * 2 * Math.PI, Math.min(w1, TSPAN - .05) / TSPAN * 2 * Math.PI));
    $('pWinLbl').textContent = `${Math.round(w0)}–${Math.round(w1)} s`;
    const tt = Math.min(S.t, TSPAN);
    $('pArc').setAttribute('d', tt > .05 ? arc(95, 600, 32, 0, Math.min(tt / TSPAN, .9999) * 2 * Math.PI) : '');
    $('pTxt').textContent = Math.floor(S.t) + 's';
    $('pWinBar').setAttribute('x', scaleX(W[0]) - 4); $('pWinBar').setAttribute('width', scaleX(W[1]) - scaleX(W[0]) + 8);

    let st = '';
    if (S.v > .05 && Math.abs(S.ang) < 30) for (let i = 0; i < 3; i++) {
      const x = 116 + i * 24; let d = `M${x} 222`;
      for (let k = 1; k <= 5; k++) d += ` L${(x + Math.sin(S.clock * 3 + i + k) * 5).toFixed(1)} ${222 - k * 9}`;
      st += `<path d="${d}" opacity="${(S.v * .8).toFixed(2)}"/>`;
    }
    $('pSteam').innerHTML = st;

    if (live(2) && !S.done && S.phase === 'steep' && S.v < .02 && S.pv > .5) {
      S.done = true; end();
      S.good = pS >= W[0] && pS <= W[1];
      $('pMarker').setAttribute('transform', `translate(${scaleX(pS).toFixed(1)} 748)`); $('pMarker').setAttribute('opacity', 1);
      $('pVerdict').innerHTML = S.good
        ? `<circle cx="195" cy="430" r="22" fill="var(--accent)"/><path d="M185 430 l7 7 l13 -14" fill="none" stroke="var(--porcelain)" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`
        : `<circle cx="195" cy="430" r="22" fill="var(--porcelain)" stroke="var(--ink)" stroke-width="3"/><path d="M187 422 l16 16 M203 422 l-16 16" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
      $('pVerdict').setAttribute('opacity', 1);
      if (S.good) { G.done[2] = true; G.strength = pS; G.steep = Math.round(pS * SMAX / rt); later(1.6, () => goTo(3)); }
      else retry(true);
    }
  }
  return { reset, update, get state() { return S; } };
})();

/* =====================================================================
   END — your cup
   ===================================================================== */
const E = (() => {
  let t = 0;
  function enter() {
    t = 0;
    const c = teaColor(G.strength);
    $('eTea').setAttribute('fill', c); $('eSurface').setAttribute('fill', c);
    const W0 = CFG.targets.steepLow / 35, W1 = CFG.targets.steepHigh / 35, u = (G.strength - W0) / Math.max(.001, W1 - W0);
    $('eTitle').textContent = u < 1 / 3 ? 'Light and bright' : u < 2 / 3 ? 'Balanced' : 'Rich and deep';
    const rows = [['Water', `${G.temp} °C`], ['Leaves', `${G.grams} g`], ['Steep', `${G.steep} s`]];
    $('eRows').innerHTML = rows.map((r, i) => `<text x="110" y="${618 + i * 30}" fill="var(--mid)">${r[0]}</text><text class="num" x="280" y="${618 + i * 30}" text-anchor="end">${r[1]}</text><line x1="110" x2="280" y1="${626 + i * 30}" y2="${626 + i * 30}" stroke="var(--faint)" stroke-width="1.5"/>`).join('');
  }
  function update(dt) {
    t += dt; let st = '';
    for (let i = 0; i < 3; i++) {
      const x = 170 + i * 25; let d = `M${x} 352`;
      for (let k = 1; k <= 6; k++) d += ` L${(x + Math.sin(t * 2.5 + i * 1.3 + k * .8) * 6).toFixed(1)} ${352 - k * 13}`;
      st += `<path d="${d}" opacity=".8"/>`;
    }
    $('eSteam').innerHTML = st;
  }
  button($('eAgain'), () => { if (live(3)) resetAll(); });
  return { enter, update };
})();

/* ---------- sequence control ---------- */
function resetAll() {
  G.stage = 0; G.done = [false, false, false]; G.trans = null; G.wait = null;
  H.reset(); L.reset(); P.reset();
  scenes.forEach((s, i) => place(i, i === 0 ? 0 : 390));
  $('headline').textContent = HEAD[0];
}
button($('resetAll'), resetAll);

let last = performance.now();
function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; G.clock += dt;
  if (G.wait) { G.wait.t -= dt; if (G.wait.t <= 0) { const fn = G.wait.fn; G.wait = null; fn(); } }
  if (G.trans) {
    const T = G.trans; T.t += dt * 1000;
    const p = Math.min(1, T.t / Math.max(1, CFG.motion.transitionMs)), e = (EASE[CFG.motion.easing] || EASE.easeInOut)(reduce ? 1 : p);
    place(T.from, -390 * e); place(T.to, 390 * (1 - e));
    if (p >= 1) { place(T.from, -390); place(T.to, 0); G.stage = T.to; G.trans = null; $('headline').textContent = HEAD[G.stage]; if (G.stage === 2) P.reset(); if (G.stage === 3) E.enter(); }
  }
  H.update(dt); L.update(dt); P.update(dt); if (G.stage === 3 || (G.trans && G.trans.to === 3)) E.update(dt);
  drawSteps();
  requestAnimationFrame(frame);
}
applyColors(); resetAll(); requestAnimationFrame(frame);

// shared with the tool panel
window.TEA = { CFG, applyColors, resetAll, redraw: () => L.redraw(), G, H, L, P, goTo, teaColor };
})();
