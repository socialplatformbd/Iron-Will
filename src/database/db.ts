import Dexie, { type Table } from 'dexie';
import type {
  AchievementRecord,
  Attempt,
  BackupSnapshot,
  CustomMilestone,
  FavoriteQuote,
  KvRecord,
  TimerState,
} from '@/types';

/**
 * IRON WILL local database (IndexedDB via Dexie).
 * Everything here lives only on the user's device. No remote sync of any kind.
 *
 * Tables for later phases (journal, cravings, focus, goals, ...) are declared now so the
 * schema stays stable and backups already include them.
 */
export interface GenericRow {
  id?: number | string;
  [key: string]: unknown;
}

export class IronWillDB extends Dexie {
  timer!: Table<TimerState, string>;
  attempts!: Table<Attempt, number>;
  achievements!: Table<AchievementRecord, string>;
  milestones!: Table<CustomMilestone, string>;
  favoriteQuotes!: Table<FavoriteQuote, string>;
  kv!: Table<KvRecord, string>;
  backups!: Table<BackupSnapshot, number>;
  // Phase 2 tables (schema reserved)
  journal!: Table<GenericRow, number>;
  cravings!: Table<GenericRow, number>;
  triggers!: Table<GenericRow, number>;
  focusSessions!: Table<GenericRow, number>;
  goals!: Table<GenericRow, number>;
  treeProgress!: Table<GenericRow, string>;
  recovery!: Table<GenericRow, number>;

  constructor() {
    super('iron-will-db');
    this.version(1).stores({
      timer: 'id',
      attempts: '++id, startedAt, endedAt',
      achievements: 'id, days, unlockedAt',
      milestones: 'id, days',
      favoriteQuotes: 'quoteId, savedAt',
      kv: 'key',
      backups: '++id, createdAt',
      journal: '++id, createdAt, mood, trigger',
      cravings: '++id, createdAt, intensity',
      triggers: '++id, name',
      focusSessions: '++id, startedAt',
      goals: '++id, createdAt',
      treeProgress: 'id',
      recovery: '++id, createdAt',
    });
  }
}

export const db = new IronWillDB();

/** Tables included in JSON export/import (the `backups` table is deliberately excluded). */
export const EXPORTABLE_TABLES = [
  'timer',
  'attempts',
  'achievements',
  'milestones',
  'favoriteQuotes',
  'kv',
  'journal',
  'cravings',
  'triggers',
  'focusSessions',
  'goals',
  'treeProgress',
  'recovery',
] as const;

export type ExportableTable = (typeof EXPORTABLE_TABLES)[number];

/** Friendly error type used across the data layer. */
export class StorageError extends Error {
  code: 'quota' | 'unavailable' | 'invalid' | 'unknown';
  constructor(message: string, code: StorageError['code'] = 'unknown') {
    super(message);
    this.name = 'StorageError';
    this.code = code;
  }
}

/** Convert any low-level IndexedDB failure into a StorageError the UI can show. */
export function toStorageError(err: unknown): StorageError {
  if (err instanceof StorageError) return err;
  const name = (err as { name?: string })?.name ?? '';
  const msg = (err as { message?: string })?.message ?? '';
  if (name === 'QuotaExceededError' || /quota/i.test(name + msg)) {
    return new StorageError(
      'Your device is out of storage space for this app. Free some space or export a backup and clear old data.',
      'quota'
    );
  }
  if (name === 'InvalidStateError' || name === 'SecurityError' || name === 'OpenFailedError' || /indexeddb/i.test(msg)) {
    return new StorageError(
      'Local storage is unavailable in this browser mode (private browsing may block it). Your progress cannot be saved.',
      'unavailable'
    );
  }
  return new StorageError(msg || 'An unexpected storage error occurred.', 'unknown');
}

/** Wrap a DB operation so every failure is normalised. */
export async function safe<T>(op: () => Promise<T>): Promise<T> {
  try {
    return await op();
  } catch (err) {
    throw toStorageError(err);
  }
}

/** Open the database and ask the browser for persistent storage (best effort, never guaranteed). */
export async function initDatabase(): Promise<{ persisted: boolean | null }> {
  await safe(() => db.open());
  let persisted: boolean | null = null;
  try {
    if (navigator.storage?.persist) {
      persisted = (await navigator.storage.persisted?.()) ?? false;
      if (!persisted) persisted = await navigator.storage.persist();
    }
  } catch {
    persisted = null;
  }
  return { persisted };
}
