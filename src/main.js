import { Game } from './game.js';
import { skins } from './skins/index.js';
import { TIERS } from './levels/generator.js';
import { SECTIONS, getSection, LEVELS_PER_SECTION } from './levels/campaign.js';
import { storage } from './storage.js';
import { formatTime } from './animation.js';

const $ = (id) => document.getElementById(id);
const screens = { menu: $('menu'), levels: $('levels'), hud: $('hud'), summary: $('summary') };

function show(...ids) {
  for (const [k, el] of Object.entries(screens)) el.hidden = !ids.includes(k);
}

let toastTimer = 0;
const ui = {
  showToast(text) {
    const t = $('toast');
    t.textContent = text;
    t.hidden = false;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  },
  setHud({ level, mode, tier, section, name }) {
    $('hud-level').textContent = mode === 'campaign'
      ? `${getSection(section).name} · ${level} / ${LEVELS_PER_SECTION}`
      : `Infinite · ${TIERS[tier].name} · Level ${level}`;
    $('dbg-name').textContent = name || '';
    $('dbg-peek').setAttribute('aria-pressed', 'false');
  },
  showSummary(times, section) {
    $('summary-title').textContent = `${getSection(section).name} complete`;
    const ol = $('summary-list');
    ol.innerHTML = '';
    times.forEach((ms, i) => {
      const li = document.createElement('li');
      li.textContent = `Level ${i + 1}: ${formatTime(ms)}`;
      ol.appendChild(li);
    });
    show('summary');
  },
};

const game = new Game($('board'), ui);
const DEBUG = new URLSearchParams(location.search).has('debug');
game.debug = DEBUG;
$('debug-bar').hidden = !DEBUG;
$('dbg-prev').addEventListener('click', () => game.jump(-1));
$('dbg-next').addEventListener('click', () => game.jump(1));
$('dbg-peek').addEventListener('click', () => {
  const on = $('dbg-peek').getAttribute('aria-pressed') !== 'true';
  $('dbg-peek').setAttribute('aria-pressed', String(on));
  game.peek(on);
});

const sel = $('skin-select');
for (const s of skins) {
  const o = document.createElement('option');
  o.value = s.id;
  o.textContent = s.name;
  sel.appendChild(o);
}
sel.value = game.skin.id;
sel.addEventListener('change', () => game.setSkin(sel.value));

const swayCheck = $('sway-check');
swayCheck.checked = game.sway;
swayCheck.addEventListener('change', () => game.setSway(swayCheck.checked));

const tierSel = $('tier-select');
for (const [id, t] of Object.entries(TIERS)) {
  const o = document.createElement('option');
  o.value = id;
  o.textContent = t.name;
  tierSel.appendChild(o);
}
tierSel.value = storage.get('tier', 'normal');
if (!TIERS[tierSel.value]) tierSel.value = 'normal';
tierSel.addEventListener('change', () => storage.set('tier', tierSel.value));

let currentSection = storage.get('section', SECTIONS[0].id);

function buildLevelSelect() {
  const tabs = $('section-tabs');
  tabs.innerHTML = '';
  for (const s of SECTIONS) {
    const t = document.createElement('button');
    t.className = 'tab';
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-selected', String(s.id === currentSection));
    t.textContent = s.name;
    t.addEventListener('click', () => { currentSection = s.id; storage.set('section', s.id); buildLevelSelect(); });
    tabs.appendChild(t);
  }
  const grid = $('level-grid');
  grid.innerHTML = '';
  const best = storage.get('best', {})[currentSection] || {};
  const unlocked = DEBUG ? Infinity : (storage.get('unlocked', {})[currentSection] || 1);
  for (let i = 1; i <= LEVELS_PER_SECTION; i++) {
    const b = document.createElement('button');
    b.className = 'lvl';
    b.disabled = i > unlocked;
    b.title = getSection(currentSection).levels[i - 1][0];
    b.innerHTML = `<span>${i}</span><small>${best[i] ? formatTime(best[i]) : '—'}</small>`;
    b.addEventListener('click', () => { show('hud'); game.startCampaign(currentSection, i); });
    grid.appendChild(b);
  }
}

$('btn-campaign').addEventListener('click', () => { buildLevelSelect(); show('levels'); });
$('btn-back').addEventListener('click', () => show('menu'));
$('btn-infinite').addEventListener('click', () => { show('hud'); game.startInfinite(tierSel.value); });
$('btn-menu').addEventListener('click', () => { game.stop(); show('menu'); });
$('btn-summary-menu').addEventListener('click', () => show('menu'));
show('menu');
