// Accounts + saving + share links.
// Two modes, same API:
//  - local    : accounts & surprises in localStorage, share link = surprise packed inside the URL
//  - supabase : real accounts, surprises in your database, short share links
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const mode = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'local';
const LS = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('jsia.' + k)) ?? d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('jsia.' + k, JSON.stringify(v)); } catch (e) { throw new Error('Storage is full or blocked in this browser.'); } },
};
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const sha = async (s) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');

// ---- URL packing for local-mode share links ----
const b64u = (bytes) => { let s = ''; for (let i = 0; i < bytes.length; i += 8192) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
export async function pack(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (window.CompressionStream) {
    const cs = new CompressionStream('deflate-raw'); const w = cs.writable.getWriter(); w.write(raw); w.close();
    return 'z.' + b64u(new Uint8Array(await new Response(cs.readable).arrayBuffer()));
  }
  return 'r.' + b64u(raw);
}
export async function unpack(str) {
  const [k, body] = [str.slice(0, 2), str.slice(2)]; let bytes = unb64u(body);
  if (k === 'z.') { const ds = new DecompressionStream('deflate-raw'); const w = ds.writable.getWriter(); w.write(bytes); w.close(); bytes = new Uint8Array(await new Response(ds.readable).arrayBuffer()); }
  return JSON.parse(new TextDecoder().decode(bytes));
}

// ---- question lock: the whole surprise is AES-encrypted with a key made from the answer ----
const norm = a => String(a).toLowerCase().trim().replace(/\s+/g, ' ');
async function aesKey(answer, salt) {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(norm(answer)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 120000, hash: 'SHA-256' }, km, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function lockScene(data) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const { lock, ...rest } = data;
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(lock.a, salt), new TextEncoder().encode(JSON.stringify({ ...rest, lock: { q: lock.q, a: '' } }))));
  const all = new Uint8Array(28 + ct.length); all.set(salt); all.set(iv, 16); all.set(ct, 28);
  return { locked: 1, q: lock.q, to: data.to || '', unlockAt: data.unlockAt || '', blob: b64u(all) };
}
export async function unlockScene(wrapper, answer) {
  const all = unb64u(wrapper.blob);
  try { const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(16, 28) }, await aesKey(answer, all.slice(0, 16)), all.slice(28)); return JSON.parse(new TextDecoder().decode(pt)); }
  catch (e) { throw new Error('Hmm, that is not the answer.'); }
}

// ---- Supabase helpers (plain fetch, no library) ----
let session = LS.get('session', null);
async function sb(path, { method = 'GET', body, auth = true, headers = {} } = {}) {
  if (auth && session && session.expires_at && Date.now() / 1000 > session.expires_at - 30) await refresh();
  const res = await fetch(SUPABASE_URL + path, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + (auth && session ? session.access_token : SUPABASE_ANON_KEY), ...headers },
  });
  const txt = await res.text(); let j = null; try { j = txt ? JSON.parse(txt) : null; } catch (e) {}
  if (!res.ok) throw new Error((j && (j.msg || j.message || j.error_description || j.error)) || 'Something went wrong (' + res.status + ')');
  return j;
}
function setSession(j) {
  session = { access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || (Date.now() / 1000 + (j.expires_in || 3600)), user: j.user };
  LS.set('session', session);
}
async function refresh() {
  try { setSession(await sb('/auth/v1/token?grant_type=refresh_token', { method: 'POST', auth: false, body: { refresh_token: session.refresh_token } })); }
  catch (e) { session = null; LS.set('session', null); }
}

// ---- public API ----
export function getUser() {
  if (mode === 'supabase') return session ? { id: session.user.id, email: session.user.email, name: session.user.user_metadata?.name || session.user.email.split('@')[0] } : null;
  const e = LS.get('current', null); if (!e) return null;
  const u = LS.get('users', {})[e]; return u ? { id: e, email: e, name: u.name } : null;
}

