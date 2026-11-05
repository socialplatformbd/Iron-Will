# IRON WILL - Phase 6 (Bengali + daily habits), v1.2.0

## Added
- **Bengali interface.** Settings -> Language: English / বাংলা. Defaults to Bengali on Bengali browsers. Every screen, toast, error message, quote, badge, tree stage and the coach replies are translated (606 entries in `src/i18n/bn.ts`). Switching language remounts the screens; no reload is needed.
- **Daily check-in** card on Home: one tap per day, 14-day dots, current check-in streak. New `checkins` table (Dexie schema v3), included in JSON backup with validation.
- **Weekly report** on History: check-ins, journal entries, emergency uses, focus minutes, money saved this week, and a share button (text only).

## How translation works (for future edits)
- UI text is written in English and wrapped as `tr('English text')`. `trn(n, 'one', 'many')` handles plurals; `{name}` placeholders are filled from a vars object.
- A missing Bengali entry simply shows the English text. To translate new text, add `"English text": "বাংলা"` to `src/i18n/bn.ts`; placeholders must match.
- Digits stay Latin (1, 2, 3) everywhere for consistency.
- The coach understands common Bengali words for craving, setback, progress and crisis messages.

## Verified here
- Every `.ts/.tsx` file transpiles; no unused-variable or syntax errors reported by a partial TypeScript check.
- Dictionary covers all 456 UI strings plus data (milestones, quotes, tree, labels); placeholders match in every entry.
- Runtime tests: translation, plurals, variables, durations and greeting in both languages; check-in streak rules; backup validation for checkins, letters, journal; old backups still import.
- Not verified: real `npm run build`, rendering of Bengali text on a phone, Dexie v2 -> v3 upgrade on a device with existing data.

## Please check on a phone
Bengali text fits in buttons and cards (long words may wrap), the language switch works, check-in saves, and old data survives the update.
