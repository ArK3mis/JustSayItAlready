import { Scene, THEMES, ROOMS, FLAVORS, NOTE_COLORS, SKINS, HAIRS, SHIRTS, TEMPLATES, MAX_PHOTOS, MAX_NOTES, defaultScene, migrate, fromTemplate, visualsOf, pixelate } from './pixel.js';
import { sfx, music, audio } from './sound.js';
import * as store from './store.js';
import { scratchGame, catchGame, recorder } from './games.js';
import { makeGIF, makePostcard, download } from './gif.js';

const app = document.getElementById('app');
let scene = null;           // the live Scene renderer on screen
let cleanups = [];          // things to undo when the page changes
let community = [];         // community templates (Supabase mode)

// ---------- tiny DOM helper ----------
function h(tag, attrs = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === false || v == null) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => c != null && c !== false && el.append(c.nodeType ? c : document.createTextNode(c)));
  return el;
}
const toast = (msg, kind = '') => {
  const t = h('div', { class: 'toast ' + kind }, msg); document.body.append(t);
  setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3000);
};
function modal(title, body, actions = [], { wide = false } = {}) {
  const close = () => { ov.remove(); };
  const ov = h('div', { class: 'overlay', onclick: e => { if (e.target === ov) close(); } },
    h('div', { class: 'win' + (wide ? ' wide' : '') },
      h('div', { class: 'win-bar' }, h('span', {}, title), h('button', { class: 'x', 'aria-label': 'close', onclick: close }, '×')),
      h('div', { class: 'win-body' }, body),
      actions.length ? h('div', { class: 'win-actions' }, actions.map(a => h('button', { class: 'btn ' + (a.kind || ''), onclick: () => a.run(close) }, a.label))) : null));
  document.body.append(ov); sfx.pop(); return close;
}
document.addEventListener('click', e => { const b = e.target.closest('button, .chip, a.btn'); if (b && !b.dataset.quiet) sfx.boop(); });
const pad = n => String(n).padStart(2, '0');
const toLocalInput = iso => { if (!iso) return ''; const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fmtDate = iso => new Date(iso).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' });
const mark = e => { e.currentTarget.parentNode.querySelectorAll('.on').forEach(c => c.classList.remove('on')); e.currentTarget.classList.add('on'); };
async function copyText(text, input) { try { await navigator.clipboard.writeText(text); } catch (e) { input?.select(); document.execCommand('copy'); } sfx.success(); toast('Copied! ♥', 'ok'); }

// ---------- shell ----------
const bar = document.getElementById('bar');
function renderBar() {
  const me = store.getUser();
  bar.replaceChildren(
    h('a', { class: 'logo', href: '#/' }, h('span', { class: 'logo-ico' }, '💌'), 'JustSayItAlready'),
    h('div', { class: 'bar-right' },
      h('button', { class: 'icon-btn', title: 'Sound on/off', 'data-quiet': 1, onclick: () => { audio.setMuted(!audio.muted); renderBar(); if (!audio.muted) sfx.sparkle(); } }, audio.muted ? '🔇' : '🔊'),
      me ? [h('a', { class: 'btn small', href: '#/dash' }, '💌 My surprises'), h('button', { class: 'btn small ghost', onclick: () => { store.signOut(); renderBar(); toast('Bye bye! See you soon ♥'); location.hash = '#/'; } }, 'Log out')]
         : h('button', { class: 'btn small', onclick: () => authModal() }, 'Log in / Sign up')));
}

function authModal(then) {
  let isUp = true;
  const err = h('div', { class: 'err' });
  const name = h('input', { placeholder: 'your name', maxlength: 30 });
  const email = h('input', { type: 'email', placeholder: 'email', autocomplete: 'email' });
  const pw = h('input', { type: 'password', placeholder: 'password (6+ chars)', autocomplete: 'current-password' });
  const nameRow = h('label', {}, 'Name', name);
  const title = h('p', { class: 'hint' });
  const swap = h('button', { class: 'link', onclick: () => { isUp = !isUp; sync(); } });
  const submit = h('button', { class: 'btn pink' }, '');
  const sync = () => { nameRow.style.display = isUp ? '' : 'none'; submit.textContent = isUp ? 'Create account ♥' : 'Log in ♥'; swap.textContent = isUp ? 'I already have an account' : 'I need an account'; title.textContent = store.mode === 'local' ? 'Demo mode: your account lives in this browser only.' : 'Make an account to save and share your surprises.'; };
  sync();
  const go = async () => {
    err.textContent = ''; submit.disabled = true;
    try { isUp ? await store.signUp(name.value.trim(), email.value, pw.value) : await store.signIn(email.value, pw.value); close(); renderBar(); sfx.success(); toast('Welcome in! ♥', 'ok'); then ? then() : (location.hash = '#/dash'); }
    catch (e) { err.textContent = e.message; sfx.error(); } finally { submit.disabled = false; }
  };
  submit.onclick = go; pw.onkeydown = e => { if (e.key === 'Enter') go(); };
  const close = modal('Join JustSayItAlready', h('div', { class: 'form' }, title, nameRow, h('label', {}, 'Email', email), h('label', {}, 'Password', pw), err, submit, swap));
}

// ---------- router ----------
async function route() {
  scene?.stop(); scene = null; music.stop();
  cleanups.forEach(f => { try { f(); } catch (e) {} }); cleanups = [];
  document.querySelectorAll('.overlay').forEach(o => o.remove());
  renderBar(); window.scrollTo(0, 0);
  const [, page, arg] = (location.hash || '#/').match(/^#\/([^/]*)\/?(.*)$/) || [];
  try {
    if (page === 'new') return await editor(null, arg);
    if (page === 'edit') return await editor(arg);
    if (page === 'tpl') return await editor(null, null, templateFromKey(arg));
    if (page === 's') return await viewer(arg);
    if (page === 'r') return await replyView(arg);
    if (page === 'dash') return await dashboard();
    return home();
  } catch (e) { app.replaceChildren(h('div', { class: 'page center' }, h('h2', {}, 'Oh no 🥺'), h('p', {}, e.message), h('a', { class: 'btn', href: '#/' }, 'Go home'))); }
}
addEventListener('hashchange', route);

function templateFromKey(k) {
  if (k[0] === 'c') { const c = community[+k.slice(1)]; if (c) return migrate({ ...defaultScene(c.data.theme), ...c.data }); }
  return fromTemplate(TEMPLATES[+k.slice(1)] || TEMPLATES[0]);
}
function thumb(state) {
  const cv = h('canvas', { class: 'thumb-cv' }); const sc = new Scene(cv); sc.setState(state); sc.keyFound = true; sc.unlocked = true; sc.renderAt(1.3); return cv;
}

// ---------- home ----------
function home() {
  const cv = h('canvas', { class: 'stage-cv' });
  const demo = migrate({ ...defaultScene('birthday'), to: 'You', candles: 5, cakeSize: 3, decor: { lights: true, balloons: true, cat: true, plants: true }, avatars: { ...defaultScene().avatars, on: true }, stickers: [{ k: 'star', x: 150, y: 14 }, { k: 'gift', x: 76, y: 112 }] });
  const gal = h('div', { class: 'cards tpl' }, TEMPLATES.map((t, i) => { const st = fromTemplate(t); return h('a', { class: 'card tpl-card', href: '#/tpl/b' + i }, thumb(st), h('b', {}, t.name), h('span', {}, 'Use this template →')); }));
  const comm = h('section', { class: 'community', style: 'display:none' });
  app.replaceChildren(h('div', { class: 'page home' },
    h('section', { class: 'hero' },
      h('div', { class: 'hero-txt' },
        h('p', { class: 'kicker' }, '✦ pixel surprises ✦'),
        h('h1', {}, 'JustSayItAlready'),
        h('p', { class: 'lead' }, 'Build a cozy little pixel room with a cake, photos and secret notes, then send the link to someone you love. Say the thing!'),
        h('div', { class: 'cta' }, h('a', { class: 'btn pink big', href: '#/new/birthday' }, '🎂 Make a surprise'), h('a', { class: 'btn big', href: '#/dash' }, '💌 My surprises')),
        h('p', { class: 'hint' }, '↓ try it! tap the cake, the cat and the picture')),
      h('div', { class: 'stage-wrap hero-stage' }, cv)),
    h('section', { class: 'occasions' }, h('h2', {}, 'Pick an occasion'),
      h('div', { class: 'cards' }, Object.entries(THEMES).map(([k, t]) => h('a', { class: 'card', href: '#/new/' + k, style: `--a:${t.accent}` }, h('div', { class: 'big-emoji' }, t.icon), h('b', {}, t.label), h('span', {}, t.wish))))),
    h('section', {}, h('h2', {}, 'Or start from a template'), gal), comm,
    h('section', { class: 'how' }, h('h2', {}, 'What you can add'),
      h('ul', { class: 'feat' }, ['💌 Replies: they answer back', '🙈 A "No" button that runs away', '⏳ Opens on a date', '🖼 Photo wall + stack of notes', '🎙 Voice message radio', '🧸 Draggable stickers', '👫 Pixel avatars that hug', '🎮 Scratch card, heart catcher, hidden key', '🔐 Secret question lock', '📸 Save as PNG or GIF'].map(t => h('li', {}, t))))));
  scene = new Scene(cv); scene.setState(demo); scene.start();
  scene.onHot = k => hot(k, scene);
  store.listTemplates().then(list => {
    community = list; if (!list.length) return;
    comm.style.display = ''; comm.append(h('h2', {}, 'Community templates'), h('div', { class: 'cards tpl' }, list.map((t, i) => h('a', { class: 'card tpl-card', href: '#/tpl/c' + i }, thumb(migrate({ ...defaultScene(t.data.theme), ...t.data })), h('b', {}, t.name), h('span', {}, 'Use this template →')))));
  });
}

// ---------- viewing helpers (shared by home, preview & viewer) ----------
function hot(k, sc) {
  const s = sc.s;
  if (k === 'sticker') { sfx.giggle(); return; }
  if (k === 'cat') { sfx.mew(); sc.poke(); return; }
  if (k === 'radio') {
    if (sc.voiceEl && !sc.voiceEl.paused) { sc.voiceEl.pause(); sc.playing = false; return; }
    music.stop(); sc.voiceEl = new Audio(s.voice); sc.playing = true; sc.voiceEl.onended = () => { sc.playing = false; if (s.music && s.music !== 'none' && sc.celebrate) music.play(s.music); };
    sc.voiceEl.play().catch(() => { sc.playing = false; toast('Could not play the voice message', 'bad'); }); sfx.boop(); return;
  }
  if (k === 'key') { sc.keyFound = true; sc.unlocked = true; sfx.sparkle(); toast('You found the key! 🔑 Now tap the note.', 'ok'); return; }
  if (k === 'cake') {
    sc.poke();
    if (sc.lit) { sfx.blow(); sc.lit = false; setTimeout(() => { sfx.tada(); sc.celebrate = true; sc.burst(s.theme === 'valentine' || s.theme === 'anniversary' ? 'hearts' : 'confetti'); sc.onBlown?.(); }, 450); }
    else { sfx.giggle(); sc.lit = true; sc.celebrate = false; }
    return;
  }
  if (k === 'frame') { sfx.squeak(); photosView(s); return; }
  if (k === 'note') {
    sfx.swish();
    if (!s.reveal || s.reveal === 'none' || sc.unlocked) return notesView(s);
    if (s.reveal === 'key') { sfx.error(); sc.poke(); toast('🔒 Locked! Find the hidden key 🔑 somewhere in the room.'); return; }
    let close; const win = () => { sc.unlocked = true; close(); notesView(s); };
    close = s.reveal === 'scratch' ? modal('Scratch to unlock 🔒', scratchGame('A secret note is waiting for you ♥', win)) : modal('Catch to unlock 🔒', catchGame(win));
  }
}
function photosView(s) {
  const list = (s.photos || []).filter(p => p.img || p.cap); if (!list.length) list.push({ img: null, cap: '' });
  let i = 0; const box = h('div', { class: 'photo-view' }), cnt = h('span', { class: 'hint' });
  const draw = () => { const p = list[i]; box.replaceChildren(p.img ? h('img', { class: 'big-photo', src: p.img, alt: 'photo' }) : h('div', { class: 'empty-photo' }, '💖'), h('p', { class: 'caption' }, p.cap || '')); cnt.textContent = `${i + 1} / ${list.length}`; };
  const go = d => { i = (i + d + list.length) % list.length; draw(); sfx.squeak(); };
  draw();
  modal('A little memory', h('div', {}, box, list.length > 1 ? h('div', { class: 'row center' }, h('button', { class: 'btn small', onclick: () => go(-1) }, '‹'), cnt, h('button', { class: 'btn small', onclick: () => go(1) }, '›')) : null));
}
function notesView(s) {
  const list = (s.notes || []).filter(n => n.text.trim()); if (!list.length) return toast('No notes yet');
  let i = 0; const paper = h('div', { class: 'paper' }), cnt = h('span', { class: 'hint' });
  const draw = () => { const n = list[i]; paper.style.background = NOTE_COLORS[n.color] || NOTE_COLORS.yellow; paper.textContent = n.text; cnt.textContent = `${i + 1} / ${list.length}`; };
  const go = d => { i = (i + d + list.length) % list.length; draw(); sfx.swish(); };
  draw();
  modal(`A note${s.from ? ' from ' + s.from : ''}`, h('div', {}, paper, list.length > 1 ? h('div', { class: 'row center' }, h('button', { class: 'btn small', onclick: () => go(-1) }, '‹'), cnt, h('button', { class: 'btn small', onclick: () => go(1) }, '›')) : null));
}

// ---------- content editors ----------
function photosEditor(s, onSave) {
  const items = (s.photos?.length ? s.photos : [{ img: null, cap: '' }]).map(p => ({ ...p }));
  const list = h('div', { class: 'slots' });
  const draw = () => {
    list.replaceChildren(...items.map((p, i) => {
      const file = h('input', { type: 'file', accept: 'image/*', style: 'display:none', onchange: async e => { const f = e.target.files[0]; if (!f) return; try { p.img = await pixelate(f); draw(); sfx.sparkle(); } catch (er) { toast('Could not read that image', 'bad'); } } });
      return h('div', { class: 'slot' },
        p.img ? h('img', { class: 'slot-img', src: p.img }) : h('div', { class: 'slot-img empty' }, '📷'),
        h('div', { class: 'slot-body' }, file,
          h('input', { maxlength: 40, value: p.cap || '', placeholder: 'caption', oninput: e => { p.cap = e.target.value; } }),
          h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => file.click() }, '📷 Photo'), items.length > 1 ? h('button', { class: 'btn small ghost', onclick: () => { items.splice(i, 1); draw(); sfx.bloop(); } }, 'Remove') : null)));
    }), items.length < MAX_PHOTOS ? h('button', { class: 'btn small', onclick: () => { items.push({ img: null, cap: '' }); draw(); } }, '+ Add photo') : h('p', { class: 'hint' }, `Max ${MAX_PHOTOS} photos`));
  };
  draw();
  modal('Edit the photo wall 🖼', h('div', {}, list, h('p', { class: 'hint' }, 'Photos turn into pixel art automatically ✨ (they also keep your link short!)')), [{ label: 'Save', kind: 'pink', run: close => { onSave(items); close(); sfx.success(); } }]);
}
function notesEditor(s, onSave) {
  const items = (s.notes?.length ? s.notes : [{ text: '', color: 'yellow' }]).map(n => ({ ...n }));
  const list = h('div', { class: 'slots' });
  const draw = () => {
    list.replaceChildren(...items.map((n, i) => {
      const ta = h('textarea', { class: 'paper edit', maxlength: 600, rows: 6, style: `background:${NOTE_COLORS[n.color]}`, oninput: e => { n.text = e.target.value; sfx.tick(); } }); ta.value = n.text;
      return h('div', { class: 'slot col' }, ta, h('div', { class: 'row' },
        h('div', { class: 'swatches' }, Object.entries(NOTE_COLORS).map(([k, v]) => h('button', { class: 'sw' + (k === n.color ? ' on' : ''), style: `background:${v}`, title: k, onclick: e => { n.color = k; ta.style.background = v; mark(e); } }))),
        items.length > 1 ? h('button', { class: 'btn small ghost', onclick: () => { items.splice(i, 1); draw(); sfx.bloop(); } }, 'Remove') : null));
    }), items.length < MAX_NOTES ? h('button', { class: 'btn small', onclick: () => { items.push({ text: '', color: ['yellow', 'pink', 'mint', 'blue'][items.length % 4] }); draw(); } }, '+ Add note') : h('p', { class: 'hint' }, `Max ${MAX_NOTES} notes`));
  };
  draw();
  modal('Edit the notes 📝', list, [{ label: 'Save notes', kind: 'pink', run: close => { onSave(items); close(); sfx.success(); } }], { wide: true });
}
function voiceEditor(s, onSave) {
  const rec = recorder(s.voice);
  modal('Voice message 🎙', rec.el, [{ label: 'Save', kind: 'pink', run: close => { onSave(rec.get()); close(); } }]);
}