export async function signUp(name, email, password) {
  email = email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('That email looks a little off.');
  if (password.length < 6) throw new Error('Password needs at least 6 characters.');
  if (mode === 'supabase') {
    const j = await sb('/auth/v1/signup', { method: 'POST', auth: false, body: { email, password, data: { name } } });
    if (j.access_token) setSession(j); else throw new Error('Check your email to confirm your account, then log in!');
    return getUser();
  }
  const users = LS.get('users', {});
  if (users[email]) throw new Error('That email already has an account. Try logging in!');
  users[email] = { name: name || email.split('@')[0], hash: await sha(password) };
  LS.set('users', users); LS.set('current', email); return getUser();
}
export async function signIn(email, password) {
  email = email.trim().toLowerCase();
  if (mode === 'supabase') { setSession(await sb('/auth/v1/token?grant_type=password', { method: 'POST', auth: false, body: { email, password } })); return getUser(); }
  const u = LS.get('users', {})[email];
  if (!u || u.hash !== await sha(password)) throw new Error('Email or password does not match.');
  LS.set('current', email); return getUser();
}
export function signOut() { if (mode === 'supabase') { session = null; LS.set('session', null); } else LS.set('current', null); }

export async function listMine() {
  const me = getUser(); if (!me) return [];
  if (mode === 'supabase') return (await sb('/rest/v1/scenes?select=id,title,data,updated_at&order=updated_at.desc')).map(r => ({ id: r.id, ...r.data, updatedAt: r.updated_at }));
  return LS.get('scenes', []).filter(s => s.owner === me.id).sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function getMine(id) { return (await listMine()).find(s => s.id === id) || null; }
export async function save(scene) {
  const me = getUser(); if (!me) throw new Error('Please log in first.');
  const { id, owner, updatedAt, ...data } = scene;
  if (mode === 'supabase') {
    const pub = data.lock && data.lock.a ? await lockScene(data) : data;
    if (id) { await sb('/rest/v1/scenes?id=eq.' + id, { method: 'PATCH', body: { title: data.title, data, pub, updated_at: new Date().toISOString() } }); return { ...data, id }; }
    const r = await sb('/rest/v1/scenes', { method: 'POST', body: { title: data.title, data, pub }, headers: { Prefer: 'return=representation' } });
    return { ...data, id: r[0].id };
  }
  const all = LS.get('scenes', []); const out = { ...data, id: id || 'l' + uid(), owner: me.id, updatedAt: Date.now() };
  const i = all.findIndex(s => s.id === out.id); if (i >= 0) all[i] = out; else all.push(out);
  LS.set('scenes', all); return out;
}
export async function remove(id) {
  if (mode === 'supabase') return void await sb('/rest/v1/scenes?id=eq.' + id, { method: 'DELETE' });
  LS.set('scenes', LS.get('scenes', []).filter(s => s.id !== id));
}
const baseUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
export async function shareLink(scene) {
  if (mode === 'supabase') return baseUrl() + '#/s/' + scene.id;
  const { id, owner, updatedAt, ...data } = scene;
  return baseUrl() + '#/s/' + await pack(data.lock && data.lock.a ? await lockScene(data) : data);
}
// returns a scene, a locked wrapper ({locked,q,blob}) or a waiting notice ({waiting}) when the date lock is closed
export async function loadShared(key) {
  if (/^[zr]\./.test(key)) return unpack(key);
  if (mode === 'supabase') { const r = await sb('/rest/v1/rpc/get_scene', { method: 'POST', auth: false, body: { sid: key } }); if (r) return r; }
  throw new Error('This surprise could not be found.');
}

// ---- replies: the receiver answers back ----
export async function sendReply(key, reply) {
  if (mode === 'supabase' && !/^[zr]\./.test(key)) { await sb('/rest/v1/rpc/add_reply', { method: 'POST', auth: false, body: { sid: key, r: reply } }); return { sent: true }; }
  return { link: baseUrl() + '#/r/' + await pack(reply) };
}
export async function loadReply(key) { return unpack(key); }
export async function listReplies(sceneId) {
  if (mode !== 'supabase') return [];
  return (await sb('/rest/v1/replies?scene_id=eq.' + sceneId + '&select=data,created_at&order=created_at.desc')).map(r => ({ ...r.data, at: r.created_at }));
}

// ---- community template gallery (Supabase mode only) ----
export async function publishTemplate(name, data) {
  if (mode !== 'supabase') throw new Error('The community gallery needs Supabase mode (see README).');
  await sb('/rest/v1/rpc/publish_template', { method: 'POST', body: { n: name, d: data } });
}
export async function listTemplates() {
  if (mode !== 'supabase') return [];
  try { return (await sb('/rest/v1/rpc/list_templates', { method: 'POST', auth: false, body: {} })) || []; } catch (e) { return []; }
}
