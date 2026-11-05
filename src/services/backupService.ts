import { db, EXPORTABLE_TABLES, safe, StorageError, toStorageError } from '@/database/db';
import { APP_VERSION } from '@/data/constants';
import { loadPrefs, sanitizePrefs } from '@/storage/localPrefs';
import { normalizeProfile } from '@/services/profileService';
import type { BackupFile, BackupSnapshot } from '@/types';
import { sanitizeMultiline, sanitizeText } from '@/utils/sanitize';

import { tr } from '@/i18n';
export const BACKUP_SCHEMA_VERSION = 1;
const MAX_BACKUP_BYTES = 30 * 1024 * 1024;
const MAX_SNAPSHOTS = 5;

type Row = Record<string, unknown>;

/* ---------------------------------- export ---------------------------------- */

export async function buildBackup(): Promise<BackupFile> {
  const data: Record<string, unknown[]> = {};
  await safe(() =>
    db.transaction('r', EXPORTABLE_TABLES.map((t) => db.table(t)), async () => {
      for (const name of EXPORTABLE_TABLES) data[name] = await db.table(name).toArray();
    })
  );
  const prefs = loadPrefs();
  return {
    app: 'iron-will',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    prefs: { theme: prefs.theme, accent: prefs.accent, lang: prefs.lang },
  };
}

/** Trigger a local file download. Nothing is uploaded anywhere. */
export async function downloadBackup(): Promise<{ filename: string; bytes: number }> {
  const backup = await buildBackup();
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const filename = `iron-will-backup-${stamp}.json`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return { filename, bytes: blob.size };
}

/* ---------------------------------- validate ---------------------------------- */

const isObj = (v: unknown): v is Row => !!v && typeof v === 'object' && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const JOURNAL_MOODS = ['Calm', 'Okay', 'Anxious', 'Stressed', 'Sad', 'Angry'];

