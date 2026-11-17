// Tiny animated-GIF encoder + postcard/GIF export for scenes. No libraries.
import { Scene, W, H } from './pixel.js';

function lzw(idx, minCode) {
  const clear = 1 << minCode, eoi = clear + 1, out = [];
  let size = minCode + 1, next = eoi + 1, cur = 0, bits = 0, dict = new Map();
  const emit = (c, isClear) => {
    cur |= c << bits; bits += size;
    while (bits >= 8) { out.push(cur & 255); cur >>>= 8; bits -= 8; }
    if (isClear) size = minCode + 1; else if (next > (1 << size) - 1 && size < 12) size++;
  };
  emit(clear, true);
  let prefix = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = idx[i], key = prefix * 256 + k, f = dict.get(key);
    if (f !== undefined) { prefix = f; continue; }
    emit(prefix, false);
    if (next < 4096) dict.set(key, next++);
    else { emit(clear, true); dict = new Map(); next = eoi + 1; }
    prefix = k;
  }
  emit(prefix, false); emit(eoi, false);
  if (bits > 0) out.push(cur & 255);
  return out;
}

export function encodeGIF(frames, w, h, delayCs = 7) {
  const b = [];
  const u16 = v => b.push(v & 255, (v >> 8) & 255);
  [..."GIF89a"].forEach(c => b.push(c.charCodeAt(0))); u16(w); u16(h); b.push(0xF7, 0, 0);
  for (let i = 0; i < 256; i++) b.push(Math.round(((i >> 5) & 7) * 255 / 7), Math.round(((i >> 2) & 7) * 255 / 7), Math.round((i & 3) * 255 / 3));
  b.push(0x21, 0xFF, 11, ..."NETSCAPE2.0".split('').map(c => c.charCodeAt(0)), 3, 1, 0, 0, 0);
  for (const d of frames) {
    b.push(0x21, 0xF9, 4, 0, delayCs & 255, 0, 0, 0);
    b.push(0x2C); u16(0); u16(0); u16(w); u16(h); b.push(0);
    const idx = new Uint8Array(w * h);
    for (let i = 0, p = 0; i < idx.length; i++, p += 4) idx[i] = ((d[p] >> 5) << 5) | ((d[p + 1] >> 5) << 2) | (d[p + 2] >> 6);
    const data = lzw(idx, 8); b.push(8);
    for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); b.push(n); for (let j = 0; j < n; j++) b.push(data[i + j]); }
    b.push(0);
  }
  b.push(0x3B);
  return new Blob([new Uint8Array(b)], { type: 'image/gif' });
}

async function offscreen(state, { lit = true, celebrate = false } = {}) {
  const cv = document.createElement('canvas'), sc = new Scene(cv);
  sc.setState(state); sc.lit = lit; sc.celebrate = celebrate; sc.keyFound = true; sc.unlocked = true;
  if (sc.imgSrc) await new Promise(r => setTimeout(r, 250));
  return sc;
}

export async function makeGIF(state, scale = 2, frames = 20) {
  const sc = await offscreen(state, { lit: false, celebrate: true }); sc.hug = 0.6;
  sc.burst(state.theme === 'valentine' ? 'hearts' : 'confetti');
  const big = document.createElement('canvas'); big.width = W * scale; big.height = H * scale;
  const bc = big.getContext('2d', { willReadFrequently: true }); bc.imageSmoothingEnabled = false;
  const data = [];
  for (let i = 0; i < frames; i++) { sc.renderAt(i * 0.08 + 3); bc.drawImage(sc.cv, 0, 0, W * scale, H * scale); data.push(bc.getImageData(0, 0, big.width, big.height).data); if (i % 4 === 0) await new Promise(r => setTimeout(r)); }
  return encodeGIF(data, big.width, big.height, 7);
}

export async function makePostcard(state) {
  try { await document.fonts.load('20px "Press Start 2P"'); } catch (e) {}
  const sc = await offscreen(state, { lit: true }); sc.renderAt(1.2);
  const S = 4, pad = 40, top = 120, bot = 110, cw = W * S + pad * 2, ch = H * S + top + bot;
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
  c.fillStyle = '#ffd9ec'; c.fillRect(0, 0, cw, ch);
  c.fillStyle = '#ffffff66'; for (let y = 0; y < ch; y += 16) for (let x = 0; x < cw; x += 16) c.fillRect(x, y, 2, 2);
  c.fillStyle = '#3b2a4a'; c.fillRect(pad - 8, top - 8, W * S + 16, H * S + 16);
  c.drawImage(sc.cv, pad, top, W * S, H * S);
  c.textAlign = 'center'; c.fillStyle = '#3b2a4a';
  c.font = '34px "Press Start 2P", monospace'; c.fillText(state.title || '', cw / 2, 78, cw - 60);
  c.font = '18px "Press Start 2P", monospace';
  const line = [state.to ? 'for ' + state.to : '', state.from ? 'from ' + state.from : ''].filter(Boolean).join('  ♥  ');
  c.fillText(line || 'a little surprise ♥', cw / 2, ch - 56, cw - 60);
  c.font = '12px "Press Start 2P", monospace'; c.fillStyle = '#8a6aa8'; c.fillText('made with JustSayItAlready', cw / 2, ch - 22);
  return new Promise(r => cv.toBlob(r, 'image/png'));
}

export function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
