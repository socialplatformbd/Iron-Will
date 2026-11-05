import { db, safe } from '@/database/db';
import { MS_DAY } from '@/data/constants';
import { DEFAULT_MILESTONES } from '@/data/milestones';
import type { AchievementRecord, CustomMilestone, Milestone } from '@/types';
import { sanitizeText } from '@/utils/sanitize';
import { tr } from '@/i18n';

export function buildMilestones(custom: CustomMilestone[]): Milestone[] {
  const extra: Milestone[] = custom.map((c) => ({
    id: c.id,
    days: c.days,
    title: c.title,
    description: tr('Your personal {n}-day milestone.', { n: c.days }),
    custom: true,
  }));
  return [...DEFAULT_MILESTONES, ...extra]
    .filter((m, i, arr) => arr.findIndex((x) => x.days === m.days && x.id === m.id) === i)
    .sort((a, b) => a.days - b.days);
}

export async function listAchievements(): Promise<AchievementRecord[]> {
  return safe(() => db.achievements.orderBy('unlockedAt').reverse().toArray());
}

export async function listCustomMilestones(): Promise<CustomMilestone[]> {
  return safe(() => db.milestones.orderBy('days').toArray());
}

export async function addCustomMilestone(days: number, title: string): Promise<CustomMilestone> {
  const d = Math.floor(days);
  if (!Number.isFinite(d) || d < 1 || d > 10000) throw new Error(tr("Enter a number of days between 1 and 10,000."));
  const clean = sanitizeText(title, 40) || tr('{n}-Day Goal', { n: d });
  const existing = await listCustomMilestones();
  if (existing.some((m) => m.days === d) || DEFAULT_MILESTONES.some((m) => m.days === d)) {
    throw new Error(tr("A milestone for that many days already exists."));
  }
  const record: CustomMilestone = { id: `c-${d}`, days: d, title: clean, createdAt: Date.now() };
  await safe(() => db.milestones.put(record));
  return record;
}

export async function removeCustomMilestone(id: string): Promise<void> {
  // Removes only the milestone definition. Earned achievements are never deleted.
  await safe(() => db.milestones.delete(id));
}

/**
 * Persist any milestone the current attempt has reached. Earned achievements are never removed,
 * so they survive resets. Returns the newly unlocked records.
 */
export async function unlockReached(startedAt: number | null, milestones: Milestone[]): Promise<AchievementRecord[]> {
  if (startedAt == null) return [];
  const elapsed = Date.now() - startedAt;
  if (elapsed < 0) return [];
  return safe(() =>
    db.transaction('rw', db.achievements, async () => {
      const have = new Set((await db.achievements.toArray()).map((a) => a.id));
      const fresh: AchievementRecord[] = [];
      for (const m of milestones) {
        if (elapsed >= m.days * MS_DAY && !have.has(m.id)) {
          fresh.push({ id: m.id, days: m.days, title: m.title, unlockedAt: startedAt + m.days * MS_DAY });
        }
      }
      if (fresh.length) await db.achievements.bulkPut(fresh);
      return fresh;
    })
  );
}
