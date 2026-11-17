// JustSayItAlready pixel scene renderer — draws everything on a tiny 320x180 canvas that is scaled up crisply.
// Want your own art? Sprites below are tiny text grids (one char = one pixel). Edit them or add more!
export const W = 320, H = 180;

export const THEMES = {
  birthday:   { label: 'Birthday',    icon: '🎂', accent: '#ff9ec7', room: 'bedroom', flavor: 'pink',    music: 'birthday', title: 'Happy Birthday!',  wish: 'Make a wish & blow the candles!',  candles: 5, ask: 'Will you come to my party?' },
  valentine:  { label: 'Valentine',   icon: '💖', accent: '#ff6b8b', room: 'cafe',    flavor: 'choco',   music: 'cozy',     title: 'Be My Valentine?', wish: 'Tap the cake, I made it for you!', candles: 2, ask: 'Will you be my Valentine?' },
  prom:       { label: 'Prom',        icon: '✨', accent: '#9a86ff', room: 'night',   flavor: 'berry',   music: 'twinkle',  title: 'Prom Night?',      wish: 'Tap the cake to find out...',      candles: 3, ask: 'Will you go to prom with me?' },
  anniversary:{ label: 'Anniversary', icon: '💞', accent: '#e8798f', room: 'sunset',  flavor: 'vanilla', music: 'cozy',     title: 'Happy Anniversary',wish: 'Every day with you is a gift.',    candles: 2, ask: 'Will you do forever with me?' },
  christmas:  { label: 'Christmas',   icon: '🎄', accent: '#d94a4a', room: 'winter',  flavor: 'matcha',  music: 'twinkle',  title: 'Merry Christmas!', wish: 'Tap the cake for your gift!',      candles: 4, ask: 'Will you spend Christmas with me?' },
  graduation: { label: 'Graduation',  icon: '🎓', accent: '#6a7fe8', room: 'garden',  flavor: 'berry',   music: 'birthday', title: 'You Did It!',      wish: 'So proud of you. Tap the cake!',   candles: 3, ask: 'Will you celebrate with me?' },
  other:      { label: 'Just Because',icon: '🎁', accent: '#6fd9bf', room: 'garden',  flavor: 'matcha',  music: 'cozy',     title: 'Surprise!',        wish: 'Tap the cake!',                    candles: 3, ask: 'Will you hang out with me?' },
};
export const ROOMS = {
  bedroom: { label: 'Cozy Bedroom', wall: '#f9d9ea', wall2: '#f2c6df', floor: '#c99a6b', floor2: '#b48253' },
  cafe:    { label: 'Warm Café',    wall: '#9a6650', wall2: '#8a5744', floor: '#f6e6cc', floor2: '#dcbc90' },
  garden:  { label: 'Sunny Garden', wall: '#a8e6ff', wall2: '#a8e6ff', floor: '#84dd5c', floor2: '#6cc24a' },
  night:   { label: 'Starry Night', wall: '#1f1b4d', wall2: '#29246b', floor: '#3b3070', floor2: '#2f2559' },
  winter:  { label: 'Snowy Cabin',  wall: '#2b4574', wall2: '#35568a', floor: '#eaf3ff', floor2: '#cbdcf3' },
  sunset:  { label: 'Sunset Deck',  wall: '#ffb38a', wall2: '#ff9a8b', floor: '#b8794e', floor2: '#9c6340' },
};
export const FLAVORS = {
  pink:   { label: 'Strawberry', frost: '#ffb8d6', sponge: '#ffe0ee', drip: '#ff8fbd' },
  choco:  { label: 'Chocolate',  frost: '#8a5645', sponge: '#6b3f31', drip: '#5a3226' },
  vanilla:{ label: 'Vanilla',    frost: '#fff6dc', sponge: '#ffe7a8', drip: '#ffd77a' },
  matcha: { label: 'Matcha',     frost: '#c3ecaa', sponge: '#96d882', drip: '#7cc56a' },
  berry:  { label: 'Blueberry',  frost: '#c4c9ff', sponge: '#a0a8f5', drip: '#8b92e8' },
};
export const NOTE_COLORS = { yellow: '#fff3a8', pink: '#ffc9de', mint: '#c6f5de', blue: '#cfe4ff' };
export const SKINS = ['#ffe0c7', '#ffd0a8', '#f0b98d', '#c98b5e', '#8d5a3c'];
export const HAIRS = ['#3b2a4a', '#8a4b2a', '#e8b04a', '#ff7eb6', '#6a7fe8', '#d94a4a', '#f4f4f4'];
export const SHIRTS = ['#ff8fb8', '#8fd3ff', '#ffe27a', '#8fe3c6', '#b9a7ff', '#ff9a6b', '#ffffff'];
export const STICKERS = ['heart', 'star', 'flower', 'gift', 'bear', 'cloud'];
export const MAX_PHOTOS = 4, MAX_NOTES = 4;

