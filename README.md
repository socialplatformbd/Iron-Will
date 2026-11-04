# IRON WILL — Build Discipline. Become Unbreakable.

A private, offline-first PWA for breaking bad habits. **Made by Mohammad Rakib.**

- Telegram: https://t.me/appdevbyrakib
- WhatsApp: https://chat.whatsapp.com/HkvJCqWFf6G4bcQRKspKta?s=cl&p=a&iam=2

## Privacy architecture
All personal data lives **only on the user's device**: IndexedDB (Dexie) for records, localStorage for
lightweight preferences (theme, accent, welcome-seen), Cache Storage for the offline app shell.
No login, no accounts, no cloud database, no analytics, no automatic sync. The host serves static files only.

## Install & run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/ (single-file index.html + manifest.json + sw.js + icons/)
npm run preview    # serve the production build locally
```

## HTTPS deployment
Service workers, install prompts and persistent storage require HTTPS (localhost is exempt).
Upload the contents of `dist/` to any static host (Netlify, Cloudflare Pages, GitHub Pages, Vercel, nginx):
1. Serve `index.html`, `manifest.json`, `sw.js` and `icons/` from the same folder.
2. Serve `sw.js` with `Cache-Control: no-cache` so updates roll out. Bump `VERSION` in `public/sw.js` on each release.
3. The app uses hash routing (`/#/progress`), so no server rewrite rules are needed and it works in subfolders.
4. On Android Chrome open the site, then menu → *Install app* (or use the in-app Install button).

## Project structure
```
src/
  components/   reusable UI + feature components (ui/ holds primitives)
  context/      AppContext (state loaded from IndexedDB)
  data/         constants, milestones, offline quote library
  database/     Dexie schema, error normalisation, persistence request
  hooks/        useNow, useInstallPrompt
  layouts/      AppLayout, navigation config
  pages/        Home, Progress, Achievements, Tree, Journal, Emergency, Focus, Coach, History, Settings, About
  services/     timer, profile, achievements, quotes, backup/restore/storage info
  storage/      localStorage preferences
  types/ utils/ vite-env.d.ts
public/         manifest.json, sw.js, icons/
```

## Backup & restore
Settings → Data management: export JSON, import JSON (strictly validated, rows sanitised), automatic on-device
safety snapshots before every import/restore/clear, and one-tap snapshot restore. Nothing is uploaded.

## Phase status
**Phase 1 (done):** architecture, IndexedDB schema, welcome + community invitation, dashboard, accurate timestamp-based timer,
milestones (+custom), achievements that survive resets, habit tree, money saved, daily quote, settings, backup/restore, PWA.

**Phase 2 (done):** Urge Journal, Emergency Mode, Focus Mode, local Motivation Coach, History & Insights.

**Phase 3 (done):** deadline-based timers (survive backgrounding), quality and reliability pass.

**Phase 4 (done, see `PHASE_4_REPORT.md`):** bug-fix and completion pass: mobile access to Coach/History, exit buttons on
immersive pages, input styling bug, journal date bug, strict backup validation for all tables, History charts and
"when moments get hard" insight, progress sharing, coach safety reply, regenerated maskable/Apple icons.

**Not built yet:** scheduled reminders / push notifications (a fully offline web app cannot wake itself reliably),
shareable badge images, a dedicated trigger-library screen.

> Not yet verified by a real `npm run build` or on-device test: run the checklist in `RELEASE_CHECKLIST.md` first.