// ---------- editor ----------
async function editor(id, theme, pre) {
  let s;
  if (pre) s = pre;
  else if (id) { const m = await store.getMine(id); if (!m) throw new Error('Could not find that surprise (are you logged in?).'); s = migrate(m); }
  else s = window.__draft && !theme ? window.__draft : defaultScene(THEMES[theme] ? theme : 'birthday');
  const rerender = () => { scene.stop(); cleanups.forEach(f => f()); cleanups = []; editor(id, null, s); };
  const set = (patch) => { Object.assign(s, patch); window.__draft = id ? null : s; scene.setState(s); };
  const cv = h('canvas', { class: 'stage-cv' });
  const titleIn = h('input', { class: 'title-in', maxlength: 40, value: s.title, 'aria-label': 'title', oninput: e => { set({ title: e.target.value }); sfx.tick(); } });
  const chips = (items, cur, on) => h('div', { class: 'chips' }, items.map(([k, label]) => h('button', { class: 'chip' + (cur() === k ? ' on' : ''), onclick: e => { on(k); mark(e); } }, label)));
  const sizeLbl = h('b', {}, ['', 'Mini', 'Medium', 'Big', 'GIANT'][s.cakeSize]), candleLbl = h('b', {}, s.candles);
  const toggle = (label, get, on) => h('label', { class: 'toggle' }, h('input', { type: 'checkbox', checked: get(), onchange: e => { on(e.target.checked); e.target.checked ? sfx.pop() : sfx.bloop(); } }), h('span', {}, label));
  const dToggle = (key, label) => toggle(label, () => s.decor[key], v => set({ decor: { ...s.decor, [key]: v } }));
  const musicSel = h('div', { class: 'chips' });
  const drawMusic = () => musicSel.replaceChildren(...[['birthday', '🎂 Birthday'], ['twinkle', '⭐ Twinkle'], ['cozy', '☕ Cozy'], ['none', '🔇 None']].map(([k, l]) => h('button', { class: 'chip' + (s.music === k ? ' on' : ''), onclick: () => { set({ music: k }); k === 'none' ? music.stop() : music.play(k); drawMusic(); } }, l)));
  drawMusic();

  // stickers
  const delBtn = h('button', { class: 'btn small ghost', disabled: true, onclick: () => delSticker() }, '🗑 Delete selected');
  const delSticker = () => { if (scene.sel < 0) return; s.stickers.splice(scene.sel, 1); scene.sel = -1; delBtn.disabled = true; sfx.bloop(); };
  const addSticker = k => { if (s.stickers.length >= 12) return toast('That is plenty of stickers! (max 12)'); s.stickers.push({ k, x: 124 + Math.floor(Math.random() * 60), y: 12 + Math.floor(Math.random() * 40) }); set({ stickers: s.stickers }); scene.sel = s.stickers.length - 1; delBtn.disabled = false; sfx.pop(); };
  const keyH = e => { if ((e.key === 'Delete' || e.key === 'Backspace') && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) { e.preventDefault(); delSticker(); } };
  addEventListener('keydown', keyH); cleanups.push(() => removeEventListener('keydown', keyH));

  // avatars
  const avRow = (label, who) => {
    const a = () => s.avatars[who], upd = (f, v) => { s.avatars[who] = { ...a(), [f]: v }; set({ avatars: s.avatars }); };
    const sw = (arr, f) => h('div', { class: 'swatches' }, arr.map(c => h('button', { class: 'sw' + (a()[f] === c ? ' on' : ''), style: `background:${c}`, onclick: e => { upd(f, c); mark(e); sfx.pop(); } })));
    return h('div', { class: 'avrow' }, h('b', {}, label), sw(SKINS, 'skin'), sw(HAIRS, 'hair'), sw(SHIRTS, 'shirt'),
      h('div', { class: 'chips' }, ['Short', 'Long', 'Buns'].map((n, i) => h('button', { class: 'chip' + (a().style === i ? ' on' : ''), onclick: e => { upd('style', i); mark(e); } }, n))));
  };

  const counts = { photos: h('b', {}), notes: h('b', {}), voice: h('b', {}) };
  const refresh = () => { counts.photos.textContent = s.photos.filter(p => p.img).length + '/' + MAX_PHOTOS; counts.notes.textContent = s.notes.length + '/' + MAX_NOTES; counts.voice.textContent = s.voice ? '✓' : ''; };
  const editPhotos = () => photosEditor(s, items => { set({ photos: items }); refresh(); });
  const editNotes = () => notesEditor(s, items => { set({ notes: items }); refresh(); });
  const editVoice = () => voiceEditor(s, v => { set({ voice: v }); refresh(); });
  refresh();

  const presetSel = h('select', { onchange: e => { const t = TEMPLATES[+e.target.value]; if (!t) return; Object.assign(s, visualsOf(fromTemplate(t))); s.stickers = JSON.parse(JSON.stringify(s.stickers)); sfx.sparkle(); rerender(); } }, h('option', { value: '' }, 'Pick a preset…'), TEMPLATES.map((t, i) => h('option', { value: i }, t.name)));
  const unlockIn = h('input', { type: 'datetime-local', value: toLocalInput(s.unlockAt), onchange: e => { set({ unlockAt: e.target.value ? new Date(e.target.value).toISOString() : '' }); sfx.boop(); } });

  const panel = h('aside', { class: 'panel' },
    h('div', { class: 'pcard' }, h('h3', {}, 'Occasion'), chips(Object.entries(THEMES).map(([k, t]) => [k, t.icon + ' ' + t.label]), () => s.theme, k => {
      const d = defaultScene(k); set({ theme: k, title: d.title, wish: d.wish, room: d.room, flavor: d.flavor, music: d.music, candles: d.candles, proposal: d.proposal, decor: { ...s.decor, stars: d.decor.stars, balloons: d.decor.balloons, snow: d.decor.snow } });
      sfx.sparkle(); rerender();
    }), h('label', {}, 'Presets (looks only)', presetSel)),
    h('div', { class: 'pcard' }, h('h3', {}, 'Cozy setting'), chips(Object.entries(ROOMS).map(([k, r]) => [k, r.label]), () => s.room, k => { set({ room: k }); sfx.woo(); })),
    h('div', { class: 'pcard' }, h('h3', {}, 'The cake 🎂'),
      h('label', { class: 'range' }, h('span', {}, 'Size ', sizeLbl), h('input', { type: 'range', min: 1, max: 4, value: s.cakeSize, oninput: e => { set({ cakeSize: +e.target.value }); sizeLbl.textContent = ['', 'Mini', 'Medium', 'Big', 'GIANT'][s.cakeSize]; sfx.squeak(); scene.poke(); } })),
      h('label', { class: 'range' }, h('span', {}, 'Candles ', candleLbl), h('input', { type: 'range', min: 0, max: 9, value: s.candles, oninput: e => { set({ candles: +e.target.value }); candleLbl.textContent = s.candles; sfx.tick(); } })),
      h('div', { class: 'swatches' }, Object.entries(FLAVORS).map(([k, f]) => h('button', { class: 'sw round' + (s.flavor === k ? ' on' : ''), title: f.label, style: `background:linear-gradient(${f.frost} 50%,${f.sponge} 50%)`, onclick: e => { set({ flavor: k }); mark(e); sfx.pop(); } })))),
    h('div', { class: 'pcard' }, h('h3', {}, 'Cute extras'), h('div', { class: 'toggles' }, dToggle('lights', '💡 Fairy lights'), dToggle('balloons', '🎈 Balloons'), dToggle('cat', '🐱 Cat buddy'), dToggle('plants', '🪴 Plant'), dToggle('stars', '✨ Sparkles'), dToggle('snow', '❄️ Snow'))),
    h('div', { class: 'pcard' }, h('h3', {}, 'Stickers 🧸 (drag on stage)'),
      h('div', { class: 'chips' }, [['heart', '💖'], ['star', '⭐'], ['flower', '🌸'], ['gift', '🎁'], ['bear', '🧸'], ['cloud', '☁️']].map(([k, e]) => h('button', { class: 'chip', onclick: () => addSticker(k) }, e))), h('div', { class: 'row' }, delBtn)),
    h('div', { class: 'pcard' }, h('h3', {}, 'Pixel avatars 👫'),
      toggle('Show us in the room (they hug at the end!)', () => s.avatars.on, v => { s.avatars.on = v; set({ avatars: s.avatars }); }),
      avRow('Receiver (you → them)', 'you'), avRow('Me (sender)', 'me')),
    h('div', { class: 'pcard' }, h('h3', {}, 'Music'), musicSel),
    h('div', { class: 'pcard' }, h('h3', {}, 'Words'),
      h('label', {}, 'For (their name)', h('input', { maxlength: 30, value: s.to, placeholder: 'Mimi', oninput: e => set({ to: e.target.value }) })),
      h('label', {}, 'From (your name)', h('input', { maxlength: 30, value: s.from, placeholder: 'Me', oninput: e => set({ from: e.target.value }) })),
      h('label', {}, 'Little hint under the cake', h('input', { maxlength: 60, value: s.wish, oninput: e => set({ wish: e.target.value }) }))),
    h('div', { class: 'pcard' }, h('h3', {}, 'Photos, notes & voice'), h('div', { class: 'row wrap' },
      h('button', { class: 'btn small', onclick: editPhotos }, '🖼 Photos ', counts.photos), h('button', { class: 'btn small', onclick: editNotes }, '📝 Notes ', counts.notes), h('button', { class: 'btn small', onclick: editVoice }, '🎙 Voice ', counts.voice))),
    h('div', { class: 'pcard' }, h('h3', {}, 'Make it a game 🎮'),
      h('p', { class: 'hint' }, 'How do they unlock the note?'),
      chips([['none', 'Just open'], ['scratch', '🪙 Scratch'], ['catch', '💖 Catch hearts'], ['key', '🔑 Hidden key']], () => s.reveal, k => { set({ reveal: k }); sfx.sparkle(); }),
      toggle('Ask a question after the cake (Yes / No)', () => s.proposal.on, v => set({ proposal: { ...s.proposal, on: v } })),
      h('label', {}, 'The question', h('input', { maxlength: 70, value: s.proposal.q, oninput: e => set({ proposal: { ...s.proposal, q: e.target.value } }) }))),
    h('div', { class: 'pcard' }, h('h3', {}, 'Lock it 🔐'),
      h('label', {}, '⏳ Opens on (optional)', unlockIn),
      h('label', {}, 'Secret question (optional)', h('input', { maxlength: 70, value: s.lock.q, placeholder: 'Where was our first date?', oninput: e => set({ lock: { ...s.lock, q: e.target.value } }) })),
      h('label', {}, 'Answer', h('input', { maxlength: 40, value: s.lock.a, placeholder: 'the answer', oninput: e => set({ lock: { ...s.lock, a: e.target.value } }) })),
      h('p', { class: 'hint' }, 'With a question set, the surprise is encrypted. Only the right answer opens it. Don\'t forget the answer!')),
    h('div', { class: 'pcard' }, h('h3', {}, 'Share the look'), h('button', { class: 'btn small', onclick: async () => { try { await store.publishTemplate(s.title || 'Untitled', visualsOf(s)); toast('Shared to the community gallery! ✨', 'ok'); sfx.success(); } catch (e) { toast(e.message, 'bad'); sfx.error(); } } }, '🌍 Publish as template'), h('p', { class: 'hint' }, 'Only the room, cake, decor and stickers are shared. Never your photos, notes or names.')));

  app.replaceChildren(h('div', { class: 'page editor' },
    h('div', { class: 'ed-head' }, h('a', { class: 'link', href: '#/dash' }, '← back'), h('span', { class: 'pill' }, id ? 'Editing' : 'New surprise'),
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => preview(s) }, '👀 Preview'),
        h('button', { class: 'btn', onclick: () => downloadModal(s) }, '📸 Save image'),
        h('button', { class: 'btn pink', onclick: () => doSave() }, '💾 Save & get link'))),
    h('div', { class: 'ed-grid' },
      h('div', { class: 'stage-col' }, titleIn, h('div', { class: 'stage-wrap' }, cv), h('p', { class: 'hint center' }, '✎ Tap the 🖼 frame or 📝 note on the stage to edit. Drag stickers around!')),
      panel)));
  scene = new Scene(cv, {
    editable: true,
    onSelect: i => { delBtn.disabled = i < 0; },
    onHot: k => {
      if (k === 'frame') { sfx.squeak(); editPhotos(); }
      else if (k === 'note') { sfx.swish(); editNotes(); }
      else if (k === 'radio') editVoice();
      else if (k === 'cake') { sfx.squeak(); scene.poke(); } else if (k === 'cat') sfx.mew();
    } });
  scene.setState(s); scene.start();

  async function doSave() {
    if (!store.getUser()) return authModal(doSave);
    if (s.lock.q && !s.lock.a.trim()) return toast('You set a secret question, add the answer too!', 'bad');
    try {
      const saved = await store.save(s); s = Object.assign(s, saved); id = saved.id; window.__draft = null; scene.setState(s);
      const link = await store.shareLink(saved); sfx.tada(); linkModal(link, s);
      history.replaceState(null, '', '#/edit/' + saved.id);
    } catch (e) { toast(e.message, 'bad'); sfx.error(); }
  }
}
function preview(s) {
  const cv = h('canvas', { class: 'stage-cv' }); modal('Preview', h('div', { class: 'stage-wrap' }, cv), [], { wide: true });
  const sc = new Scene(cv, { onHot: k => hot(k, sc) }); sc.setState(s); sc.start();
  const obs = new MutationObserver(() => { if (!document.body.contains(cv)) { sc.stop(); sc.voiceEl?.pause(); obs.disconnect(); } }); obs.observe(document.body, { childList: true });
}
function linkModal(link, s) {
  const inp = h('input', { class: 'linkbox', readonly: true, value: link, onfocus: e => e.target.select() });
  const long = link.length > 8000;
  modal('Your surprise is ready! 🎉', h('div', { class: 'form' },
    h('p', {}, `Send this magic link to ${s.to || 'your someone'}:`), inp,
    h('div', { class: 'row' },
      h('button', { class: 'btn pink', onclick: () => copyText(link, inp) }, '📋 Copy link'),
      navigator.share ? h('button', { class: 'btn', onclick: () => navigator.share({ title: s.title, text: 'I made you a little surprise ♥', url: link }).catch(() => {}) }, '📤 Share') : null,
      h('a', { class: 'btn', href: link, target: '_blank' }, '👀 Open')),
    s.unlockAt ? h('p', { class: 'hint' }, '⏳ It will open on ' + fmtDate(s.unlockAt) + '.') : null,
    store.mode === 'local' ? h('p', { class: 'hint' }, 'Demo mode: the whole surprise is packed inside this link, so it works anywhere. (The ⏳ date lock is only enforced by the page here. Use Supabase mode for a truly hidden one.)') : null,
    long ? h('p', { class: 'hint' }, '⚠ This link is long because of photos/voice. Some chat apps cut long links. Supabase mode gives short links.') : null));
}
function downloadModal(s) {
  const st = h('p', { class: 'hint' }, 'Pick one:');
  const run = async (fn, name, label) => { st.textContent = 'Making your ' + label + '…'; try { const b = await fn(s); download(b, name); st.textContent = 'Saved! ♥'; sfx.success(); } catch (e) { st.textContent = 'Oops: ' + e.message; sfx.error(); } };
  modal('Save your scene 📸', h('div', { class: 'form' },
    h('button', { class: 'btn pink', onclick: () => run(makePostcard, 'surprise-postcard.png', 'postcard') }, '🖼 Postcard (PNG)'),
    h('button', { class: 'btn', onclick: () => run(makeGIF, 'surprise.gif', 'animated GIF') }, '🎞 Animated GIF'), st));
}

