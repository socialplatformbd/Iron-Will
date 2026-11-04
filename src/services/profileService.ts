import { db, safe } from '@/database/db';
import { CURRENCIES } from '@/data/constants';
import type { Profile } from '@/types';
import { parseMoney, sanitizeText } from '@/utils/sanitize';

export const DEFAULT_PROFILE: Profile = {
  habitName: '',
  dailyCost: 0,
  currency: 'USD',
  reasons: [],
};

export function normalizeProfile(input: unknown): Profile {
  const p = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const currency = CURRENCIES.some((c) => c.code === p.currency) ? (p.currency as string) : 'USD';
  const reasons = Array.isArray(p.reasons)
    ? p.reasons.map((r) => sanitizeText(r, 160)).filter(Boolean).slice(0, 10)
    : [];
  return {
    habitName: sanitizeText(p.habitName, 60),
    dailyCost: parseMoney(p.dailyCost),
    currency,
    reasons,
  };
}

export async function getProfile(): Promise<Profile> {
  const row = await safe(() => db.kv.get('profile'));
  return normalizeProfile(row?.value);
}

export async function saveProfile(profile: Profile): Promise<Profile> {
  const clean = normalizeProfile(profile);
  await safe(() => db.kv.put({ key: 'profile', value: clean, updatedAt: Date.now() }));
  return clean;
}
