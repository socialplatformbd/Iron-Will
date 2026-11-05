# IRON WILL - Phase 7 (PIN lock), v1.3.0

## What it does
- Settings -> **Privacy lock**: set a 4-6 digit PIN, change it, remove it, or lock now.
- With a PIN set, the app opens on a full-screen keypad. No personal data is rendered until the PIN is entered.
- **Auto-lock** when the app returns from the background: immediately, after 30 seconds, 1 minute (default) or 5 minutes.
- **Brute-force slowdown:** 5 wrong tries, then a pause of 30 s that doubles with every further miss (max 15 min). The counter survives reloads.
- **Forgot PIN:** the only way back in is to erase all data on the device (including safety snapshots) and remove the lock. Offered on the lock screen with a clear warning.
- English and Bengali text for every new screen.

## How the PIN is stored
Only a salted PBKDF2-SHA256 hash (120,000 rounds) is kept in localStorage under its own key. The PIN itself is never saved. The lock record is **not** part of JSON backups, so a backup file never carries the PIN.

## Honest limits
- This is a privacy screen against casual snooping, not encryption. The data in IndexedDB is not encrypted, and someone with technical access to the browser profile could bypass the lock.
- Wrong-PIN pauses are enforced by the app, not by the operating system.
- Needs HTTPS (GitHub Pages is HTTPS). On plain HTTP the option is disabled with a message.
- The installed app's name and icon stay "Iron Will" (a web app cannot change them after install).
- Home-screen shortcuts (Emergency, Journal, Focus) also ask for the PIN first.

## Verified here
- 25 automated checks on the PIN service: hashing (PIN not stored in plain text), format rules, counter and cooldown progression, cooldown rejecting the correct PIN, change and remove with PIN check, corrupt-record handling.
- Syntax of all files; dictionary has 641 Bengali entries and none is missing; placeholders match.
- Not verified: the real build, the keypad on a phone, auto-lock timing on a device.

## Please check on a phone
Set a PIN, close the app, reopen it, and confirm the keypad appears first; try wrong PINs; switch apps and return after the delay; remove the PIN; confirm English and Bengali both read well.