// ---------- dashboard ----------
async function dashboard() {
  if (!store.getUser()) { app.replaceChildren(h('div', { class: 'page center' }, h('h2', {}, 'Log in to see your surprises 💌'), h('button', { class: 'btn pink big', onclick: () => authModal(route) }, 'Log in / Sign up'))); return; }
  const list = await store.listMine(); const me = store.getUser();
  const paste = h('input', { placeholder: 'Paste a reply link here…' });
  app.replaceChildren(h('div', { class: 'page dash' },
    h('h2', {}, `Hi ${me.name}! ♥`), h('div', { class: 'row wrap' }, h('a', { class: 'btn pink', href: '#/new/birthday' }, '+ New surprise')),
    list.length ? h('div', { class: 'cards' }, list.map(raw => { const s = migrate(raw), th = THEMES[s.theme] || THEMES.other; return h('div', { class: 'card item', style: `--a:${th.accent}` },
      h('div', { class: 'big-emoji' }, th.icon), h('b', {}, s.title || 'Untitled'), h('span', {}, s.to ? 'for ' + s.to : 'no name yet'),
      h('div', { class: 'row wrap' },
        h('a', { class: 'btn small', href: '#/edit/' + s.id }, '✎ Edit'),
        h('button', { class: 'btn small pink', onclick: async () => linkModal(await store.shareLink(raw), s) }, '🔗 Link'),
        store.mode === 'supabase' ? h('button', { class: 'btn small', onclick: () => repliesModal(s) }, '💌 Replies') : null,
        h('button', { class: 'btn small ghost', onclick: async () => { if (confirm('Delete this surprise?')) { await store.remove(s.id); sfx.bloop(); dashboard(); } } }, '🗑'))); })) : h('p', { class: 'hint' }, 'Nothing yet. Make your first surprise!'),
    h('div', { class: 'pcard replybox' }, h('h3', {}, 'Got a reply link? 💌'), paste, h('button', { class: 'btn small', onclick: () => { const m = paste.value.match(/#\/r\/.+/); if (m) location.hash = m[0]; else toast('That does not look like a reply link', 'bad'); } }, 'Open reply'))));
}
async function repliesModal(s) {
  let list = []; try { list = await store.listReplies(s.id); } catch (e) { toast(e.message, 'bad'); }
  modal('Replies 💌', list.length ? h('div', { class: 'replies' }, list.map(r => replyCard(r))) : h('p', { class: 'hint' }, 'No replies yet. They are probably blushing.'));
}
function replyCard(r) { return h('div', { class: 'reply-card' }, h('div', { class: 'reply-emoji' }, r.emoji || '💖'), h('b', {}, r.name || 'Someone'), h('p', {}, r.msg || ''), r.at ? h('span', { class: 'hint' }, new Date(r.at).toLocaleString()) : null); }
async function replyView(key) {
  const r = await store.loadReply(key); sfx.heart();
  app.replaceChildren(h('div', { class: 'page center' }, h('p', { class: 'kicker' }, '✦ you got a reply ✦'), h('div', { class: 'reply-big' }, replyCard(r)), h('a', { class: 'btn', href: '#/' }, 'Make your own surprise')));
}

// ---------- reply + proposal ----------
function replyModal(key, s, { prefill = '', emoji = '💖' } = {}) {
  let pick = emoji; const msg = h('textarea', { maxlength: 200, rows: 4, placeholder: 'Say something sweet…' }); msg.value = prefill;
  const name = h('input', { maxlength: 30, value: s.to || '', placeholder: 'your name' });
  const chips = h('div', { class: 'chips' }, ['💖', '🥹', '😭', '🎂', '✨', '🫶', '😆'].map(e => h('button', { class: 'chip' + (e === pick ? ' on' : ''), onclick: ev => { pick = e; mark(ev); sfx.pop(); } }, e)));
  modal('Send a reply 💌', h('div', { class: 'form' }, chips, h('label', {}, 'Your name', name), h('label', {}, 'Message', msg)), [{ label: 'Send ♥', kind: 'pink', run: async close => {
    try {
      const res = await store.sendReply(key, { emoji: pick, name: name.value, msg: msg.value, at: Date.now() }); close(); sfx.tada();
      if (res.sent) toast('Sent! They will see it ♥', 'ok');
      else { const inp = h('input', { class: 'linkbox', readonly: true, value: res.link, onfocus: e => e.target.select() }); modal('Send this back to ' + (s.from || 'them') + ' 💌', h('div', { class: 'form' }, h('p', {}, 'Copy this reply link and send it to them:'), inp, h('div', { class: 'row' }, h('button', { class: 'btn pink', onclick: () => copyText(res.link, inp) }, '📋 Copy'), navigator.share ? h('button', { class: 'btn', onclick: () => navigator.share({ title: 'My reply', url: res.link }).catch(() => {}) }, '📤 Share') : null))); }
    } catch (e) { toast(e.message, 'bad'); sfx.error(); } } }]);
}
function proposalBox(sc, s, key) {
  const arena = h('div', { class: 'arena' });
  const yes = h('button', { class: 'btn pink big yes' }, 'YES 💖'), no = h('button', { class: 'btn big no', 'data-quiet': 1 }, 'no');
  let dodges = 0, said = false;
  const sayYes = () => {
    if (said) return; said = true; sfx.tada(); sc.burst('hearts'); setTimeout(() => sc.burst('hearts'), 250); setTimeout(() => sc.burst('hearts'), 500);
    arena.replaceChildren(h('h2', { class: 'yay' }, 'YAYYY 💖💖💖')); setTimeout(() => replyModal(key, s, { prefill: 'YES!! 💖', emoji: '💖' }), 900);
  };
  yes.onclick = sayYes;
  const dodge = e => {
    if (said) return; if (dodges >= 6) return sayYes(); e && e.preventDefault(); dodges++; sfx.squeak();
    no.style.position = 'absolute'; no.style.left = (Math.random() * 70 + 5) + '%'; no.style.top = (Math.random() * 60) + '%'; no.style.transform = `scale(${Math.max(.45, 1 - dodges * .1)})`;
    if (dodges >= 6) no.textContent = 'ok yes 💖';
  };
  no.addEventListener('pointerenter', dodge); no.addEventListener('pointerdown', dodge); no.addEventListener('click', e => { e.preventDefault(); dodge(e); });
  arena.append(yes, no);
  return h('div', { class: 'proposal' }, h('p', { class: 'question' }, s.proposal.q || 'Will you?'), arena);
}

// ---------- viewer (what your someone sees) ----------
async function viewer(key) {
  let obj = await store.loadShared(key);
  const when = obj.waiting || obj.unlockAt;
  if (when && new Date(when) > new Date()) return waitingScreen(obj, when, () => viewer(key));
  if (obj.locked) return lockScreen(obj, plain => begin(migrate(plain), key));
  begin(migrate(obj), key);
}
function waitingScreen(obj, when, retry) {
  const left = h('div', { class: 'countdown' }), name = obj.to || '';
  app.replaceChildren(h('div', { class: 'page center intro' }, h('p', { class: 'kicker' }, '✦ a surprise is waiting ✦'), h('h1', { class: 'small-h' }, name ? `For ${name}` : 'For you'),
    h('div', { class: 'gift locked' }, '🎁🔒'), h('p', {}, 'It opens on'), h('h2', {}, fmtDate(when)), left));
  const tick = () => {
    const ms = new Date(when) - new Date(); if (ms <= 0) { clearInterval(iv); retry(); return; }
    const d = Math.floor(ms / 864e5), hh = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, sec = Math.floor(ms / 1e3) % 60;
    left.textContent = `${d}d ${pad(hh)}h ${pad(m)}m ${pad(sec)}s`;
  };
  const iv = setInterval(tick, 1000); tick(); cleanups.push(() => clearInterval(iv));
}
function lockScreen(w, then) {
  const ans = h('input', { placeholder: 'your answer', autocomplete: 'off' }), err = h('div', { class: 'err' });
  const go = async () => { err.textContent = ''; try { const p = await store.unlockScene(w, ans.value); sfx.success(); then(p); } catch (e) { err.textContent = e.message; sfx.error(); } };
  ans.onkeydown = e => { if (e.key === 'Enter') go(); };
  app.replaceChildren(h('div', { class: 'page center intro' }, h('p', { class: 'kicker' }, '✦ a secret surprise ✦'), h('h1', { class: 'small-h' }, w.to ? `For ${w.to}` : 'For you'),
    h('div', { class: 'gift locked' }, '🎁🔐'), h('h2', {}, w.q || 'Secret question'), h('div', { class: 'form lockform' }, ans, err, h('button', { class: 'btn pink', onclick: go }, 'Unlock ♥'))));
}
function begin(s, key) {
  const gift = h('button', { class: 'gift', 'data-quiet': 1, 'aria-label': 'open the gift' }, h('div', { class: 'gift-box' }, '🎁'));
  app.replaceChildren(h('div', { class: 'page center intro' }, h('p', { class: 'kicker' }, '✦ a surprise for you ✦'), h('h1', { class: 'small-h' }, s.to ? `For ${s.to}` : 'For you'), gift, h('p', { class: 'hint blink' }, 'tap the gift to open ♥')));
  gift.onclick = () => {
    audio.unlock(); sfx.open(); gift.classList.add('open');
    setTimeout(() => {
      const cv = h('canvas', { class: 'stage-cv' });
      const msg = h('p', { class: 'wish' }, s.wish), extra = h('div', { class: 'extra' });
      app.replaceChildren(h('div', { class: 'page view' }, h('h1', { class: 'view-title' }, s.title), h('div', { class: 'stage-wrap' }, cv), msg, extra,
        h('p', { class: 'hint center' }, ['tap the 🖼 picture and the 📝 note', s.voice ? '🎙 the radio' : null, 'and the cake!', s.reveal === 'key' ? '🔑 there is a hidden key somewhere…' : null].filter(Boolean).join(' · ')),
        h('div', { class: 'row center' }, h('button', { class: 'btn small pink', onclick: () => replyModal(key, s) }, '💌 Send a reply'), h('button', { class: 'btn small', onclick: () => downloadModal(s) }, '📸 Keep this'), h('a', { class: 'btn small ghost', href: '#/' }, 'Make your own'))));
      scene = new Scene(cv, { onHot: k => hot(k, scene) }); scene.setState(s); scene.start();
      scene.onBlown = () => { msg.textContent = s.from ? `With love, ${s.from} ♥` : 'With love ♥'; msg.classList.add('pop'); sfx.heart(); if (s.proposal.on && !extra.firstChild) setTimeout(() => extra.append(proposalBox(scene, s, key)), 700); };
      if (s.music && s.music !== 'none') music.play(s.music);
    }, 700);
  };
}

route();
