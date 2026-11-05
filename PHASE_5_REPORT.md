# IRON WILL - Phase 5 (engagement features)

Added in v1.1.0:
- **Why you started** on the Emergency screen: shows the reasons saved in Habit & savings.
- **Letters to Myself** (new `/letters` page, new `letters` table, Dexie schema v2): write now, opens at a chosen day or badge. Stays open after a reset once the badge was earned. Included in JSON backup with validation. Older backups still import.
- **Shareable badge image**: Share button on earned badges. Image shows only badge name and day count.
- **Home-screen shortcuts**: long-press the installed icon for Emergency, Journal, Focus.
- Home shortcuts for Coach, History and Letters; service worker cache `v4`.

Verified here: syntax of all files, manifest/sw, letter validator and unlock rules (stubbed Dexie). Not verified: real build, canvas rendering and Web Share on a device, Dexie v1 to v2 upgrade on an existing install. Test those on a phone first.

Not built yet: Bengali interface (needs every screen translated), daily check-in calendar, weekly report.
