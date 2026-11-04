# IRON WILL - Phase 4 Fix & Completion Report

## Bugs fixed
1. **Inputs had no background.** `.field` used `var(--surface2)` but the token is `--surface-2`. Journal, Emergency and Coach inputs were transparent.
2. **Coach and History unreachable on phones.** They existed only in the desktop sidebar. Added Home shortcuts.
3. **No way out of Emergency / Focus.** Those routes hide navigation. Added a "Back to home" link.
4. **Journal edit overwrote the original date.** Edits now keep `createdAt` and add `updatedAt` ("edited"). Cancel also resets mood and intensity.
5. **Backup import did not validate Phase 2 tables.** Journal, cravings, focusSessions, triggers, goals, recovery and treeProgress were imported raw. They are now validated and sanitised (tags stripped, numbers clamped, nested objects dropped, line breaks preserved). Covered by a test run (see below).
6. **Duplicate error toasts and unhandled promise rejections** on milestone add/remove and favourite toggle.
7. **Daily quote did not change after midnight** while the app stayed open.
8. **Coach logic:** the "relapse" setback branch was unreachable, "want" matched almost everything, the chat never scrolled, and the progress button depended on wording. Reordered and fixed.
9. **Focus Mode** showed "Resume focus" after finishing. It now shows "Start again". Save errors are reported.
10. **Emergency Mode** gave no feedback after saving and could throw an unhandled error. It now confirms and reports failures.
11. **Maskable icon was a copy of the normal icon** (transparent rounded corners). Regenerated a full-bleed maskable 512 icon and an opaque Apple touch icon.
12. **Stale text:** Settings said notifications "arrive in Phase 2"; removed the unused `ComingSoonPage`. Package name/version aligned (`iron-will` 1.0.0, lockfile updated).
13. Service worker cache bumped to `v3` and now precaches the Apple touch icon. Added a `<noscript>` message.

## Completed
- History: 7-day activity chart, hardest time of day (last 30 days), focus minutes, completed emergency count, error state.
- Progress: "Share my progress" (shares only the day count, user-initiated).
- Coach: safety reply for self-harm wording (English and Bengali) pointing to local emergency help; Emergency page crisis note.
- Haptic vibration when a breathing or focus session completes (where supported).

## Verification performed here
- Every `.ts/.tsx` file transpiles (esbuild); `sw.js` passes `node --check`; manifest, package.json and lockfile are valid JSON.
- Backup validator tested with a stubbed Dexie: invalid rows dropped, values clamped, tags stripped, newlines kept, unknown/newer backups rejected.
- Coach keyword routing tested for English and Bengali phrases.
- TypeScript strict check could not complete: no network, so React/Dexie type packages were unavailable. No unused-variable or syntax errors were reported.

## Still required before public release
`npm ci`, `npm run build`, `npm run preview`, then the checklist in `RELEASE_CHECKLIST.md` on a real Android phone over HTTPS. Not built: scheduled notifications, shareable badge images, dedicated trigger-library screen.
