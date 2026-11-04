# IRON WILL release checklist

- [ ] Install locked dependencies with `npm ci`.
- [ ] Confirm `npm run build` succeeds.
- [ ] Run `npm run preview` and check all routes.
- [ ] Install the PWA from Chrome on Android.
- [ ] Enable airplane mode and verify the installed app opens offline.
- [ ] Create, edit, search, and delete a journal entry.
- [ ] Run Focus Mode, background the app, resume it, and verify elapsed time.
- [ ] Run Emergency Mode, pause/resume it, and verify the five-minute countdown.
- [ ] Export a JSON backup, clear test data, import the backup, and verify restoration.
- [ ] Confirm personal records remain local and no login or cloud sync is introduced.
- [ ] Test light/dark themes, navigation, and small-screen layout.
- [ ] Export a fresh backup before any app update that changes database schema.
- [ ] On a phone, confirm Coach and History open from the Home screen and that Emergency / Focus have a working "Back to home" link.
- [ ] Edit a journal entry and confirm its original date is kept (shows "edited").
- [ ] Import a backup that contains journal, emergency and focus records and confirm they all restore.
- [ ] Install the PWA and confirm the home-screen icon fills the whole mask shape (no white corners).
