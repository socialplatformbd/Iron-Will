import { MS_DAY } from '@/data/constants';
import type { Attempt, Milestone } from '@/types';

export interface Stats {
  currentMs: number;
  longestMs: number;
  totalCleanMs: number;
  attemptsCount: number;
  previousAttempts: number;
}

/** All statistics are derived from real timestamps – never from an in-memory counter. */
export function computeStats(startedAt: number | null, attempts: Attempt[], now: number): Stats {
  const currentMs = startedAt != null ? Math.max(0, now - startedAt) : 0;
  const pastLongest = attempts.reduce((m, a) => Math.max(m, a.durationMs), 0);
  const pastTotal = attempts.reduce((s, a) => s + a.durationMs, 0);
  return {
    currentMs,
    longestMs: Math.max(pastLongest, currentMs),
    totalCleanMs: pastTotal + currentMs,
    attemptsCount: attempts.length + (startedAt != null ? 1 : 0),
    previousAttempts: attempts.length,
  };
}

export interface MilestoneProgress {
  reached: Milestone | null;
  next: Milestone | null;
  /** 0..1 progress from zero toward the next milestone (1 when all are complete). */
  fraction: number;
  remainingMs: number;
  completed: number;
}

export function getMilestoneProgress(elapsedMs: number, milestones: Milestone[]): MilestoneProgress {
  const sorted = [...milestones].sort((a, b) => a.days - b.days);
  let reached: Milestone | null = null;
  let next: Milestone | null = null;
  let completed = 0;
  for (const m of sorted) {
    if (elapsedMs >= m.days * MS_DAY) {
      reached = m;
      completed++;
    } else if (!next) {
      next = m;
    }
  }
  if (!next) return { reached, next: null, fraction: 1, remainingMs: 0, completed };
  const target = next.days * MS_DAY;
  return {
    reached,
    next,
    fraction: Math.min(1, Math.max(0, elapsedMs / target)),
    remainingMs: Math.max(0, target - elapsedMs),
    completed,
  };
}
