// JustSayItAlready sound engine — every sound is synthesized with WebAudio (no audio files needed!)
// Cute chiptune bloops, pops, squeaks and sparkles. Tweak the numbers to make your own.

let ctx = null;
let master = null;
let muted = false;
try { muted = localStorage.getItem('jsia.muted') === '1'; } catch (e) {}

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ f = 440, to = null, d = 0.1, type = 'square', v = 0.18, at = 0 }) {
  if (muted) return;
  const c = ac();
  const t = c.currentTime + at;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + d + 0.03);
}

function noise({ d = 0.3, v = 0.15, at = 0, from = 4000, to = 400 }) {
  if (muted) return;
  const c = ac();
  const t = c.currentTime + at;
  const len = Math.floor(c.sampleRate * d);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.setValueAtTime(from, t);
  filt.frequency.exponentialRampToValueAtTime(to, t + d);
  const g = c.createGain();
  g.gain.setValueAtTime(v, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  src.connect(filt); filt.connect(g); g.connect(master);
  src.start(t);
}

const arp = (notes, step = 0.06, o = {}) =>
  notes.forEach((f, i) => tone({ f, d: 0.14, type: 'square', v: 0.12, at: i * step, ...o }));

export const sfx = {
  boop()    { tone({ f: 520, to: 820, d: 0.09, type: 'sine', v: 0.3 }); },
  bloop()   { tone({ f: 760, to: 300, d: 0.12, type: 'sine', v: 0.3 }); },
  pop()     { tone({ f: 900, to: 180, d: 0.07, type: 'triangle', v: 0.35 }); noise({ d: 0.05, v: 0.12, from: 6000, to: 1500 }); },
  squeak()  { tone({ f: 600, to: 1500, d: 0.11, type: 'triangle', v: 0.25 }); tone({ f: 900, to: 1900, d: 0.09, type: 'triangle', v: 0.2, at: 0.12 }); },
  giggle()  { [0, 0.07, 0.14, 0.21, 0.28].forEach((a, i) => tone({ f: 1100 + (i % 2) * 400, to: 1500 + (i % 2) * 300, d: 0.06, type: 'triangle', v: 0.2, at: a })); },
  mew()     { tone({ f: 750, to: 1050, d: 0.12, type: 'triangle', v: 0.25 }); tone({ f: 1050, to: 600, d: 0.2, type: 'triangle', v: 0.25, at: 0.12 }); },
  woo()     { tone({ f: 300, to: 900, d: 0.18, type: 'sine', v: 0.3 }); tone({ f: 900, to: 450, d: 0.22, type: 'sine', v: 0.3, at: 0.18 }); },
  tick()    { tone({ f: 1300 + Math.random() * 300, d: 0.025, type: 'square', v: 0.07 }); },
  sparkle() { arp([1046, 1318, 1568, 2093, 2637], 0.055, { type: 'triangle', v: 0.16 }); },
  heart()   { arp([659, 784, 988, 1318], 0.08, { type: 'sine', v: 0.25 }); },
  success() { arp([523, 659, 784, 1046], 0.09); },
  error()   { tone({ f: 220, to: 110, d: 0.2, type: 'square', v: 0.15 }); },
  blow()    { noise({ d: 0.55, v: 0.22, from: 3000, to: 300 }); },
  open()    { tone({ f: 300, to: 700, d: 0.12, type: 'square', v: 0.14 }); arp([784, 988, 1175, 1568], 0.07, { at: 0.12, type: 'triangle' }); },
  swish()   { noise({ d: 0.15, v: 0.1, from: 5000, to: 800 }); },
  tada() {
    [[523, 0], [659, 0.1], [784, 0.2], [1046, 0.32]].forEach(([f, a]) => tone({ f, d: 0.22, type: 'square', v: 0.14, at: a }));
    [[1046, 0.32], [1318, 0.32], [1568, 0.32]].forEach(([f, a]) => tone({ f, d: 0.7, type: 'triangle', v: 0.14, at: a }));
    setTimeout(() => sfx.sparkle(), 450);
  },
};

// ---- little music player -------------------------------------------------
const N = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, G3: 196, A3: 220, B3: 246.94, F3: 174.61 };
const SONGS = {
  birthday: { bpm: 150, loop: false, notes: [
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['C5', 1], ['B4', 2],
    ['G4', .75], ['G4', .25], ['A4', 1], ['G4', 1], ['D5', 1], ['C5', 2],
    ['G4', .75], ['G4', .25], ['G5', 1], ['E5', 1], ['C5', 1], ['B4', 1], ['A4', 1],
    ['F5', .75], ['F5', .25], ['E5', 1], ['C5', 1], ['D5', 1], ['C5', 2]] },
  twinkle: { bpm: 120, loop: true, notes: [
    ['C4', 1], ['C4', 1], ['G4', 1], ['G4', 1], ['A4', 1], ['A4', 1], ['G4', 2],
    ['F4', 1], ['F4', 1], ['E4', 1], ['E4', 1], ['D4', 1], ['D4', 1], ['C4', 2]] },
  cozy: { bpm: 96, loop: true, notes: [
    ['C4', .5], ['E4', .5], ['G4', .5], ['B4', .5], ['G4', .5], ['E4', .5], ['C4', .5], ['E4', .5],
    ['A3', .5], ['C4', .5], ['E4', .5], ['G4', .5], ['E4', .5], ['C4', .5], ['A3', .5], ['C4', .5],
    ['F3', .5], ['A3', .5], ['C4', .5], ['E4', .5], ['C4', .5], ['A3', .5], ['F3', .5], ['A3', .5],
    ['G3', .5], ['B3', .5], ['D4', .5], ['G4', .5], ['D4', .5], ['B3', .5], ['G3', .5], ['B3', .5]] },
};
let token = 0;
export const music = {
  play(name) {
    this.stop();
    const song = SONGS[name];
    if (!song || muted) return;
    const my = ++token;
    let i = 0;
    const beat = 60000 / song.bpm;
    const step = () => {
      if (my !== token) return;
      if (i >= song.notes.length) { if (!song.loop) return; i = 0; }
      const [n, b] = song.notes[i++];
      tone({ f: N[n], d: Math.max(0.12, b * beat / 1000 * 0.9), type: name === 'cozy' ? 'triangle' : 'square', v: name === 'cozy' ? 0.16 : 0.07 });
      setTimeout(step, b * beat);
    };
    step();
  },
  stop() { token++; },
  names: Object.keys(SONGS),
};

export const audio = {
  unlock() { try { ac(); } catch (e) {} },
  get muted() { return muted; },
  setMuted(m) {
    muted = m;
    try { localStorage.setItem('jsia.muted', m ? '1' : '0'); } catch (e) {}
    if (m) music.stop();
  },
};