const INK = '#3b2a4a';
const SPR = {
  cat: ['kk........kk', 'kok......kok', 'koooooooooook', 'kooxooooxook', 'kooooppooook', '.kooooooook.', '..kooooooook', '.kooooooooook', '.kooooooooook', '.kkoooooooook', '..kkk.kk.kkk'],
  heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  pot: ['g.g.g.g', '.ggggg.', '..ggg..', 'bbbbbbb', '.bbbbb.', '.bbbbb.'],
  star: ['...y...', '..yyy..', 'yyyyyyy', '.yyyyy.', '.yy.yy.', 'yy...yy'],
  flower: ['..p.p..', '.ppppp.', 'pppyppp', '.ppppp.', '..p.p..', '...g...', '..ggg..', '...g...'],
  gift: ['.rr..rr.', '..rrrr..', 'uuuwwuuu', 'uuuwwuuu', 'wwwwwwww', 'uuuwwuuu', 'uuuwwuuu'],
  bear: ['bb....bb', 'bbbbbbbb', 'bkbbbbkb', 'bbbttbbb', '.bbbbbb.', 'bbbbbbbb', '.bb..bb.'],
  cloud: ['..www....', '.wwwwww..', 'wwwwwwwww', '.wwwwwww.'],
  key: ['.yyy....', 'y...yyyy', '.yyy..y.', '.....yy.'],
};
const SPR_COL = { k: INK, o: '#ffb86b', x: INK, p: '#ff8fb1', w: '#fff', r: '#ff4f7b', g: '#5cc36e', b: '#d98a5f', y: '#ffd23c', u: '#7fc4ff', t: '#f1c9a0' };
const KEY_SPOTS = [[286, 150], [34, 152], [198, 22], [298, 122]];

export function defaultScene(theme = 'birthday') {
  const t = THEMES[theme] || THEMES.other;
  return {
    theme, title: t.title, to: '', from: '', wish: t.wish,
    room: t.room, cakeSize: 2, flavor: t.flavor, candles: t.candles,
    decor: { lights: true, balloons: theme === 'birthday', cat: false, plants: true, stars: theme === 'prom' || theme === 'graduation', snow: theme === 'christmas' },
    music: t.music,
    photos: [{ img: null, cap: 'Our favorite memory ♥' }],
    notes: [{ text: 'Dear you,\n\nI made this little surprise just for you. Thank you for being you.\n\n♥', color: theme === 'valentine' ? 'pink' : 'yellow' }],
    voice: null, stickers: [],
    avatars: { on: false, me: { skin: SKINS[1], hair: HAIRS[0], shirt: SHIRTS[0], style: 0 }, you: { skin: SKINS[2], hair: HAIRS[1], shirt: SHIRTS[1], style: 1 } },
    reveal: 'none',
    proposal: { on: theme === 'valentine' || theme === 'prom', q: t.ask },
    unlockAt: '', lock: { q: '', a: '' },
  };
}
// fills any missing fields (also upgrades surprises saved with the older single photo/note format)
export function migrate(s) {
  const d = defaultScene(THEMES[s.theme] ? s.theme : 'other');
  const o = { ...d, ...s };
  if (!s.photos) o.photos = [{ img: s.frameImg || null, cap: s.frameCaption || '' }];
  if (!s.notes) o.notes = [{ text: s.note || '', color: s.noteColor || 'yellow' }];
  o.decor = { ...d.decor, ...(s.decor || {}) };
  o.avatars = { ...d.avatars, ...(s.avatars || {}) };
  o.proposal = { ...d.proposal, ...(s.proposal || {}) };
  o.lock = { ...d.lock, ...(s.lock || {}) };
  o.stickers = s.stickers || [];
  return o;
}

// ---- ready-made templates (also used as the gallery on the home page) ----
const av = (on = true) => ({ on });
export const TEMPLATES = [
  { name: 'Date Night', theme: 'valentine', patch: { room: 'cafe', cakeSize: 2, candles: 2, flavor: 'choco', music: 'cozy', avatars: av(), decor: { lights: true, plants: true, balloons: false, cat: false, stars: false, snow: false }, stickers: [{ k: 'heart', x: 40, y: 20 }, { k: 'heart', x: 266, y: 18 }, { k: 'star', x: 120, y: 62 }] } },
  { name: 'Prom Ask', theme: 'prom', patch: { room: 'night', cakeSize: 3, candles: 3, avatars: av(), decor: { lights: true, stars: true, plants: false, balloons: false, cat: false, snow: false }, stickers: [{ k: 'star', x: 60, y: 14 }, { k: 'star', x: 250, y: 20 }] } },
  { name: 'Surprise Party', theme: 'birthday', patch: { room: 'garden', cakeSize: 3, candles: 7, decor: { lights: true, balloons: true, cat: true, plants: true, stars: false, snow: false }, stickers: [{ k: 'gift', x: 76, y: 112 }, { k: 'gift', x: 236, y: 112 }, { k: 'star', x: 150, y: 14 }] } },
  { name: 'Sleepover', theme: 'other', patch: { title: 'Sleepover?!', room: 'bedroom', cakeSize: 1, candles: 1, flavor: 'vanilla', music: 'twinkle', decor: { lights: true, cat: true, stars: true, plants: false, balloons: false, snow: false }, stickers: [{ k: 'bear', x: 232, y: 112 }, { k: 'cloud', x: 40, y: 14 }, { k: 'cloud', x: 240, y: 22 }] } },
  { name: 'Cozy Christmas', theme: 'christmas', patch: { room: 'winter', cakeSize: 3, candles: 4, decor: { lights: true, plants: false, balloons: false, cat: true, stars: false, snow: true }, stickers: [{ k: 'gift', x: 78, y: 112 }, { k: 'gift', x: 232, y: 112 }] } },
  { name: 'Anniversary', theme: 'anniversary', patch: { room: 'sunset', cakeSize: 2, candles: 2, avatars: av(), decor: { lights: true, plants: true, balloons: false, cat: false, stars: false, snow: false }, stickers: [{ k: 'heart', x: 150, y: 16 }, { k: 'flower', x: 262, y: 114 }] } },
  { name: 'Graduation', theme: 'graduation', patch: { room: 'garden', cakeSize: 4, candles: 5, avatars: av(), decor: { lights: false, balloons: true, plants: true, cat: false, stars: true, snow: false }, stickers: [{ k: 'star', x: 150, y: 14 }, { k: 'cloud', x: 40, y: 16 }] } },
];
export function fromTemplate(t) {
  const d = defaultScene(t.theme), p = t.patch;
  return migrate({ ...d, ...p, avatars: { ...d.avatars, ...(p.avatars || {}) }, title: p.title || d.title });
}
// keep visuals only (for presets / community templates): no photos, notes, names, voice or locks
export function visualsOf(s) {
  const { room, cakeSize, flavor, candles, decor, music, stickers, avatars, theme, title } = s;
  return { room, cakeSize, flavor, candles, decor, music, stickers, avatars: { on: avatars.on, me: avatars.me, you: avatars.you }, theme, title };
}

