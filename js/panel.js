/* Tool panel — "Tea tuning".
   Hidden by default. Show it with the T key or by opening the page with #tools.
   Adjust values live, Restore defaults, or Copy settings to paste into Claude Code. */
(() => {
const T = window.TEA, CFG = T.CFG, DEF = window.TEA_DEFAULTS;
const panel = document.getElementById('panel');

const GROUPS = [
  { name: 'Appearance', key: 'colors', open: true, items: [
    ['background', 'Room background', 'color'], ['porcelain', 'Porcelain', 'color'], ['ink', 'Ink (outlines, text)', 'color'],
    ['accent', 'Accent (cues, success)', 'color'], ['water', 'Fresh water', 'color'],
    ['teaLight', 'Tea · light', 'color'], ['teaMid', 'Tea · balanced', 'color'], ['teaStrong', 'Tea · strong', 'color'] ] },
  { name: 'Motion', key: 'motion', items: [
    ['heatSpeed', 'Heating speed', 'range', .4, 2.5, .1, '×'], ['leafGravity', 'Leaf fall gravity', 'range', 400, 2200, 50, 'px/s²'],
    ['pourFlow', 'Pour flow', 'range', .4, 2, .1, '×'], ['transitionMs', 'Scene change', 'range', 200, 1800, 50, 'ms'],
    ['easing', 'Scene easing', 'select', ['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring']] ] },
  { name: 'Targets', key: 'targets', items: [
    ['tempLow', 'Water · low', 'range', 75, 99, 1, '°C'], ['tempHigh', 'Water · high', 'range', 80, 100, 1, '°C'],
    ['gramsLow', 'Leaf · low', 'range', 2, 9, 1, 'g'], ['gramsHigh', 'Leaf · high', 'range', 3, 10, 1, 'g'],
    ['steepLow', 'Steep · from', 'range', 3, 25, 1, 's'], ['steepHigh', 'Steep · to', 'range', 6, 34, 1, 's'] ] }
];
const EASE_NAMES = { linear: 'Linear', easeIn: 'Ease In', easeOut: 'Ease Out', easeInOut: 'Ease In-Out', spring: 'Spring / Bounce' };
const fmt = (v, step) => step < 1 ? Number(v).toFixed(1) : String(Math.round(v));

function build() {
  let h = `<header><strong>Tea tuning</strong><button type="button" id="tpClose" aria-label="Hide panel">Hide ✕</button></header>`;
  for (const g of GROUPS) {
    h += `<details ${g.open ? 'open' : ''}><summary>${g.name}</summary><div class="rows">`;
    for (const it of g.items) {
      const [k, label, type] = it, id = `tp-${g.key}-${k}`, v = CFG[g.key][k];
      if (type === 'color') h += `<label for="${id}">${label}<input type="color" id="${id}" value="${v}"></label>`;
      else if (type === 'select') h += `<label for="${id}">${label}<select id="${id}">${it[3].map(o => `<option value="${o}" ${o === v ? 'selected' : ''}>${EASE_NAMES[o]}</option>`).join('')}</select></label>`;
      else h += `<label for="${id}">${label}<span class="v" id="${id}-v">${fmt(v, it[5])} ${it[6]}</span><input type="range" id="${id}" min="${it[3]}" max="${it[4]}" step="${it[5]}" value="${v}"></label>`;
    }
    h += `</div></details>`;
  }
  h += `<div class="actions"><button type="button" id="tpRestore">Restore defaults</button><button type="button" class="primary" id="tpCopy">Copy settings</button><button type="button" id="tpReplay">Replay sequence</button></div><div class="note" id="tpNote" role="status"></div>`;
  panel.innerHTML = h;
  for (const g of GROUPS) for (const it of g.items) {
    const [k, , type] = it, el = document.getElementById(`tp-${g.key}-${k}`);
    el.addEventListener('input', () => {
      CFG[g.key][k] = type === 'range' ? Number(el.value) : el.value;
      if (type === 'range') document.getElementById(`tp-${g.key}-${k}-v`).textContent = `${fmt(el.value, it[5])} ${it[6]}`;
      keepRangesValid(g.key, k);
      if (g.key === 'colors') T.applyColors();
      if (g.key === 'targets') T.redraw();
    });
  }
  document.getElementById('tpClose').addEventListener('click', () => show(false));
  document.getElementById('tpRestore').addEventListener('click', () => { for (const g of GROUPS) Object.assign(CFG[g.key], JSON.parse(JSON.stringify(DEF[g.key]))); T.applyColors(); build(); note('Restored the saved defaults.'); });
  document.getElementById('tpReplay').addEventListener('click', () => { T.resetAll(); note('Sequence restarted.'); });
  document.getElementById('tpCopy').addEventListener('click', copy);
}
function keepRangesValid(group, key) {
  const t = CFG.targets, pairs = [['tempLow', 'tempHigh'], ['gramsLow', 'gramsHigh'], ['steepLow', 'steepHigh']];
  if (group !== 'targets') return;
  for (const [a, b] of pairs) if (t[a] >= t[b]) { if (key === a) t[b] = t[a] + 1; else t[a] = t[b] - 1; }
  for (const k of ['tempLow', 'tempHigh', 'gramsLow', 'gramsHigh', 'steepLow', 'steepHigh']) {
    const el = document.getElementById(`tp-targets-${k}`); if (el && Number(el.value) !== t[k]) { el.value = t[k]; const v = document.getElementById(`tp-targets-${k}-v`); if (v) v.textContent = v.textContent.replace(/^[\d.]+/, t[k]); }
  }
}
function settingsText() {
  const lines = ['Gongfu Tea prototype — "Tea tuning" panel settings', ''];
  for (const g of GROUPS) {
    lines.push(`${g.name} (TEA_DEFAULTS.${g.key} in js/config.js)`);
    for (const it of g.items) {
      const [k, label, type] = it, v = CFG[g.key][k];
      lines.push(`- ${label} [${k}]: ${type === 'range' ? `${fmt(v, it[5])} ${it[6]}` : type === 'select' ? `${v} (${EASE_NAMES[v]})` : v}`);
    }
    lines.push('');
  }
  lines.push('Apply these values as the prototype’s saved defaults. Retain the panel code for later adjustments. Commit and push the changes.');
  return lines.join('\n');
}
function copy() {
  const txt = settingsText();
  const fallback = () => {
    let ta = document.getElementById('tpText');
    if (!ta) { ta = document.createElement('textarea'); ta.id = 'tpText'; ta.setAttribute('aria-label', 'Settings to copy'); panel.appendChild(ta); }
    ta.value = txt; ta.focus(); ta.select(); note('Copy the selected text (Ctrl/Cmd + C).');
  };
  try { navigator.clipboard.writeText(txt).then(() => note('Settings copied. Paste them into Claude Code.'), fallback); } catch (e) { fallback(); }
}
function note(m) { const n = document.getElementById('tpNote'); if (n) n.textContent = m; }
function show(on) { panel.hidden = !on; if (on) build(); }

document.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, select, textarea')) return;
  if (e.key === 't' || e.key === 'T') show(panel.hidden);
});
if (location.hash === '#tools') show(true);
window.addEventListener('hashchange', () => show(location.hash === '#tools'));
window.TEA_PANEL = { show, settingsText };
})();
