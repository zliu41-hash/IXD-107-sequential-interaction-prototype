/* Tool panel — "Street tuning".
   Hidden by default. Press T, or open the page with #tools.
   Change values live, restore the saved defaults, or copy the settings
   as a prompt to paste back into Claude Code. */
(() => {
const T = window.CATP, CFG = T.CFG, DEF = window.CAT_DEFAULTS;
const panel = document.getElementById('panel');

const GROUPS = [
  { name:'Light and colour', key:'colors', open:true, items:[
    ['skyNight','Sky at midnight','color'], ['skyDay','Sky at noon','color'],
    ['dusk','The burn at dawn and dusk','color'],
    ['roadNight','Road after dark','color'], ['roadDay','Road in daylight','color'],
    ['sodium','The street lamp','color'], ['cat','The cat','color'] ]},
  { name:'Pace', key:'motion', items:[
    ['dayLength','A whole day lasts','range',20,240,5,'s'],
    ['settleDelay','Left alone before it lies down','range',.2,6,.1,'s'],
    ['wakeSpeed','How sharply it startles','range',1,9,.2,'×'],
    ['sleepSpeed','How slowly it sinks back','range',.2,3,.1,'×'],
    ['walkSpeed','Walking speed','range',20,180,2,'px/s'] ]},
  { name:'The wet street', key:'scene', items:[
    ['reflection','How much the road gives back','range',0,1,.02,''],
    ['rain','Drizzle in the lamp cone','range',0,2,.05,'×'],
    ['grain','Film grain','range',0,.2,.005,''],
    ['lampFlicker','Lamp flicker','range',0,2,.05,'×'] ]},
  { name:'The cat', key:'cat', items:[
    ['size','Size','range',.8,1.8,.05,'×'],
    ['bristle','How far the fur stands up','range',0,2,.05,'×'],
    ['nightRoam','Wandering after dark','range',0,3,.1,'×'],
    ['appetite','Time spent eating','range',.5,6,.1,'s'] ]}
];
const fmt = (v,step) => step < 1 ? Number(v).toFixed(step < .1 ? 2 : 1) : String(Math.round(v));

function build(){
  let h = `<header><strong>Street tuning</strong><button type="button" id="tpClose" aria-label="Hide panel">Hide ✕</button></header>`;
  for(const g of GROUPS){
    h += `<details ${g.open?'open':''}><summary>${g.name}</summary><div class="rows">`;
    for(const it of g.items){
      const [k,label,type] = it, id = `tp-${g.key}-${k}`, v = CFG[g.key][k];
      h += type === 'color'
        ? `<label for="${id}">${label}<input type="color" id="${id}" value="${v}"></label>`
        : `<label for="${id}">${label}<span class="v" id="${id}-v">${fmt(v,it[5])} ${it[6]}</span>
            <input type="range" id="${id}" min="${it[3]}" max="${it[4]}" step="${it[5]}" value="${v}"></label>`;
    }
    h += `</div></details>`;
  }
  h += `<div class="actions">
      <button type="button" id="tpRestore">Restore defaults</button>
      <button type="button" class="primary" id="tpCopy">Copy settings</button>
      <button type="button" id="tpNoon">Jump to noon</button>
      <button type="button" id="tpNight">Jump to night</button>
      <button type="button" id="tpReset">Put the cat back</button>
    </div><div class="note" id="tpNote" role="status"></div>`;
  panel.innerHTML = h;

  for(const g of GROUPS) for(const it of g.items){
    const [k,,type] = it, el = document.getElementById(`tp-${g.key}-${k}`);
    el.addEventListener('input', () => {
      CFG[g.key][k] = type === 'range' ? Number(el.value) : el.value;
      if(type === 'range') document.getElementById(`tp-${g.key}-${k}-v`).textContent = `${fmt(el.value,it[5])} ${it[6]}`;
      if(g.key === 'colors') T.applyColors();
    });
  }
  document.getElementById('tpClose'  ).addEventListener('click', () => show(false));
  document.getElementById('tpNoon'   ).addEventListener('click', () => { T.setDay(.25); note('Midday.'); });
  document.getElementById('tpNight'  ).addEventListener('click', () => { T.setDay(.75); note('Middle of the night.'); });
  document.getElementById('tpReset'  ).addEventListener('click', () => { T.reset(); note('The cat is back in the middle of the street.'); });
  document.getElementById('tpRestore').addEventListener('click', () => {
    for(const g of GROUPS) Object.assign(CFG[g.key], JSON.parse(JSON.stringify(DEF[g.key])));
    T.applyColors(); build(); note('Restored the saved defaults.');
  });
  document.getElementById('tpCopy').addEventListener('click', copy);
}

function settingsText(){
  const lines = ['Cat Naps prototype — "Street tuning" panel settings',''];
  for(const g of GROUPS){
    lines.push(`${g.name} (CAT_DEFAULTS.${g.key} in js/config.js)`);
    for(const it of g.items){
      const [k,label,type] = it, v = CFG[g.key][k];
      lines.push(`- ${label} [${k}]: ${type === 'range' ? `${fmt(v,it[5])} ${it[6]}` : v}`);
    }
    lines.push('');
  }
  lines.push('Save these values as the prototype’s defaults in js/config.js. Keep the panel code so they can be adjusted again. Commit and push.');
  return lines.join('\n');
}
function copy(){
  const txt = settingsText();
  const fallback = () => {
    let ta = document.getElementById('tpText');
    if(!ta){ ta = document.createElement('textarea'); ta.id = 'tpText'; ta.setAttribute('aria-label','Settings to copy'); panel.appendChild(ta); }
    ta.value = txt; ta.focus(); ta.select(); note('Copy the selected text (Ctrl/Cmd + C).');
  };
  try { navigator.clipboard.writeText(txt).then(() => note('Settings copied. Paste them into Claude Code.'), fallback); }
  catch(e){ fallback(); }
}
function note(m){ const n = document.getElementById('tpNote'); if(n) n.textContent = m; }
function show(on){ panel.hidden = !on; if(on) build(); }

document.addEventListener('keydown', e => {
  if(e.target.closest && e.target.closest('input, select, textarea')) return;
  if(e.key === 't' || e.key === 'T') show(panel.hidden);
});
if(location.hash === '#tools') show(true);
addEventListener('hashchange', () => show(location.hash === '#tools'));
window.CAT_PANEL = { show, settingsText };
})();
