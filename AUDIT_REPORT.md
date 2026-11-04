# Iron Will PWA - Audit and Patch Report

## Changes applied in this patched archive

1. **PWA icons were missing.** The manifest referenced PNG files that were not present in `public/icons/`. Generated the required 192x192, 512x512, maskable 512x512, and Apple touch PNG files from the existing app SVG icon.
2. **Manifest icon declarations corrected.** The manifest now points to the real PNG assets, including a proper 192x192 and 512x512 icon entry.
3. **Service worker cache version bumped to v2.** This prompts clients to replace the previous `iron-will-v1` cache and fetch the corrected app shell/assets.
4. **Community join behavior corrected.** Tapping Telegram or WhatsApp from the first-launch welcome modal now marks the invitation as seen and closes the modal, rather than leaving the modal open after the user navigates to the external link.

## Important functionality gaps found

The submitted project is a **Phase 1 implementation**, not the complete feature set from the master prompt. These routes are still explicitly placeholders (`ComingSoonPage`) and are not functional implementations:

- Urge Journal
- Emergency Mode
- Focus Mode
- AI Coach (only local coach is described, but the route is a placeholder)
- History & Statistics
- Smart Trigger Tracker
- Private Accountability
- Notification/reminder controls

The Settings page itself says notification functionality is scheduled for Phase 2. Do not publish or advertise these features as working yet.

## Local data architecture review

The inspected application uses Dexie/IndexedDB for app records, localStorage for lightweight preferences, and Cache Storage for static PWA files. The service worker only handles same-origin GET requests and does not implement remote personal-data storage. No Firebase, Supabase, or cloud database dependency was found in `package.json` or the inspected source.

## Verification limitation

A production build could not be completed in this environment because dependency installation (`npm ci`) did not finish before the execution timeout, leaving Vite unavailable. Therefore this patch has **not** been verified by a successful `npm run build` or on-device Android testing.

Before publishing, run:

```bash
npm ci
npm run build
npm run preview
```

Then test installation, offline launch, IndexedDB persistence, backup/restore, and external community links on a real Android device using HTTPS.

## Storage warning

IndexedDB is stored within the browser's site storage on the user's device, not in an ordinary shared filesystem folder. Browser/site-data clearing or uninstalling may erase it. Keep JSON export/restore and the storage persistence request enabled.
