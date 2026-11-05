import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Lock, Mail, MailOpen, Plus, Trash2 } from 'lucide-react';
import { Card, EmptyState, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { addLetter, deleteLetter, isLetterUnlocked, listLetters } from '@/services/letterService';
import { MS_DAY } from '@/data/constants';
import { formatDate } from '@/utils/time';
import { cn } from '@/utils/cn';
import type { Letter } from '@/types';

export default function LettersPage() {
  const { startedAt, achievements, milestones } = useApp();
  const toast = useToast();
  const now = useNow(60_000);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [unlockDays, setUnlockDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLetters(await listLetters());
    } catch (err) {
      toast.error('Could not load your letters', (err as Error).message);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const currentDays = startedAt != null ? Math.max(0, Math.floor((now - startedAt) / MS_DAY)) : 0;
  const bestEarned = achievements.reduce((m, a) => Math.max(m, a.days), 0);
  const options = [0, ...milestones.map((m) => m.days)];

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await addLetter({ title, body, unlockDays });
      setTitle('');
      setBody('');
      toast.success('Letter sealed', unlockDays === 0 ? 'You can open it any time.' : `It will open at day ${unlockDays}.`);
      await refresh();
    } catch (err) {
      toast.error('Could not save the letter', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm('Delete this letter? This cannot be undone.')) return;
    try {
      await deleteLetter(id);
      if (openId === id) setOpenId(null);
      await refresh();
    } catch (err) {
      toast.error('Could not delete the letter', (err as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Letters to Myself" subtitle="Write to your future self. A letter opens when you reach the day you choose." />

      <Card>
        <h2 className="mb-4 font-semibold">Write a new letter</h2>
        <label className="block text-sm">
          Title
          <input className="field mt-1 w-full" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="A letter to myself" />
        </label>
        <label className="mt-3 block text-sm">
          Your message
          <textarea className="field mt-1 min-h-32 w-full" value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} placeholder="Remind yourself why you started, what it cost you, and what you are proud of..." />
        </label>
        <label className="mt-3 block text-sm">
          Opens on
          <select className="field mt-1 w-full" value={unlockDays} onChange={(e) => setUnlockDays(Number(e.target.value))}>
            {options.map((d) => (
              <option key={d} value={d}>
                {d === 0 ? 'Any time (a note for hard moments)' : `Day ${d}`}
              </option>
            ))}
          </select>
        </label>
        <Button className="mt-4" onClick={() => void save()} disabled={!body.trim() || saving}>
          <Plus className="mr-1 h-4 w-4" />
          Seal letter
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-muted">Letters stay on this device and are included in your JSON backup. Sealing is a promise to yourself; you can still delete a letter.</p>
      </Card>

      {letters.length === 0 ? (
        <Card>
          <EmptyState icon={<Mail />} title="No letters yet" text="Write one now. Reading it on a milestone day, in your own words, can be a powerful moment." />
        </Card>
      ) : (
        letters.map((l) => {
          const id = l.id as number;
          const unlocked = isLetterUnlocked(l.unlockDays, currentDays, bestEarned);
          const open = unlocked && openId === id;
          const remaining = Math.max(0, l.unlockDays - currentDays);
          return (
            <Card key={id} className={cn(!unlocked && 'opacity-90')}>
              <div className="flex items-start gap-3">
                <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', unlocked ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted')}>
                  {unlocked ? <MailOpen className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{l.title}</div>
                  <div className="text-xs text-muted">Written {formatDate(l.createdAt)}</div>
                  <div className="mt-1 text-xs text-muted">
                    {unlocked
                      ? l.unlockDays === 0
                        ? 'Open any time'
                        : `Opened at day ${l.unlockDays}`
                      : startedAt == null
                        ? `Opens at day ${l.unlockDays}. Start your timer to begin.`
                        : `Opens at day ${l.unlockDays} · ${remaining} ${remaining === 1 ? 'day' : 'days'} to go`}
                  </div>
                </div>
                <button aria-label="Delete letter" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-surface2 hover:text-danger" onClick={() => void remove(id)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              {unlocked && (
                <>
                  <button className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-accent" onClick={() => setOpenId(open ? null : id)} aria-expanded={open}>
                    {open ? 'Hide letter' : 'Read letter'}
                    <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
                  </button>
                  {open && <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-surface2/60 p-4 text-sm leading-relaxed">{l.body}</p>}
                </>
              )}
            </Card>
          );
        })
      )}
    </div>
  );
}
