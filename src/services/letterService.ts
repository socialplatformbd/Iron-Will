import { db, safe } from '@/database/db';
import type { Letter } from '@/types';
import { sanitizeMultiline, sanitizeText } from '@/utils/sanitize';

export async function listLetters(): Promise<Letter[]> {
  return safe(() => db.letters.orderBy('createdAt').reverse().toArray());
}

export async function addLetter(input: { title: string; body: string; unlockDays: number }): Promise<void> {
  const body = sanitizeMultiline(input.body, 5000);
  if (!body) throw new Error('Write something to your future self first.');
  const unlockDays = Math.floor(input.unlockDays);
  if (!Number.isFinite(unlockDays) || unlockDays < 0 || unlockDays > 10000) throw new Error('Choose a valid opening day.');
  const record: Letter = {
    createdAt: Date.now(),
    title: sanitizeText(input.title, 80) || 'A letter to myself',
    body,
    unlockDays,
  };
  await safe(() => db.letters.add(record));
}

export async function deleteLetter(id: number): Promise<void> {
  await safe(() => db.letters.delete(id));
}

/**
 * A letter opens when the current streak reaches its day, or when a badge for that many
 * days (or more) was already earned. Earned badges survive resets, so letters stay open.
 */
export function isLetterUnlocked(unlockDays: number, currentDays: number, bestEarnedDays: number): boolean {
  return unlockDays <= 0 || currentDays >= unlockDays || bestEarnedDays >= unlockDays;
}
