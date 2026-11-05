import { db, safe } from '@/database/db';

const pad = (n: number) => String(n).padStart(2, '0');

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function listCheckinDays(): Promise<string[]> {
  const rows = await safe(() => db.checkins.toArray());
  return rows.map((r) => r.day);
}

export async function setCheckin(day: string, on: boolean): Promise<void> {
  if (on) await safe(() => db.checkins.put({ day, createdAt: Date.now() }));
  else await safe(() => db.checkins.delete(day));
}

/**
 * Consecutive checked-in days ending today. If today is not checked in yet,
 * the streak ending yesterday still counts, so the day is not lost until it is over.
 */
export function checkinStreak(days: string[], now: number = Date.now()): number {
  const set = new Set(days);
  const DAY = 24 * 60 * 60 * 1000;
  let cursor = set.has(dayKey(now)) ? now : now - DAY;
  let count = 0;
  while (set.has(dayKey(cursor))) {
    count++;
    cursor -= DAY;
  }
  return count;
}
