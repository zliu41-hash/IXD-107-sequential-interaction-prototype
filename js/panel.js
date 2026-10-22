/* Tool panel — "Room tuning".
   Hidden by default. Show it with the T key or by opening the page with #tools. */
(() => {
const T=window.CAT, CFG=T.CFG, DEF=window.CAT_DEFAULTS;
const panel=document.getElementById('panel');
const GROUPS=[
  {name:'Appearance', key:'colors', open:true, items:[
    ['wall','Walls','color'],['floor','Floor','color'],['ink','Ink (outlines, cat)','color'],
    ['sun','Sunbeam','color'],['cushion','Cushion','color'],['accent','Accent (cues, success)','color'],['night','Night (the dim)','color']]},
  {name:'Motion', key:'motion', items:[
    ['curtainLag','Curtain follow','range',3,20,1,''],
    ['smoothPower','Smoothing per stroke','range',.4,2,.1,'×'],
    ['hushRate','Quiet gained','range',.1,.8,.01,'/s'],
    ['leakRate','Quiet lost','range',.1,.9,.01,'/s'],
    ['transitionMs','Scene change','range',200,1800,50,'ms'],
    ['easing','Scene easing','select',['linear','easeIn','easeOut','easeInOut','spring']]]},
  {name:'Targets', key:'targets', items:[
    ['beamLow','Curtain · from','range',.2,.8,.02,''],
    ['beamHigh','Curtain · to','range',.4,1,.02,''],
    ['smoothMin','Cushion smoothness','range',.3,.95,.01,''],
    ['loftMin','Cushion loft floor','range',.05,.6,.01,''],
    ['hushHold','Quiet needed','range',.3,4,.1,'s']]}
];
const EASE_NAMES={linear:'Linear',easeIn:'Ease In',easeOut:'Ease Out',easeInOut:'Ease In-Out',spring:'Spring / Bounce'};
const fmt=(v,step)=> step<1 ? Number(v).toFixed(2).replace(/0$/,'') : String(Math.round(v));

function build(){
  let h=`<header><strong>Room tuning</strong><button type="button" id="tpClose" aria-label="Hide panel">Hide ✕</button></header>`;
  for(const g of GROUPS){
    h+=`<details ${g.open?'open':''}><summary>${g.name}</summary><div class="rows">`;
    for(const it of g.items){
      const [k,label,type]=it, id=`tp-${g.key}-${k}`, v=CFG[g.key][k];
      if(type==='color') h+=`<label for="${id}">${label}<input type="color" id="${id}" value="${v}"></label>`;
      else if(type==='select') h+=`<label for="${id}">${label}<select id="${id}">${it[3].map(o=>`<option value="${o}" ${o===v?'selected':''}>${EASE_NAMES[o]}</option>`).join('')}</select></label>`;
      else h+=`<label for="${id}">${label}<span class="v" id="${id}-v">${fmt(v,it[5])} ${it[6]}</span><input type="range" id="${id}" min="${it[3]}" max="${it[4]}" step="${it[5]}" value="${v}"></label>`;
    }
    h+=`</div></details>`;
  }
  h+=`<div class="actions"><button type="button" id="tpRestore">Restore defaults</button><button type="button" class="primary" id="tpCopy">Copy settings</button><button type="button" id="tpReplay">Replay sequence</button></div><div class="note" id="tpNote" role="status"></div>`;
  panel.innerHTML=h;
  for(const g of GROUPS) for(const it of g.items){
    const [k,,type]=it, el=document.getElementById(`tp-${g.key}-${k}`);
    el.addEventListener('input',()=>{
      CFG[g.key][k] = type==='range' ? Number(el.value) : el.value;
      if(type==='range') document.getElementById(`tp-${g.key}-${k}-v`).textContent=`${fmt(el.value,it[5])} ${it[6]}`;
      keepValid(g.key,k);
      if(g.key==='colors') T.applyColors();
    });
  }
  document.getElementById('tpClose').addEventListener('click',()=>show(false));
  document.getElementById('tpRestore').addEventListener('click',()=>{ for(const g of GROUPS) Object.assign(CFG[g.key],JSON.parse(JSON.stringify(DEF[g.key]))); T.applyColors(); build(); note('Restored the saved defaults.'); });
  document.getElementById('tpReplay').addEventListener('click',()=>{ T.resetAll(); note('Sequence restarted.'); });
  document.getElementById('tpCopy').addEventListener('click',copy);
}
function keepValid(group,key){
  if(group!=='targets') return;
  const t=CFG.targets;
  if(t.beamLow>=t.beamHigh){ if(key==='beamLow') t.beamHigh=Math.min(1,t.beamLow+.04); else t.beamLow=Math.max(0,t.beamHigh-.04); }
  for(const k of ['beamLow','beamHigh']){ const el=document.getElementById(`tp-targets-${k}`); if(el&&Number(el.value)!==t[k]){ el.value=t[k]; const v=document.getElementById(`tp-targets-${k}-v`); if(v) v.textContent=`${fmt(t[k],.02)} `; } }
}
function settingsText(){
  const lines=['Cat Naps prototype — "Room tuning" panel settings',''];
  for(const g of GROUPS){
    lines.push(`${g.name} (CAT_DEFAULTS.${g.key} in js/config.js)`);
    for(const it of g.items){ const [k,label,type]=it, v=CFG[g.key][k];
      lines.push(`- ${label} [${k}]: ${type==='range'?`${fmt(v,it[5])} ${it[6]}`:type==='select'?`${v} (${EASE_NAMES[v]})`:v}`); }
    lines.push('');
  }
  lines.push('Apply these values as the prototype’s saved defaults. Retain the panel code for later adjustments. Commit and push the changes.');
  return lines.join('\n');
}
function copy(){
  const txt=settingsText();
  const fallback=()=>{ let ta=document.getElementById('tpText'); if(!ta){ ta=document.createElement('textarea'); ta.id='tpText'; ta.setAttribute('aria-label','Settings to copy'); panel.appendChild(ta);} ta.value=txt; ta.focus(); ta.select(); note('Copy the selected text (Ctrl/Cmd + C).'); };
  try{ navigator.clipboard.writeText(txt).then(()=>note('Settings copied. Paste them into Claude Code.'),fallback); }catch(e){ fallback(); }
}
function note(m){ const n=document.getElementById('tpNote'); if(n) n.textContent=m; }
function show(on){ panel.hidden=!on; if(on) build(); }
document.addEventListener('keydown',e=>{ if(e.target.closest&&e.target.closest('input, select, textarea')) return; if(e.key==='t'||e.key==='T') show(panel.hidden); });
if(location.hash==='#tools') show(true);
window.addEventListener('hashchange',()=>show(location.hash==='#tools'));
window.CAT_PANEL={show,settingsText};
})();