/** Clamp a possibly-invalid number into [min, max], falling back to `fallback`. */
function clamp(v: unknown, min: number, max: number, fallback: number): number {
  return isNum(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

/** Keep only primitive fields (strings are sanitised); nested objects are dropped. */
function sanitizeGenericRow(r: Row): Row {
  const out: Row = {};
  for (const [k, v] of Object.entries(r)) {
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    if (typeof v === 'string') out[sanitizeText(k, 40)] = sanitizeMultiline(v, 1000);
    else if (isNum(v) || typeof v === 'boolean' || v === null) out[sanitizeText(k, 40)] = v;
  }
  return out;
}

const ROW_VALIDATORS: Partial<Record<(typeof EXPORTABLE_TABLES)[number], (r: Row) => Row | null>> = {
  timer: (r) =>
    r.id === 'main' && (r.startedAt === null || isNum(r.startedAt))
      ? { id: 'main', startedAt: r.startedAt, updatedAt: isNum(r.updatedAt) ? r.updatedAt : Date.now() }
      : null,
  attempts: (r) =>
    isNum(r.startedAt) && isNum(r.endedAt) && r.endedAt >= r.startedAt
      ? {
          ...(isNum(r.id) ? { id: r.id } : {}),
          startedAt: r.startedAt,
          endedAt: r.endedAt,
          durationMs: isNum(r.durationMs) ? r.durationMs : r.endedAt - r.startedAt,
          note: sanitizeText(r.note, 300) || undefined,
          habitName: sanitizeText(r.habitName, 60) || undefined,
        }
      : null,
  achievements: (r) =>
    typeof r.id === 'string' && isNum(r.days) && isNum(r.unlockedAt)
      ? { id: sanitizeText(r.id, 40), days: r.days, title: sanitizeText(r.title, 40), unlockedAt: r.unlockedAt }
      : null,
  milestones: (r) =>
    typeof r.id === 'string' && isNum(r.days) && r.days >= 1
      ? { id: sanitizeText(r.id, 40), days: Math.floor(r.days), title: sanitizeText(r.title, 40), createdAt: isNum(r.createdAt) ? r.createdAt : Date.now() }
      : null,
  favoriteQuotes: (r) =>
    typeof r.quoteId === 'string' ? { quoteId: sanitizeText(r.quoteId, 40), savedAt: isNum(r.savedAt) ? r.savedAt : Date.now() } : null,
  kv: (r) => {
    if (typeof r.key !== 'string') return null;
    const value = r.key === 'profile' ? normalizeProfile(r.value) : r.value;
    return { key: sanitizeText(r.key, 60), value, updatedAt: isNum(r.updatedAt) ? r.updatedAt : Date.now() };
  },
  journal: (r) =>
    isNum(r.createdAt)
      ? {
          ...(isNum(r.id) ? { id: r.id } : {}),
          createdAt: r.createdAt,
          ...(isNum(r.updatedAt) ? { updatedAt: r.updatedAt } : {}),
          mood: JOURNAL_MOODS.includes(r.mood as string) ? r.mood : 'Okay',
          intensity: clamp(r.intensity, 1, 5, 3),
          trigger: sanitizeText(r.trigger, 160),
          notes: sanitizeMultiline(r.notes, 2000),
          helped: sanitizeMultiline(r.helped, 1000),
        }
      : null,
  cravings: (r) =>
    isNum(r.createdAt)
      ? {
          ...(isNum(r.id) ? { id: r.id } : {}),
          createdAt: r.createdAt,
          intensity: clamp(r.intensity, 0, 5, 0),
          trigger: sanitizeText(r.trigger, 160),
          note: sanitizeMultiline(r.note, 500),
          completed: r.completed === true,
        }
      : null,
  focusSessions: (r) =>
    isNum(r.startedAt)
      ? {
          ...(isNum(r.id) ? { id: r.id } : {}),
          startedAt: r.startedAt,
          endedAt: isNum(r.endedAt) ? r.endedAt : r.startedAt,
          durationSeconds: clamp(r.durationSeconds, 0, 24 * 3600, 0),
          completed: r.completed === true,
        }
      : null,
  checkins: (r) =>
    typeof r.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && !Number.isNaN(Date.parse(r.day))
      ? { day: r.day, createdAt: isNum(r.createdAt) ? r.createdAt : Date.now() }
      : null,
  letters: (r) =>
    isNum(r.createdAt) && typeof r.body === 'string' && sanitizeMultiline(r.body, 5000)
      ? {
          ...(isNum(r.id) ? { id: r.id } : {}),
          createdAt: r.createdAt,
          title: sanitizeText(r.title, 80) || 'A letter to myself',
          body: sanitizeMultiline(r.body, 5000),
          unlockDays: Math.floor(clamp(r.unlockDays, 0, 10000, 0)),
        }
      : null,
  // Tables reserved for later phases: keep only plain, sanitised primitive fields.
  triggers: (r) => sanitizeGenericRow(r),
  goals: (r) => sanitizeGenericRow(r),
  recovery: (r) => sanitizeGenericRow(r),
  treeProgress: (r) => (typeof r.id === 'string' && r.id ? sanitizeGenericRow(r) : null),
};

export interface ValidatedBackup {
  data: Record<string, Row[]>;
  prefs: ReturnType<typeof sanitizePrefs>;
  counts: Record<string, number>;
  exportedAt: string;
  skipped: number;
}

/** Strictly validate a parsed backup. Throws StorageError('invalid') with a readable message. */
export function validateBackup(parsed: unknown): ValidatedBackup {
  const bad = (m: string) => new StorageError(m, 'invalid');
  if (!isObj(parsed)) throw bad(tr("This file is not a valid Iron Will backup."));
  if (parsed.app !== 'iron-will') throw bad(tr("This file was not created by Iron Will."));
  if (!isNum(parsed.schemaVersion) || parsed.schemaVersion < 1) throw bad(tr("Backup is missing a valid version number."));
  if (parsed.schemaVersion > BACKUP_SCHEMA_VERSION) throw bad(tr("This backup was made by a newer version of Iron Will. Please update the app first."));
  if (!isObj(parsed.data)) throw bad(tr("Backup data section is missing."));

  const data: Record<string, Row[]> = {};
  const counts: Record<string, number> = {};
  let skipped = 0;
  for (const name of EXPORTABLE_TABLES) {
    const rows = (parsed.data as Row)[name];
    if (rows === undefined) {
      data[name] = [];
      counts[name] = 0;
      continue;
    }
    if (!Array.isArray(rows)) throw bad(tr('Backup section "{name}" is malformed.', { name }));
    const validator = ROW_VALIDATORS[name];
    const clean: Row[] = [];
    for (const r of rows) {
      if (!isObj(r)) {
        skipped++;
        continue;
      }
      const v = validator ? validator(r) : r;
      if (v) clean.push(v);
      else skipped++;
    }
    data[name] = clean;
    counts[name] = clean.length;
  }
  return {
    data,
    prefs: sanitizePrefs(parsed.prefs),
    counts,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    skipped,
  };
}

export function parseBackupText(text: string): ValidatedBackup {
  if (text.length > MAX_BACKUP_BYTES) throw new StorageError(tr("This file is too large to be an Iron Will backup."), 'invalid');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new StorageError(tr("This file is not valid JSON."), 'invalid');
  }
  return validateBackup(parsed);
}

/* ---------------------------------- snapshots ---------------------------------- */

/** Save an on-device snapshot of the current data so a later import/clear can be undone. */
export async function createSnapshot(label: string): Promise<BackupSnapshot | null> {
  try {
    const backup = await buildBackup();
    const json = JSON.stringify(backup);
    const snap: BackupSnapshot = { createdAt: Date.now(), label, json, bytes: json.length };
    snap.id = await db.backups.add(snap);
    const all = await db.backups.orderBy('createdAt').toArray();
    const extra = all.slice(0, Math.max(0, all.length - MAX_SNAPSHOTS));
    if (extra.length) await db.backups.bulkDelete(extra.map((e) => e.id!) as number[]);
    return snap;
  } catch {
    return null; // snapshots are best effort (e.g. quota full)
  }
}

export async function listSnapshots(): Promise<Omit<BackupSnapshot, 'json'>[]> {
  const all = await safe(() => db.backups.orderBy('createdAt').reverse().toArray());
  return all.map(({ json: _json, ...rest }) => rest);
}

export async function deleteSnapshot(id: number): Promise<void> {
  await safe(() => db.backups.delete(id));
}

/* ---------------------------------- import / restore ---------------------------------- */

export interface ImportResult {
  counts: Record<string, number>;
  skipped: number;
  prefs: ValidatedBackup['prefs'];
  snapshotSaved: boolean;
}

/** Replace all local data with the validated backup, inside a single transaction. */
export async function applyBackup(validated: ValidatedBackup, snapshotLabel = 'Before import'): Promise<ImportResult> {
  const snapshot = await createSnapshot(snapshotLabel);
  try {
    await db.transaction(
      'rw',
      EXPORTABLE_TABLES.map((t) => db.table(t)),
      async () => {
        for (const name of EXPORTABLE_TABLES) {
          const table = db.table(name);
          await table.clear();
          if (validated.data[name]?.length) await table.bulkPut(validated.data[name]);
        }
      }
    );
  } catch (err) {
    throw toStorageError(err);
  }
  return { counts: validated.counts, skipped: validated.skipped, prefs: validated.prefs, snapshotSaved: !!snapshot };
}

export async function importBackupText(text: string): Promise<ImportResult> {
  return applyBackup(parseBackupText(text), 'Before import');
}

export async function restoreSnapshot(id: number): Promise<ImportResult> {
  const snap = await safe(() => db.backups.get(id));
  if (!snap) throw new StorageError(tr("That backup no longer exists."), 'invalid');
  return applyBackup(parseBackupText(snap.json), 'Before restore');
}

/** Erase every personal record on this device (a safety snapshot is saved first). */
export async function clearAllData(): Promise<{ snapshotSaved: boolean }> {
  const snapshot = await createSnapshot('Before clearing data');
  try {
    await db.transaction(
      'rw',
      EXPORTABLE_TABLES.map((t) => db.table(t)),
      async () => {
        for (const name of EXPORTABLE_TABLES) await db.table(name).clear();
      }
    );
  } catch (err) {
    throw toStorageError(err);
  }
  return { snapshotSaved: !!snapshot };
}

/** Permanently remove saved safety snapshots too (used for a true wipe). */
export async function deleteAllSnapshots(): Promise<void> {
  await safe(() => db.backups.clear());
}

/* ---------------------------------- storage info ---------------------------------- */

export interface StorageInfo {
  usage: number | null;
  quota: number | null;
  persisted: boolean | null;
  records: number;
  supported: boolean;
}

export async function getStorageInfo(): Promise<StorageInfo> {
  let usage: number | null = null;
  let quota: number | null = null;
  let persisted: boolean | null = null;
  try {
    if (navigator.storage?.estimate) {
      const e = await navigator.storage.estimate();
      usage = e.usage ?? null;
      quota = e.quota ?? null;
    }
    if (navigator.storage?.persisted) persisted = await navigator.storage.persisted();
  } catch {
    /* ignore */
  }
  let records = 0;
  try {
    for (const name of EXPORTABLE_TABLES) records += await db.table(name).count();
  } catch {
    /* ignore */
  }
  return { usage, quota, persisted, records, supported: !!navigator.storage?.estimate };
}

export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}
