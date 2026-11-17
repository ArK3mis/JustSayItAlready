# 🎁 JustSayItAlready — pixel surprises for your someone

Build a cozy pixel room with a cake, a picture frame and a secret note, then send a magic link.
Birthday, Valentine, Prom, or just because. 100% static (no build step), so it deploys to Vercel as-is.

## Run it in VS Code
Install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.
(or `npx serve .` / `python3 -m http.server`). Modules need http, so don't double-click the file.

## Deploy to Vercel
Push this folder to GitHub → vercel.com → *Add New Project* → import it. No settings needed
(framework: "Other", no build command, output dir = root).

## Two modes
| Mode | How | Good for |
|---|---|---|
| **Demo** (default) | Accounts are saved in the browser; the share link carries the whole surprise inside the URL | Trying it out. Links work on any device, but accounts don't sync |
| **Supabase** | Real accounts, surprises stored in a database, short links `#/s/<id>` | Going live |

### Turn on real accounts (Supabase, free tier)
1. Create a project at supabase.com.
2. SQL Editor → paste & run `supabase/schema.sql`.
3. Settings → API → copy the *Project URL* and *anon public* key into `js/config.js`.
4. (Optional) Authentication → turn off "Confirm email" while testing.
5. Redeploy. Done.

## Project map
```
index.html        page shell
css/style.css     all pixel styling
js/main.js        routing + every screen (home, editor, viewer, dashboard, modals)
js/pixel.js       the canvas scene: room, cake, frame, note, particles. Add rooms/themes here!
js/sound.js       synthesized sfx + music (WebAudio, no audio files)
js/store.js       accounts, saving, share links (local + Supabase)
js/config.js      Supabase keys
```

## Easy things to add next
- New room: add an entry in `ROOMS` + a branch in `Scene.bg()` (pixel.js)
- New sound: add a function to `sfx` (sound.js)
- New theme: add to `THEMES` (pixel.js)
- Ideas: more cake toppers, multiple photo frames, a "reply" button for the receiver, custom mp3 music

## Features
Replies (receiver answers back) · runaway "No" button proposal · open-on-a-date lock · photo wall (4) + stack of notes (4) ·
voice-message radio · draggable stickers + presets · pixel avatars that hug · unlock mini-games (scratch card, heart catcher, hidden key) ·
secret-question lock (AES-encrypted) · Christmas / Anniversary / Graduation packs + template gallery · save as PNG postcard or animated GIF.

## Supabase notes (re-run `supabase/schema.sql` after updating)
- **Replies:** stored in `replies`; you see them on the dashboard (💌 Replies). In demo mode a reply comes back as a link you paste in the dashboard.
- **Date lock:** enforced on the server in Supabase mode. In demo mode it is only enforced by the page.
- **Question lock:** the public copy is encrypted in both modes, the answer is never sent anywhere.
- **Community templates:** only visuals are shared. Consider moderating the `templates` table before going public.
- Voice/photos make demo-mode links long; Supabase links stay short.
