// Tiny reveal mini-games. Each returns a DOM element; call onWin() when the player wins.
import { sfx } from './sound.js';

export function scratchGame(text, onWin) {
  const w = 280, h = 160, wrap = document.createElement('div'); wrap.className = 'game';
  wrap.innerHTML = `<p class="hint center">Scratch the card with your finger or mouse ✨</p>`;
  const box = document.createElement('div'); box.className = 'scratch'; box.style.cssText = `width:${w}px;height:${h}px;position:relative;margin:0 auto`;
  const under = document.createElement('div'); under.className = 'scratch-under'; under.textContent = text || 'A secret note is waiting for you ♥';
  const cv = document.createElement('canvas'); cv.width = w / 4; cv.height = h / 4; cv.style.cssText = `position:absolute;inset:0;width:${w}px;height:${h}px;image-rendering:pixelated;touch-action:none;cursor:crosshair`;
  const c = cv.getContext('2d'); c.fillStyle = '#c9c1d8'; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = '#e4def0'; for (let y = 0; y < cv.height; y += 4) for (let x = (y / 4 % 2) * 2; x < cv.width; x += 4) c.fillRect(x, y, 2, 2);
  box.append(under, cv); wrap.append(box);
  let down = false, done = false, lastTick = 0;
  const scratch = e => {
    if (!down || done) return; const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * cv.width, y = (e.clientY - r.top) / r.height * cv.height;
    c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, 5, 0, 7); c.fill();
    if (performance.now() - lastTick > 70) { sfx.tick(); lastTick = performance.now(); }
    const d = c.getImageData(0, 0, cv.width, cv.height).data; let clear = 0; for (let i = 3; i < d.length; i += 16) if (d[i] < 128) clear++;
    if (clear / (d.length / 16) > 0.5) { done = true; cv.style.transition = 'opacity .4s'; cv.style.opacity = 0; sfx.sparkle(); setTimeout(onWin, 700); }
  };
  cv.addEventListener('pointerdown', e => { down = true; cv.setPointerCapture(e.pointerId); scratch(e); });
  cv.addEventListener('pointermove', scratch); cv.addEventListener('pointerup', () => { down = false; });
  return wrap;
}

export function catchGame(onWin, goal = 8) {
  const w = 240, h = 300, wrap = document.createElement('div'); wrap.className = 'game';
  const score = document.createElement('p'); score.className = 'hint center'; score.textContent = `Catch ${goal} hearts! 0/${goal}`;
  const cv = document.createElement('canvas'); cv.width = 120; cv.height = 150; cv.style.cssText = `width:${w}px;height:${h}px;display:block;margin:0 auto;image-rendering:pixelated;background:linear-gradient(#ffd9ec,#d5f3ff);touch-action:none;box-shadow:0 0 0 4px #3b2a4a`;
  wrap.append(score, cv); const c = cv.getContext('2d');
  let bx = 60, got = 0, items = [], last = 0, over = false, raf = 0;
  const heart = (x, y, col) => { c.fillStyle = col; [[1, 0], [2, 0], [4, 0], [5, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [2, 4], [3, 4], [4, 4], [3, 5]].forEach(([i, j]) => c.fillRect(x + i, y + j, 1, 1)); };
  const move = e => { const r = cv.getBoundingClientRect(); bx = Math.max(10, Math.min(110, (e.clientX - r.left) / r.width * 120)); };
  cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
  const keys = e => { if (e.key === 'ArrowLeft') bx = Math.max(10, bx - 8); if (e.key === 'ArrowRight') bx = Math.min(110, bx + 8); };
  addEventListener('keydown', keys);
  const loop = ts => {
    if (!wrap.isConnected && last) { removeEventListener('keydown', keys); return; }
    if (over) return;
    if (ts - last > 650 - got * 25) { items.push({ x: 6 + Math.random() * 100, y: -6, v: 0.7 + Math.random() * 0.5 + got * 0.07 }); last = ts; }
    c.clearRect(0, 0, 120, 150);
    items.forEach(it => { it.y += it.v; heart(Math.round(it.x), Math.round(it.y), '#ff4f7b'); });
    items = items.filter(it => {
      if (it.y > 136 && it.y < 146 && Math.abs(it.x + 3 - bx) < 14) { got++; sfx.heart(); score.textContent = `Catch ${goal} hearts! ${got}/${goal}`; if (got >= goal) { over = true; sfx.tada(); setTimeout(onWin, 600); } return false; }
      return it.y < 152;
    });
    c.fillStyle = '#3b2a4a'; c.fillRect(bx - 12, 140, 24, 8); c.fillStyle = '#ffe27a'; c.fillRect(bx - 11, 141, 22, 6); c.fillStyle = '#ffb86b'; for (let i = -10; i < 10; i += 4) c.fillRect(bx + i, 142, 2, 4);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(ts => { last = ts; loop(ts); });
  return wrap;
}

// voice recorder: returns {el, get} — get() resolves to a data URL (or null)
export function recorder(existing, maxSec = 8) {
  const el = document.createElement('div'); el.className = 'form';
  let data = existing || null, rec = null, stream = null;
  const info = document.createElement('p'); info.className = 'hint'; const audio = document.createElement('audio'); audio.controls = true; audio.style.width = '100%';
  const btn = document.createElement('button'); btn.className = 'btn pink'; btn.textContent = '🎙 Record (max ' + maxSec + 's)';
  const del = document.createElement('button'); del.className = 'btn ghost'; del.textContent = 'Remove';
  const sync = () => { audio.style.display = data ? '' : 'none'; del.style.display = data ? '' : 'none'; if (data) audio.src = data; };
  btn.onclick = async () => {
    if (rec) { rec.stop(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const chunks = [];
      rec = new MediaRecorder(stream, { audioBitsPerSecond: 16000 });
      rec.ondataavailable = e => chunks.push(e.data);
      rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); clearTimeout(tm); const blob = new Blob(chunks, { type: rec.mimeType }); const fr = new FileReader(); fr.onload = () => { data = fr.result; rec = null; btn.textContent = '🎙 Record again'; info.textContent = `Saved! (${Math.round(data.length / 1024)} KB)`; sync(); sfx.success(); }; fr.readAsDataURL(blob); };
      rec.start(); btn.textContent = '⏹ Stop'; info.textContent = 'Recording…'; sfx.pop();
      const tm = setTimeout(() => rec && rec.stop(), maxSec * 1000);
    } catch (e) { info.textContent = 'Microphone not available. Check the browser permission.'; rec = null; sfx.error(); }
  };
  del.onclick = () => { data = null; info.textContent = ''; sync(); };
  info.textContent = 'A short voice message plays from a little pixel radio on the table.';
  el.append(btn, info, audio, del); sync();
  return { el, get: () => data };
}
