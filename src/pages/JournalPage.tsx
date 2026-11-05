import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, Plus, Search, Trash2 } from 'lucide-react';
import { db, type GenericRow } from '@/database/db';
import { Card, PageHeader, EmptyState } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { sanitizeMultiline, sanitizeText } from '@/utils/sanitize';

import { tr } from '@/i18n';
const MOODS = ['Calm', 'Okay', 'Anxious', 'Stressed', 'Sad', 'Angry'] as const;
type Entry = GenericRow & { id: number; createdAt: number; updatedAt?: number; mood: string; intensity: number; trigger: string; notes: string; helped: string };

export default function JournalPage() {
  const toast = useToast();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [search, setSearch] = useState('');
  const [mood, setMood] = useState<string>('Okay');
  const [intensity, setIntensity] = useState(3);
  const [trigger, setTrigger] = useState('');
  const [notes, setNotes] = useState('');
  const [helped, setHelped] = useState('');
  const [editing, setEditing] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setEntries((await db.journal.orderBy('createdAt').reverse().toArray()) as Entry[]);
    } catch (err) {
      toast.error(tr("Could not load your journal"), (err as Error).message);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => [e.mood, e.trigger, e.notes, e.helped].join(' ').toLowerCase().includes(q));
  }, [entries, search]);

  const clearForm = () => {
    setTrigger('');
    setNotes('');
    setHelped('');
    setMood('Okay');
    setIntensity(3);
    setEditing(null);
  };

  const canSave = !!(trigger.trim() || notes.trim());

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const fields = {
        mood,
        intensity,
        trigger: sanitizeText(trigger, 160),
        notes: sanitizeMultiline(notes, 2000),
        helped: sanitizeMultiline(helped, 1000),
      };
      if (editing !== null) {
        // Keep the original date; only record that it was edited.
        await db.journal.update(editing, { ...fields, updatedAt: Date.now() });
        toast.success(tr("Entry updated"));
      } else {
        await db.journal.add({ ...fields, createdAt: Date.now() });
        toast.success(tr("Entry saved"), tr("Stored privately on this device."));
      }
      clearForm();
      await refresh();
    } catch (err) {
      toast.error(tr("Could not save the entry"), (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (e: Entry) => {
    setEditing(e.id);
    setMood(e.mood);
    setIntensity(e.intensity);
    setTrigger(e.trigger);
    setNotes(e.notes);
    setHelped(e.helped);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (id: number) => {
    if (!window.confirm(tr("Delete this journal entry? This cannot be undone."))) return;
    try {
      await db.journal.delete(id);
      if (editing === id) clearForm();
      await refresh();
    } catch (err) {
      toast.error(tr("Could not delete the entry"), (err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title={tr("Urge Journal")} subtitle={tr("A private space to understand your patterns. Entries stay on this device.")} />
      <Card>
        <h2 className="mb-4 font-semibold">{editing === null ? tr("New journal entry") : tr("Edit journal entry")}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            {tr("Mood")}
            <select className="field mt-1 w-full" value={mood} onChange={(e) => setMood(e.target.value)}>
              {MOODS.map((m) => (
                <option key={m} value={m}>{tr(m)}</option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            {tr("Craving intensity:")} {intensity}/5
            <input className="mt-3 w-full accent-[var(--accent)]" type="range" min="1" max="5" value={intensity} onChange={(e) => setIntensity(Number(e.target.value))} />
          </label>
        </div>
        <label className="mt-3 block text-sm">
          {tr("Trigger / situation")}
          <input className="field mt-1 w-full" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder={tr("What was happening?")} maxLength={160} />
        </label>
        <label className="mt-3 block text-sm">
          {tr("Notes")}
          <textarea className="field mt-1 min-h-24 w-full" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("What were you thinking or feeling?")} maxLength={2000} />
        </label>
        <label className="mt-3 block text-sm">
          {tr("What helped?")}
          <textarea className="field mt-1 min-h-20 w-full" value={helped} onChange={(e) => setHelped(e.target.value)} placeholder={tr("A walk, calling a friend, breathing...")} maxLength={1000} />
        </label>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => void save()} disabled={!canSave || saving}>
            <Plus className="mr-1 h-4 w-4" />
            {editing === null ? tr("Save entry") : tr("Update entry")}
          </Button>
          {editing !== null && (
            <Button variant="secondary" onClick={clearForm}>
              {tr("Cancel")}
            </Button>
          )}
        </div>
      </Card>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted" />
        <input className="field w-full pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={tr("Search your entries")} aria-label={tr("Search your entries")} />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<BookOpen />}
            title={entries.length === 0 ? tr("No entries yet") : tr("No matching entries")}
            text={entries.length === 0 ? tr("Your journal is private. Add an entry when you notice a craving or want to reflect.") : tr("Try a different search word.")}
          />
        </Card>
      ) : (
        filtered.map((e) => (
          <Card key={e.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {tr(e.mood)} · {tr('Intensity')} {e.intensity}/5
                </div>
                <p className="text-xs text-muted">
                  {new Date(e.createdAt).toLocaleString()}
                  {e.updatedAt ? ` · ${tr('edited')}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="min-h-10 rounded-xl bg-surface2 px-3 py-2 text-xs" onClick={() => edit(e)}>
                  {tr("Edit")}
                </button>
                <button aria-label={tr("Delete entry")} className="flex h-10 w-10 items-center justify-center rounded-xl bg-danger/10 text-danger" onClick={() => void remove(e.id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {e.trigger && (
              <p className="mt-3 text-sm">
                <b>{tr("Trigger:")}</b> {e.trigger}
              </p>
            )}
            {e.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{e.notes}</p>}
            {e.helped && (
              <p className="mt-2 whitespace-pre-wrap text-sm">
                <b>{tr("What helped:")}</b> {e.helped}
              </p>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