export class Scene {
  constructor(canvas, { editable = false, onHot = () => {}, onStickers = () => {}, onSelect = () => {} } = {}) {
    this.cv = canvas; this.cv.width = W; this.cv.height = H;
    this.c = canvas.getContext('2d'); this.c.imageSmoothingEnabled = false;
    Object.assign(this, { editable, onHot, onStickers, onSelect });
    this.s = defaultScene(); this.lit = true; this.parts = []; this.hover = null; this.sel = -1;
    this.img = null; this.imgSrc = null; this.t = 0; this.bump = 0; this.raf = 0;
    this.hug = 0; this.celebrate = false; this.keyFound = false; this.playing = false; this.drag = null; this.moved = false;
    const pos = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
    canvas.addEventListener('pointerdown', e => {
      if (!this.editable) return;
      const [x, y] = pos(e), i = this.stickerAt(x, y);
      if (i >= 0) { this.sel = i; this.drag = { i, dx: x - this.s.stickers[i].x, dy: y - this.s.stickers[i].y }; this.moved = false; canvas.setPointerCapture(e.pointerId); this.onSelect(i); }
      else if (this.sel !== -1 && !this.hit(e)) { this.sel = -1; this.onSelect(-1); }
    });
    canvas.addEventListener('pointermove', e => {
      const [x, y] = pos(e);
      if (this.drag) { const st = this.s.stickers[this.drag.i]; st.x = Math.max(0, Math.min(W - 9, Math.round(x - this.drag.dx))); st.y = Math.max(0, Math.min(H - 9, Math.round(y - this.drag.dy))); this.moved = true; return; }
      const h = this.hit(e); this.hover = h; canvas.style.cursor = (h || (this.editable && this.stickerAt(x, y) >= 0)) ? (this.editable && !h ? 'grab' : 'pointer') : 'default';
    });
    canvas.addEventListener('pointerup', () => { if (this.drag) { this.drag = null; if (this.moved) { this.onStickers(); this.justDragged = true; setTimeout(() => { this.justDragged = false; }); } } });
    canvas.addEventListener('pointerleave', () => { this.hover = null; });
    canvas.addEventListener('click', e => {
      if (this.justDragged) return;
      const [x, y] = pos(e);
      const h = this.hit(e); if (h) return this.onHot(h);
      const si = this.stickerAt(x, y); if (si >= 0 && !this.editable) this.onHot('sticker');
    });
  }
  setState(s) {
    this.s = s;
    const src = s.photos?.[0]?.img || null;
    if (src !== this.imgSrc) { this.imgSrc = src; this.img = null; if (src) { const im = new Image(); im.onload = () => { this.img = im; }; im.src = src; } }
  }
  start() { const loop = (ms) => { this.t = ms / 1000; this.draw(); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }
  stop() { cancelAnimationFrame(this.raf); }
  keyPos() { return KEY_SPOTS[(this.s.title || '').length % KEY_SPOTS.length]; }
  spots() {
    const n = this.s.cakeSize, d = this.s.decor, kp = this.keyPos();
    return {
      key: (this.s.reveal === 'key' && !this.keyFound) ? { x: kp[0] - 2, y: kp[1] - 2, w: 12, h: 8 } : null,
      cat: d.cat ? { x: 250, y: 112, w: 26, h: 24 } : null,
      radio: this.s.voice ? { x: 72, y: 110, w: 24, h: 17 } : null,
      frame: { x: 20, y: 30, w: 68, h: 76 },
      note: { x: 232, y: 34, w: 62, h: 72 },
      cake: { x: 108, y: 124 - n * 16 - 16, w: 104, h: n * 16 + 20 },
    };
  }
  stickerAt(x, y) { const st = this.s.stickers || []; for (let i = st.length - 1; i >= 0; i--) { const sp = SPR[st[i].k] || SPR.heart; if (x >= st[i].x - 1 && x <= st[i].x + sp[0].length + 1 && y >= st[i].y - 1 && y <= st[i].y + sp.length + 1) return i; } return -1; }
  hit(e) {
    const r = this.cv.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H;
    if (this.editable && this.stickerAt(x, y) >= 0) return null; // stickers win in the editor so you can drag them
    const sp = this.spots();
    for (const k of ['key', 'cat', 'radio', 'frame', 'note', 'cake']) { const a = sp[k]; if (a && x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return k; }
    return null;
  }
  burst(kind = 'confetti') {
    const cols = ['#ff7eb6', '#ffe27a', '#7fe0c4', '#9a86ff', '#7fc4ff', '#fff'];
    for (let i = 0; i < 90; i++) this.parts.push({ x: 160 + (Math.random() - .5) * 40, y: 70, vx: (Math.random() - .5) * 3.4, vy: -Math.random() * 3.4 - .6, c: cols[i % cols.length], life: 120 + Math.random() * 80, kind: kind === 'hearts' && i % 3 === 0 ? 'heart' : 'conf' });
  }
  poke() { this.bump = 1; }

  r(x, y, w, h, c) { this.c.fillStyle = c; this.c.fillRect(Math.round(x), Math.round(y), w, h); }
  circ(cx, cy, rad, c) { for (let y = -rad; y <= rad; y++) { const w = Math.floor(Math.sqrt(rad * rad - y * y)); this.r(cx - w, cy + y, w * 2 + 1, 1, c); } }
  sprite(x, y, rows, pal = SPR_COL) { rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && pal[ch]) this.r(x + i, y + j, 1, 1, pal[ch]); })); }

  draw() {
    const s = this.s, t = this.t, room = ROOMS[s.room] || ROOMS.bedroom, th = THEMES[s.theme] || THEMES.other;
    if (this.celebrate) this.hug = Math.min(1, this.hug + 0.012); else this.hug = Math.max(0, this.hug - 0.03);
    this.bg(s.room, room, t);
    if (s.decor.stars) this.stars(t);
    if (s.decor.lights) this.lights(t, th.accent);
    if (s.decor.balloons) this.balloons(t);
    if (s.avatars.on && this.hug === 0) this.avatars(t);
    this.table(th.accent);
    if (s.decor.plants) this.sprite(60, 120, SPR.pot);
    if (s.voice) this.radio(t);
    this.frame(); this.note(); this.cake(t, th);
    if (s.decor.cat) this.sprite(252, 114 + Math.round(Math.sin(t * 2) * .6), SPR.cat);
    if (s.avatars.on && this.hug > 0) this.avatars(t);
    (s.stickers || []).forEach((st, i) => { const sp = SPR[st.k] || SPR.heart, bob = Math.round(Math.sin(t * 2 + i)); this.sprite(st.x, st.y + bob, sp); if (this.editable && i === this.sel) this.outline(st.x - 2, st.y - 2 + bob, sp[0].length + 4, sp.length + 4, t); });
    if (s.reveal === 'key' && (!this.keyFound || this.editable)) { const [kx, ky] = this.keyPos(); this.sprite(kx, ky, SPR.key); if (Math.sin(t * 5) > .3) { this.r(kx + 8, ky - 1, 1, 3, '#fff'); this.r(kx + 7, ky, 3, 1, '#fff'); } }
    if (s.room === 'winter' || s.decor.snow) this.snow(t);
    this.particles();
    this.hotHints(t);
  }
  outline(x, y, w, h, t) { const on = Math.floor(t * 4) % 2; for (let i = 0; i < w; i += 2) { this.r(x + i, y, 1, 1, i % 4 === on * 2 ? '#fff' : INK); this.r(x + i, y + h, 1, 1, i % 4 === on * 2 ? '#fff' : INK); } for (let j = 0; j < h; j += 2) { this.r(x, y + j, 1, 1, '#fff'); this.r(x + w, y + j, 1, 1, '#fff'); } }

  bg(key, rm, t) {
    this.r(0, 0, W, H, rm.wall);
    if (key === 'bedroom') {
      for (let x = 0; x < W; x += 20) this.r(x, 0, 10, 122, rm.wall2);
      this.r(0, 118, W, 62, rm.floor); for (let y = 126; y < H; y += 12) this.r(0, y, W, 1, rm.floor2);
      this.r(0, 116, W, 4, '#fff');
      this.r(120, 12, 80, 58, INK); this.r(123, 15, 74, 52, '#1f2a6b'); this.r(158, 15, 4, 52, INK); this.r(123, 39, 74, 3, INK);
      this.circ(140, 30, 6, '#fff3b0'); this.circ(143, 28, 5, '#1f2a6b');
      [[130, 55], [180, 24], [172, 52], [188, 40]].forEach(([x, y], i) => this.r(x, y, 2, 2, (Math.sin(t * 3 + i) > 0) ? '#fff' : '#9aa6ff'));
      this.r(114, 10, 10, 64, '#ff9ec7'); this.r(196, 10, 10, 64, '#ff9ec7');
    } else if (key === 'cafe') {
      for (let y = 0; y < 118; y += 8) this.r(0, y, W, 1, rm.wall2);
      for (let y = 118; y < H; y += 10) for (let x = 0; x < W; x += 20) this.r(x + ((y / 10) % 2 ? 10 : 0), y, 10, 10, rm.floor2);
      this.r(0, 118, W, 3, '#5c3828');
      this.r(112, 14, 96, 34, '#2b3a34'); this.r(114, 16, 92, 30, '#33473f');
      this.sprite(152, 22, SPR.heart, { r: '#ffd0e0' }); this.r(124, 40, 72, 1, '#cfe3d8');
      [96, 224].forEach((x, i) => { this.r(x, 0, 1, 16, INK); this.r(x - 7, 16, 15, 3, '#ffd77a'); this.r(x - 5, 19, 11, 4 + (Math.sin(t * 2 + i) > .8 ? 1 : 0), '#fff1b0'); });
    } else if (key === 'garden') {
      this.circ(274, 26, 12, '#ffe27a'); this.circ(274, 26, 9, '#fff2a0');
      [[40, 24, 0], [150, 14, 1], [214, 44, 2]].forEach(([x, y, i]) => { const ox = (x + t * 4 + i * 60) % 380 - 30; this.r(ox, y, 30, 8, '#fff'); this.r(ox + 6, y - 5, 18, 6, '#fff'); });
      for (let x = 0; x < W; x += 12) this.r(x, 86, 12, 34, x % 24 ? '#8fe66a' : '#7ad555');
      for (let x = 0; x < W; x += 16) { this.r(x + 2, 92, 10, 30, '#fff'); this.r(x + 2, 90, 10, 2, '#fff'); }
      this.r(0, 100, W, 3, '#e9d6bf'); this.r(0, 110, W, 3, '#e9d6bf');
      this.r(0, 118, W, 62, rm.floor); for (let y = 124; y < H; y += 8) for (let x = (y % 16) ? 4 : 0; x < W; x += 16) this.r(x, y, 3, 2, rm.floor2);
      [[30, 114], [104, 116], [220, 113], [300, 115]].forEach(([x, y], i) => { this.r(x + 1, y + 3, 1, 6, '#3f9d4a'); this.r(x - 1, y, 5, 3, ['#ff7eb6', '#fff', '#ffe27a', '#ff9a6b'][i]); });
    } else if (key === 'winter') {
      ['#27406b', '#2b4574', '#35568a', '#4a6fa5'].forEach((c, i) => this.r(0, i * 24, W, 24, c));
      for (let i = 0; i < 26; i++) this.r((i * 71) % W, (i * 37) % 70, 1, 1, (Math.sin(t * 2 + i) > -.3) ? '#fff' : '#7f96c4');
      this.circ(264, 28, 11, '#fff7d6'); this.circ(269, 25, 9, '#27406b');
      [[10, 96], [58, 90], [250, 92], [296, 98], [196, 88]].forEach(([x, h], i) => { for (let k = 0; k < 4; k++) this.r(x - 6 - k * 3, h - 34 + k * 9 + 8, 13 + k * 6, 9, k % 2 ? '#2f7d58' : '#3a9468'); this.r(x - 1, h + 6, 3, 8, '#5c3c2c'); this.r(x - 5 - 0, h - 34 + 8, 11, 2, '#fff'); });
      this.r(0, 108, W, 12, '#dbe8fa'); this.circ(40, 116, 14, '#dbe8fa'); this.circ(280, 118, 16, '#dbe8fa');
      this.r(0, 118, W, 62, rm.floor); for (let y = 128; y < H; y += 10) for (let x = (y % 20) ? 6 : 0; x < W; x += 20) this.r(x, y, 4, 2, rm.floor2);
    } else if (key === 'sunset') {
      ['#ff9a8b', '#ffb38a', '#ffc994', '#ffe0a8', '#ffeec0'].forEach((c, i) => this.r(0, i * 22, W, 22, c));
      this.circ(160, 92, 22, '#fff0b0'); this.circ(160, 92, 17, '#fff9d6');
      this.r(0, 92, W, 28, '#6e86c4'); for (let y = 94; y < 118; y += 4) for (let x = ((y / 4) % 2) * 8; x < W; x += 16) this.r(x + Math.round(Math.sin(t * 2 + x) * 2), y, 8, 1, '#a9bbe8');
      this.r(120, 92, 80, 26, '#ffd9a055'); [[24, 40], [290, 52]].forEach(([x, y]) => { this.r(x, y, 3, 74 - y + 40, '#6a3a4a'); [[-10, 0], [8, 0], [-8, 5], [6, 5]].forEach(([dx, dy]) => this.r(x + dx, y + dy, 8, 3, '#2f7d58')); });
      this.r(0, 118, W, 62, rm.floor); for (let y = 118; y < H; y += 10) this.r(0, y, W, 1, rm.floor2);
    } else {
      this.r(0, 0, W, H, rm.wall); this.r(0, 40, W, 40, '#262060'); this.r(0, 80, W, 40, '#342b7a');
      for (let i = 0; i < 40; i++) { const x = (i * 83) % W, y = (i * 47) % 100; this.r(x, y, 1 + (i % 2), 1 + (i % 2), (Math.sin(t * 2 + i) > -.3) ? '#fff' : '#6f65c4'); }
      this.circ(262, 30, 13, '#fff3b0'); this.circ(267, 27, 11, '#1f1b4d');
      for (let x = 0; x < W; x += 24) { const h = 24 + ((x * 7) % 30); this.r(x, 120 - h, 22, h, '#1a1545'); for (let wy = 120 - h + 4; wy < 116; wy += 8) this.r(x + 4, wy, 3, 3, ((x + wy) % 5 === 0) ? '#ffe27a' : '#2e2a70'); }
      this.r(0, 118, W, 62, rm.floor); for (let y = 126; y < H; y += 10) this.r(0, y, W, 1, rm.floor2);
    }
  }
  snow(t) { for (let i = 0; i < 44; i++) { const x = (i * 53 + Math.sin(t + i) * 6) % W, y = (i * 29 + t * (14 + (i % 4) * 6)) % H; this.r(((x % W) + W) % W, y, 1 + (i % 3 === 0 ? 1 : 0), 1 + (i % 3 === 0 ? 1 : 0), '#ffffffdd'); } }
  stars(t) { for (let i = 0; i < 9; i++) { const x = 20 + ((i * 37) % 280), y = 8 + ((i * 53) % 70); if (Math.sin(t * 3 + i * 2) > 0) { this.r(x, y - 2, 1, 5, '#fff7b0'); this.r(x - 2, y, 5, 1, '#fff7b0'); } } }
  lights(t, accent) {
    const cols = [accent, '#ffe27a', '#7fe0c4', '#9a86ff'], sag = x => 6 + Math.round(Math.sin(x / 320 * Math.PI * 4) * 4 + 4);
    for (let x = 0; x <= W; x += 2) this.r(x, sag(x), 1, 1, INK);
    for (let x = 8, i = 0; x < W; x += 20, i++) { const y = sag(x), on = Math.sin(t * 4 + i * 1.3) > -.2; this.r(x, y + 1, 3, 5, on ? cols[i % 4] : '#8a7fa8'); if (on) this.r(x - 1, y + 5, 5, 1, cols[i % 4] + '88'); }
  }
  balloons(t) {
    [[40, 128, '#ff7eb6'], [54, 134, '#7fc4ff'], [270, 130, '#ffe27a'], [284, 126, '#7fe0c4']].forEach(([x, y, col], i) => {
      const by = y - 40 + Math.round(Math.sin(t * 1.5 + i) * 2);
      this.circ(x, by, 8, col); this.r(x - 4, by - 5, 3, 3, '#ffffffaa'); this.r(x - 1, by + 8, 3, 2, col);
      for (let k = 0; k < 24; k++) this.r(x + Math.round(Math.sin(k / 3 + t + i) * 1.5), by + 10 + k, 1, 1, '#ffffffcc');
    });
  }
  table(accent) {
    this.r(52, 126, 216, 4, INK); this.r(52, 126, 216, 3, '#fff8ec'); this.r(52, 129, 216, 1, '#e8d9c0');
    this.r(60, 130, 200, 50, accent);
    for (let x = 60; x < 260; x += 8) { this.r(x, 130, 4, 3, '#ffffff55'); this.r(x + 4, 156, 4, 2, '#ffffff44'); }
  }
  radio(t) {
    const x = 74, y = 114;
    this.r(x + 12, y - 4, 1, 5, INK); this.r(x + 12, y - 5, 4, 1, INK);
    this.r(x - 1, y, 22, 13, INK); this.r(x, y + 1, 20, 11, '#ffb86b'); this.r(x + 2, y + 3, 8, 7, INK);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) this.r(x + 3 + i * 2, y + 4 + j * 2, 1, 1, '#ffb86b');
    this.circ(x + 15, y + 5, 2, '#fff'); this.r(x + 13, y + 9, 5, 1, INK);
    if (this.playing) for (let i = 0; i < 3; i++) { const a = (t * 1.5 + i / 3) % 1; this.r(x + 22 + Math.sin(a * 9) * 3, y - 4 - a * 18, 2, 2, ['#ff7eb6', '#7fc4ff', '#ffe27a'][i]); }
  }
  frame() {
    const { x, y } = this.spots().frame, ph = this.s.photos || [], n = Math.min(ph.length, MAX_PHOTOS);
    for (let k = n - 1; k >= 1; k--) { this.r(x + k * 3, y + k * 3, 64, 72, INK); this.r(x + k * 3 + 2, y + k * 3 + 2, 60, 68, k % 2 ? '#d9a050' : '#e8b76c'); }
    this.r(x + 30, y - 24, 1, 24, '#ffffff88'); this.r(x + 29, y - 4, 3, 3, INK);
    this.r(x, y, 64, 72, INK); this.r(x + 2, y + 2, 60, 68, '#e8b76c'); this.r(x + 4, y + 4, 56, 64, '#c98f45'); this.r(x + 6, y + 6, 52, 60, INK); this.r(x + 7, y + 7, 50, 49, '#fff');
    if (this.img) this.c.drawImage(this.img, x + 7, y + 7, 50, 49);
    else { this.r(x + 7, y + 7, 50, 49, '#ffe9f3'); this.sprite(x + 25, y + 22, SPR.heart); for (let i = 0; i < 4; i++) this.r(x + 12 + i * 12, y + 12 + ((i * 7 + Math.floor(this.t * 2)) % 3) * 3, 2, 2, '#ff9ec7'); }
    this.r(x + 7, y + 57, 50, 8, '#fff7e6');
    const cap = ((ph[0] && ph[0].cap) || '').trim();
    for (let i = 0; i < Math.min(cap.length, 12); i++) if (cap[i] !== ' ') this.r(x + 10 + i * 4, y + 60, 3, 2, '#8c6a7f');
    if (n > 1) { this.r(x + 46, y + 10, 14, 9, INK); this.r(x + 47, y + 11, 12, 7, '#ffe27a'); for (let i = 0; i < n; i++) this.r(x + 49 + i * 2 + (i > 0 ? 0 : 0), y + 13, 1, 3, INK); }
  }
  note() {
    const { x, y } = this.spots().note, ns = (this.s.notes || []).slice(0, MAX_NOTES), n = ns.length || 1;
    for (let k = n - 1; k >= 0; k--) {
      const nt = ns[k] || { text: '', color: 'yellow' }, ox = x + k * 3, oy = y - k * 2 + (n - 1) * 2, col = NOTE_COLORS[nt.color] || NOTE_COLORS.yellow;
      this.r(ox + 2, oy + 3, 56, 66, '#00000022'); this.r(ox, oy, 56, 66, INK); this.r(ox + 2, oy + 2, 52, 62, col);
      if (k === 0) {
        this.r(ox + 44, oy + 56, 10, 10, '#00000018'); this.r(ox + 46, oy + 58, 8, 8, INK); this.r(ox + 47, oy + 59, 6, 6, '#ffffff99');
        this.circ(ox + 28, oy + 5, 3, '#ff4f7b'); this.r(ox + 27, oy + 4, 1, 1, '#fff');
        const lines = (nt.text || '').split('\n'); let ly = oy + 16;
        for (let i = 0; i < 7 && i < lines.length + 1; i++, ly += 6) { const L = lines[i] || ''; if (!L.trim()) continue; const len = Math.min(44, 6 + L.length * 2); for (let q = 0; q < len; q += 3) this.r(ox + 6 + q, ly + ((q / 3) % 2), 2, 2, '#6b5679'); }
      }
    }
    if (this.s.reveal && this.s.reveal !== 'none' && !(this.unlocked)) { const lx = x + 18, ly = y + 26; this.r(lx, ly + 6, 20, 14, INK); this.r(lx + 1, ly + 7, 18, 12, '#ffd23c'); this.r(lx + 5, ly, 3, 7, INK); this.r(lx + 12, ly, 3, 7, INK); this.r(lx + 5, ly, 10, 3, INK); this.r(lx + 9, ly + 11, 2, 4, INK); }
  }
  avatar(x, y, a, t, face = 1) {
    const bob = Math.round(Math.sin(t * 4 + x) * .6), yy = y + bob;
    this.r(x + 3, yy + 15, 6, 3, INK); this.r(x + 4, yy + 15, 2, 3, '#5a4a6a'); this.r(x + 6, yy + 15, 2, 3, '#5a4a6a');
    this.r(x + 2, yy + 9, 8, 7, INK); this.r(x + 3, yy + 10, 6, 5, a.shirt);
    this.r(x + 1, yy + 10, 2, 5, INK); this.r(x + 2, yy + 11, 1, 3, a.skin); this.r(x + 9, yy + 10, 2, 5, INK); this.r(x + 9, yy + 11, 1, 3, a.skin);
    this.r(x + 1, yy, 10, 10, INK); this.r(x + 2, yy + 1, 8, 8, a.skin);
    this.r(x + 3 + (face > 0 ? 0 : 1), yy + 5, 1, 2, INK); this.r(x + 7 + (face > 0 ? 0 : 1), yy + 5, 1, 2, INK); this.r(x + 2, yy + 7, 2, 1, '#ff9ab8'); this.r(x + 8, yy + 7, 2, 1, '#ff9ab8');
    const hr = a.hair;
    if (a.style === 0) { this.r(x + 1, yy - 1, 10, 4, hr); this.r(x + 1, yy + 2, 2, 3, hr); this.r(x + 9, yy + 2, 2, 3, hr); }
    else if (a.style === 1) { this.r(x + 1, yy - 1, 10, 4, hr); this.r(x, yy + 2, 3, 11, hr); this.r(x + 9, yy + 2, 3, 11, hr); }
    else { this.r(x + 1, yy, 10, 3, hr); this.circ(x + 2, yy - 1, 2, hr); this.circ(x + 9, yy - 1, 2, hr); }
  }
  avatars(t) {
    const p = this.hug < .5 ? 2 * this.hug * this.hug : 1 - Math.pow(-2 * this.hug + 2, 2) / 2, A = this.s.avatars;
    const jump = this.hug >= 1 ? Math.abs(Math.sin(t * 5)) * 3 : 0;
    this.avatar(98 + (146 - 98) * p, 106 + (134 - 106) * p - jump, A.you, t, 1);
    this.avatar(214 + (158 - 214) * p, 106 + (134 - 106) * p - jump, A.me, t, -1);
    if (this.hug >= 1) { const a = (t * 1.2) % 1; this.sprite(155, 118 - a * 16, ['r.r', 'rrr', '.r.'], { r: '#ff4f7b' }); }
  }
  cake(t, th) {
    const s = this.s, n = s.cakeSize, f = FLAVORS[s.flavor] || FLAVORS.pink, widths = [[58], [76, 54], [88, 66, 46], [96, 74, 54, 38]][n - 1];
    const bump = this.bump > 0 ? Math.sin(this.bump * 10) * this.bump * 1.5 : 0; if (this.bump > 0) this.bump -= 0.04;
    const oy = Math.round(bump);
    this.r(100, 120, 120, 6, INK); this.r(102, 120, 116, 4, '#fff'); this.r(106, 124, 108, 2, '#d9ccea');
    let top = 120;
    widths.forEach((w, i) => {
      const x = 160 - w / 2, ty = 120 - (i + 1) * 16 + oy;
      this.r(x - 1, ty - 1, w + 2, 18, INK); this.r(x, ty, w, 16, f.sponge); this.r(x, ty, w, 6, f.frost);
      for (let dx = 3; dx < w - 5; dx += 9) this.r(x + dx, ty + 6, 5, 3 + ((dx / 9 | 0) % 2) * 2, f.frost);
      for (let dx = 6; dx < w - 4; dx += 11) this.r(x + dx, ty + 11 + (dx % 2) * 2, 2, 2, ['#fff', '#ffe27a', '#7fc4ff', '#ff7eb6'][(dx / 11 | 0) % 4]);
      this.r(x, ty + 14, w, 2, '#00000015');
      if (s.theme === 'valentine' || s.theme === 'anniversary') this.sprite(x + 4, ty + 7, ['r.r', 'rrr', '.r.'], { r: '#ff4f7b' });
      if (s.theme === 'christmas') this.sprite(x + 4, ty + 7, ['.g.', 'ggg', 'ggg'], { g: '#2f9a5a' });
      top = ty;
    });
    const k = Math.max(0, Math.min(9, s.candles | 0)), w0 = widths[widths.length - 1];
    for (let i = 0; i < k; i++) {
      const cx = Math.round(160 - w0 / 2 + 6 + (w0 - 12) * (k === 1 ? .5 : i / (k - 1)));
      this.r(cx - 1, top - 12, 4, 12, INK); this.r(cx, top - 11, 2, 11, i % 2 ? '#7fc4ff' : '#ffffff');
      for (let y = top - 10; y < top; y += 4) this.r(cx, y, 2, 2, th.accent);
      if (this.lit) {
        const fl = Math.round(Math.sin(t * 9 + i * 2) * 1);
        this.r(cx - 1 + fl, top - 20, 4, 8, '#ff9a3c'); this.r(cx + fl, top - 19, 2, 6, '#ffe27a'); this.r(cx + fl, top - 17, 2, 3, '#fff'); this.r(cx - 3, top - 22, 8, 12, '#ffd77a22');
      } else { const a = (t * 20 + i * 5) % 24; if (a < 20) this.r(cx + Math.round(Math.sin(a / 3)), top - 14 - a, 2, 2, '#ffffff' + ['aa', '88', '66', '44', '22'][Math.min(4, a / 4 | 0)]); }
    }
    if (k === 0) this.sprite(156, top - 8, SPR.heart);
  }
  particles() {
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.parts) {
      p.vy += 0.06; p.x += p.vx; p.y += p.vy; p.life--; p.vx *= 0.995;
      if (p.kind === 'heart') this.sprite(Math.round(p.x), Math.round(p.y), ['r.r', 'rrr', '.r.'], { r: p.c }); else this.r(p.x, p.y, 3, 2, p.c);
      if (p.y > H) p.life = 0;
    }
  }
  hotHints(t) {
    const sp = this.spots();
    if (this.hover && sp[this.hover]) {
      const a = sp[this.hover], on = Math.floor(t * 4) % 2;
      for (let i = 0; i < a.w; i += 4) { this.r(a.x + i + on * 2, a.y - 2, 2, 1, '#fff'); this.r(a.x + i + on * 2, a.y + a.h + 1, 2, 1, '#fff'); }
      for (let j = 0; j < a.h; j += 4) { this.r(a.x - 2, a.y + j + on * 2, 1, 2, '#fff'); this.r(a.x + a.w + 1, a.y + j + on * 2, 1, 2, '#fff'); }
    }
    if (this.editable) ['frame', 'note'].forEach(k => { const a = sp[k], b = Math.round(Math.sin(t * 5)); this.r(a.x + a.w - 6, a.y - 6 + b, 9, 9, INK); this.r(a.x + a.w - 5, a.y - 5 + b, 7, 7, '#ffe27a'); this.r(a.x + a.w - 3, a.y - 3 + b, 3, 3, INK); });
  }
  // render one frame at a given time (used for GIF export & thumbnails)
  renderAt(t) { this.t = t; this.draw(); }
}

// Shrink + posterize a photo so it looks like pixel art (also keeps share links small).
export function pixelate(file, size = 56) {
  return new Promise((res, rej) => {
    const im = new Image(), url = URL.createObjectURL(file);
    im.onload = () => {
      const cv = document.createElement('canvas'); cv.width = size; cv.height = Math.round(size * 49 / 50);
      const x = cv.getContext('2d'); x.imageSmoothingQuality = 'high';
      const sc = Math.max(cv.width / im.width, cv.height / im.height), w = im.width * sc, h = im.height * sc;
      x.drawImage(im, (cv.width - w) / 2, (cv.height - h) / 2, w, h);
      const d = x.getImageData(0, 0, cv.width, cv.height), p = d.data;
      for (let i = 0; i < p.length; i += 4) for (let j = 0; j < 3; j++) p[i + j] = Math.min(255, Math.round(p[i + j] / 36) * 36);
      x.putImageData(d, 0, 0); URL.revokeObjectURL(url); res(cv.toDataURL('image/png'));
    };
    im.onerror = rej; im.src = url;
  });
}
