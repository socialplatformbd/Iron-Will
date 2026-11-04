import { db, safe } from '@/database/db';
import type { Attempt, TimerState } from '@/types';
import { sanitizeText } from '@/utils/sanitize';

export async function getTimer(): Promise<TimerState | undefined> {
  return safe(() => db.timer.get('main'));
}

/** Start (or re-start from a stopped state) the timer at a given real timestamp. */
export async function startTimer(startedAt: number): Promise<TimerState> {
  if (!Number.isFinite(startedAt)) throw new Error('Invalid start time.');
  if (startedAt > Date.now() + 60_000) throw new Error('The start time cannot be in the future.');
  const state: TimerState = { id: 'main', startedAt, updatedAt: Date.now() };
  await safe(() => db.timer.put(state));
  return state;
}

/** Change the start date/time of the running attempt. */
export async function editStartTime(startedAt: number): Promise<TimerState> {
  return startTimer(startedAt);
}

/**
 * Recovery-friendly reset:
 * - the finished attempt is stored in history (inside one transaction with the timer update)
 * - achievements, journal entries and longest streak are never touched
 * - a fresh attempt starts at `restartAt`
 */
export async function resetTimer(options: { note?: string; habitName?: string; restartAt?: number } = {}): Promise<{
  attempt: Attempt | null;
  timer: TimerState;
}> {
  const now = Date.now();
  const restartAt = options.restartAt ?? now;
  return safe(() =>
    db.transaction('rw', db.timer, db.attempts, async () => {
      const current = await db.timer.get('main');
      let attempt: Attempt | null = null;
      if (current?.startedAt != null) {
        attempt = {
          startedAt: current.startedAt,
          endedAt: now,
          durationMs: Math.max(0, now - current.startedAt),
          note: sanitizeText(options.note, 300) || undefined,
          habitName: sanitizeText(options.habitName, 60) || undefined,
        };
        attempt.id = await db.attempts.add(attempt);
      }
      const timer: TimerState = { id: 'main', startedAt: restartAt, updatedAt: now };
      await db.timer.put(timer);
      return { attempt, timer };
    })
  );
}

export async function listAttempts(): Promise<Attempt[]> {
  return safe(() => db.attempts.orderBy('endedAt').reverse().toArray());
}

export async function deleteAttempt(id: number): Promise<void> {
  await safe(() => db.attempts.delete(id));
}
