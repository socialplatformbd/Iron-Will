# Iron Will — Phase 2

This update implements the Journal, Emergency Mode, Focus Mode, Local Motivation Coach, and History & Insights screens.

## Run locally

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

The app uses IndexedDB on the user's device for personal records. No remote database or login is configured. The Motivation Coach uses local rules and does not contact an AI API.

See `PHASE_2_REPORT.md` for implementation details and verification limitations.
