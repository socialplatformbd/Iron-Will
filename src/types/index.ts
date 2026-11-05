export interface TimerState {
  id: 'main';
  /** Epoch ms of the current attempt's start, or null when no attempt is running. */
  startedAt: number | null;
  updatedAt: number;
}

export interface Attempt {
  id?: number;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  /** Optional private note about what happened / what was learned. */
  note?: string;
  habitName?: string;
}

export interface AchievementRecord {
  /** Milestone id, e.g. "d7" or "c-10" */
  id: string;
  days: number;
  title: string;
  unlockedAt: number;
}

export interface CustomMilestone {
  id: string;
  days: number;
  title: string;
  createdAt: number;
}

export interface Milestone {
  id: string;
  days: number;
  title: string;
  description: string;
  custom?: boolean;
}

export interface Profile {
  habitName: string;
  /** Previous daily spending on the habit. */
  dailyCost: number;
  currency: string;
  reasons: string[];
}

export interface Quote {
  id: string;
  text: string;
  category: 'discipline' | 'resilience' | 'focus' | 'recovery' | 'growth';
}

export interface FavoriteQuote {
  quoteId: string;
  savedAt: number;
}

export interface KvRecord {
  key: string;
  value: unknown;
  updatedAt: number;
}

export interface BackupSnapshot {
  id?: number;
  createdAt: number;
  label: string;
  /** Serialized backup JSON, stored on-device only. */
  json: string;
  bytes: number;
}

export type ThemeMode = 'dark' | 'light';
export type AccentId = 'forge' | 'emerald' | 'sky' | 'violet' | 'rose';

export interface LocalPrefs {
  theme: ThemeMode;
  accent: AccentId;
  welcomeSeen: boolean;
  communityDismissedAt: number | null;
  lastQuoteSeen?: string;
}

export interface BackupFile {
  app: 'iron-will';
  schemaVersion: number;
  appVersion: string;
  exportedAt: string;
  data: Record<string, unknown[]>;
  prefs?: Partial<LocalPrefs>;
}

export interface Letter {
  id?: number;
  createdAt: number;
  title: string;
  body: string;
  /** Opens once the streak (or an earned badge) reaches this many days. 0 = always open. */
  unlockDays: number;
}
