import { useCallback, useEffect, useRef, useState } from 'react';
import { Database, Download, History, RotateCcw, ShieldAlert, Trash2, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import {
  applyBackup,
  clearAllData,
  deleteAllSnapshots,
  deleteSnapshot,
  downloadBackup,
  getStorageInfo,
  listSnapshots,
  parseBackupText,
  requestPersistence,
  restoreSnapshot,
  type StorageInfo,
  type ValidatedBackup,
} from '@/services/backupService';
import { formatBytes } from '@/utils/format';
import { formatDate } from '@/utils/time';

const LABELS: Record<string, string> = {
  attempts: 'Previous attempts',
  achievements: 'Achievements',
  milestones: 'Custom milestones',
  favoriteQuotes: 'Favorite quotes',
  journal: 'Journal entries',
  cravings: 'Craving records',
  focusSessions: 'Focus sessions',
  goals: 'Goals',
  letters: 'Letters to myself',
};

type Pending = { kind: 'import'; data: ValidatedBackup; filename: string } | { kind: 'restore'; id: number; label: string } | { kind: 'clear' } | null;

export function DataManagement() {
  const toast = useToast();
  const { reload, startedAt, resetPreferences } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [info, setInfo] = useState<StorageInfo | null>(null);
  const [snaps, setSnaps] = useState<Awaited<ReturnType<typeof listSnapshots>>>([]);
  const [pending, setPending] = useState<Pending>(null);
  const [busy, setBusy] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setInfo(await getStorageInfo());
      setSnaps(await listSnapshots());
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh, startedAt]);

  const onExport = async () => {
    setBusy(true);
    try {
      const { filename, bytes } = await downloadBackup();
      setLastBackup(`${filename} (${formatBytes(bytes)})`);
      toast.success('Backup exported', `${filename} was saved to your device. It was not uploaded anywhere.`);
    } catch (e) {
      toast.error('Export failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    if (fileRef.current) fileRef.current.value = '';
    if (file.size > 30 * 1024 * 1024) return toast.error('File too large', 'This does not look like an Iron Will backup.');
    try {
      const text = await file.text();
      const data = parseBackupText(text);
      setPending({ kind: 'import', data, filename: file.name });
    } catch (e) {
      toast.error('Invalid backup', (e as Error).message);
    }
  };

  const confirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      if (pending.kind === 'import') {
        const res = await applyBackup(pending.data, 'Before import');
        await reload(res.prefs);
        toast.success('Backup restored', res.snapshotSaved ? 'Your previous data was kept as a safety snapshot.' : 'Your data has been replaced.');
      } else if (pending.kind === 'restore') {
        const res = await restoreSnapshot(pending.id);
        await reload(res.prefs);
        toast.success('Snapshot restored');
      } else {
        const { snapshotSaved } = await clearAllData();
        await reload();
        toast.success('Application data cleared', snapshotSaved ? 'A safety snapshot was saved in case you change your mind.' : undefined);
      }
      setPending(null);
      await refresh();
    } catch (e) {
      toast.error('Action failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const persist = async () => {
    const ok = await requestPersistence();
    toast[ok ? 'success' : 'info'](ok ? 'Persistent storage granted' : 'Browser did not grant persistence', ok ? undefined : 'Keep regular JSON backups. Browsers may still clear site data.');
    void refresh();
  };

  const pct = info?.usage != null && info.quota ? Math.max(0.5, (info.usage / info.quota) * 100) : null;

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Database className="h-4 w-4 text-accent" /> Local storage
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Stored on</dt>
            <dd className="text-right font-medium">This device only (IndexedDB)</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Records</dt>
            <dd className="font-medium">{info?.records ?? '…'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Browser storage used</dt>
            <dd className="font-medium">{info?.usage != null ? `${formatBytes(info.usage)}${info.quota ? ` of ${formatBytes(info.quota)}` : ''}` : 'Not reported'}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Persistent storage</dt>
            <dd className="font-medium">{info?.persisted == null ? 'Unsupported' : info.persisted ? 'Granted' : 'Not granted'}</dd>
          </div>
        </dl>
        {pct != null && (
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
        )}
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface2/60 p-3 text-xs leading-relaxed text-muted">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
          Clearing your browser or site data, or uninstalling the app, may erase these records. Persistence cannot be guaranteed, so export a backup regularly.
        </p>
        {info?.persisted === false && (
          <Button size="sm" variant="secondary" className="mt-3" onClick={persist}>
            Request persistent storage
          </Button>
        )}
      </Card>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button variant="primary" icon={<Download className="h-4 w-4" />} onClick={onExport} disabled={busy}>
            Export JSON backup
          </Button>
          <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()} disabled={busy}>
            Import JSON backup
          </Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void onFile(e.target.files?.[0])} />
        </div>
        {lastBackup && <p className="mt-3 text-xs text-success">Last export: {lastBackup}</p>}
        <p className="mt-3 text-xs leading-relaxed text-muted">Backups are plain JSON files saved to your device. They are never uploaded automatically. Importing replaces your current data after validation.</p>
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <History className="h-4 w-4 text-accent" /> Safety snapshots
        </div>
        {snaps.length === 0 ? (
          <p className="text-sm text-muted">Before every import, restore or data clear, Iron Will keeps an on-device snapshot so you can undo it. None yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {snaps.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{s.label}</div>
                  <div className="text-xs text-muted">
                    {formatDate(s.createdAt, true)} · {formatBytes(s.bytes)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="sm" variant="secondary" onClick={() => setPending({ kind: 'restore', id: s.id!, label: s.label })}>
                    Restore
                  </Button>
                  <button
                    aria-label="Delete snapshot"
                    onClick={async () => {
                      await deleteSnapshot(s.id!);
                      void refresh();
                    }}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
        {snaps.length > 0 && (
          <button
            className="mt-2 text-xs text-muted underline hover:text-danger"
            onClick={async () => {
              await deleteAllSnapshots();
              toast.info('Safety snapshots deleted');
              void refresh();
            }}
          >
            Permanently delete all snapshots
          </button>
        )}
      </Card>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={() => {
              resetPreferences();
              toast.success('Preferences reset', 'Theme and accent are back to default.');
            }}
          >
            Reset preferences
          </Button>
          <Button variant="danger" icon={<Trash2 className="h-4 w-4" />} onClick={() => setPending({ kind: 'clear' })}>
            Clear application data
          </Button>
        </div>
      </Card>

      <Modal
        open={pending !== null}
        onClose={() => !busy && setPending(null)}
        title={pending?.kind === 'import' ? 'Import this backup?' : pending?.kind === 'restore' ? 'Restore snapshot?' : 'Clear all data?'}
      >
        {pending?.kind === 'import' && (
          <div className="space-y-3 text-sm">
            <p className="text-muted">
              <span className="font-medium text-ink">{pending.filename}</span> is valid
              {pending.data.exportedAt ? ` (exported ${formatDate(Date.parse(pending.data.exportedAt), true)})` : ''}. It contains:
            </p>
            <ul className="space-y-1.5 rounded-2xl bg-surface2/60 p-3.5">
              {Object.entries(LABELS).map(([k, label]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-muted">{label}</span>
                  <span className="font-semibold">{pending.data.counts[k] ?? 0}</span>
                </li>
              ))}
            </ul>
            {pending.data.skipped > 0 && <p className="text-xs text-accent">{pending.data.skipped} invalid records will be skipped.</p>}
            <p className="text-muted">This replaces your current data. A safety snapshot of your current data is saved first.</p>
          </div>
        )}
        {pending?.kind === 'restore' && <p className="text-sm text-muted">Restore &ldquo;{pending.label}&rdquo;? Your current data will be replaced (a new snapshot is saved first).</p>}
        {pending?.kind === 'clear' && (
          <p className="text-sm leading-relaxed text-muted">
            This erases your timer, history, achievements and all other records from this device. A safety snapshot is saved first, and you can export a backup before continuing.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
            Cancel
          </Button>
          <Button variant={pending?.kind === 'clear' ? 'danger' : 'primary'} onClick={confirm} disabled={busy}>
            {pending?.kind === 'clear' ? 'Clear data' : pending?.kind === 'restore' ? 'Restore' : 'Import'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
