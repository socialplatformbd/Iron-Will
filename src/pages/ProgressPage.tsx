import { useState, type FormEvent } from 'react';
import { CalendarClock, CheckCircle2, Circle, History, Lock, Play, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react';
import { Card, EmptyState, PageHeader, SectionTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { TimerRing } from '@/components/TimerRing';
import { LiveTimer } from '@/components/LiveTimer';
import { MilestoneSummary } from '@/components/MilestoneSummary';
import { StartTimerModal } from '@/components/StartTimerModal';
import { ResetModal } from '@/components/ResetModal';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { useToast } from '@/components/ui/Toast';
import { computeStats } from '@/utils/progress';
import { formatDate, formatDurationLong, formatDurationShort } from '@/utils/time';
import { MS_DAY } from '@/data/constants';
import { cn } from '@/utils/cn';

import { tr, trn } from '@/i18n';
export default function ProgressPage() {
  const { startedAt, milestones, attempts, achievements, addMilestone, removeMilestone } = useApp();
  const toast = useToast();
  const now = useNow(1000);
  const [modal, setModal] = useState<null | 'start' | 'edit' | 'reset'>(null);
  const [days, setDays] = useState('');
  const [title, setTitle] = useState('');
  const stats = computeStats(startedAt, attempts, now);
  const earned = new Set(achievements.map((a) => a.id));

  const submitMilestone = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addMilestone(parseInt(days, 10), title);
      toast.success(tr("Custom milestone added"));
      setDays('');
      setTitle('');
    } catch {
      /* the error toast is already shown by the app context */
    }
  };

  const shareProgress = async () => {
    const dayCount = Math.floor(stats.currentMs / MS_DAY);
    const text = trn(dayCount, 'I am {n} day strong with Iron Will. Build Discipline. Become Unbreakable.', 'I am {n} days strong with Iron Will. Build Discipline. Become Unbreakable.');
    try {
      if (navigator.share) {
        await navigator.share({ text, title: 'Iron Will' });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(tr("Progress copied"), tr("Only your day count is shared, nothing else."));
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') toast.error(tr("Could not share"), tr("Your browser blocked sharing."));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title={tr("Progress")} subtitle={tr("Your live timer, milestones and attempt history.")} />

      {startedAt == null ? (
        <Card className="px-6 py-4">
          <EmptyState
            icon={<Play className="h-7 w-7" />}
            title={tr("Timer not started")}
            text={tr("Start the timer now, or choose a past date and time if you already began.")}
            action={
              <Button variant="primary" icon={<Play className="h-4 w-4" />} onClick={() => setModal('start')}>
                {tr("Start timer")}
              </Button>
            }
          />
        </Card>
      ) : (
        <Card glow className="px-4 py-6 sm:px-8">
          <div className="grid items-center gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
            <div className="flex justify-center">
              <TimerRing startedAt={startedAt} milestones={milestones} />
            </div>
            <div className="space-y-4">
              <LiveTimer startedAt={startedAt} />
              <MilestoneSummary startedAt={startedAt} milestones={milestones} />
              <div className="rounded-2xl border border-line bg-surface2/50 px-4 py-3 text-sm">
                <span className="text-muted">{tr("Started")} </span>
                <span className="font-semibold">{formatDate(startedAt, true)}</span>
              </div>
              <Button variant="outline" full icon={<Share2 className="h-4 w-4" />} onClick={() => void shareProgress()}>
                {tr("Share my progress")}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" icon={<CalendarClock className="h-4 w-4" />} onClick={() => setModal('edit')}>
                  {tr("Edit start")}
                </Button>
                <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setModal('reset')}>
                  {tr("Reset")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <section>
        <SectionTitle title={tr("Statistics")} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Current streak', value: formatDurationShort(stats.currentMs) },
            { label: 'Longest streak', value: formatDurationShort(stats.longestMs) },
            { label: 'Total clean days', value: String(Math.floor(stats.totalCleanMs / MS_DAY)) },
            { label: 'Previous attempts', value: String(stats.previousAttempts) },
          ].map((s) => (
            <Card key={s.label} className="!p-4">
              <div className="tabular text-xl font-extrabold">{s.value}</div>
              <div className="mt-1 text-xs text-muted">{tr(s.label)}</div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle title={tr("Milestones")} />
        <Card padded={false}>
          <ul className="divide-y divide-line">
            {milestones.map((m) => {
              const done = earned.has(m.id) || (startedAt != null && now - startedAt >= m.days * MS_DAY);
              const frac = startedAt != null ? Math.min(1, (now - startedAt) / (m.days * MS_DAY)) : 0;
              return (
                <li key={m.id} className="flex items-center gap-3.5 px-5 py-3.5">
                  {done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-success" /> : <Circle className="h-6 w-6 shrink-0 text-muted/50" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('truncate font-semibold', !done && 'text-ink/90')}>{tr(m.title)}</span>
                      {m.custom && <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[10px] font-semibold text-accent">{tr("Custom")}</span>}
                    </div>
                    <div className="text-xs text-muted">
                      {m.days} {m.days === 1 ? tr("day") : tr("days")}
                      {!done && startedAt != null && ` · ${Math.floor(frac * 100)}%`}
                    </div>
                    {!done && startedAt != null && (
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface2">
                        <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${frac * 100}%` }} />
                      </div>
                    )}
                  </div>
                  {m.custom && (
                    <button aria-label={tr('Remove {title}', { title: tr(m.title) })} onClick={() => void removeMilestone(m.id).catch(() => undefined)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  {!m.custom && !done && <Lock className="h-4 w-4 shrink-0 text-muted/40" />}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card className="mt-3">
          <form onSubmit={submitMilestone} className="space-y-3">
            <h3 className="text-sm font-semibold">{tr("Add a custom milestone")}</h3>
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-2">
                <Field label={tr("Days")}>
                  <TextInput inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="45" required />
                </Field>
              </div>
              <div className="col-span-3">
                <Field label={tr("Title")}>
                  <TextInput value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} placeholder={tr("My big goal")} />
                </Field>
              </div>
            </div>
            <Button type="submit" variant="secondary" icon={<Plus className="h-4 w-4" />}>
              {tr("Add milestone")}
            </Button>
          </form>
        </Card>
      </section>

      <section>
        <SectionTitle title={tr("Attempt history")} />
        <Card padded={false}>
          {attempts.length === 0 && startedAt == null ? (
            <EmptyState icon={<History className="h-7 w-7" />} title={tr("No attempts yet")} text={tr("When you reset, the finished attempt is saved here. Nothing is ever lost.")} />
          ) : (
            <ul className="divide-y divide-line">
              {startedAt != null && (
                <li className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div>
                    <div className="font-semibold">{tr("Current attempt")}</div>
                    <div className="text-xs text-muted">{tr("Since")} {formatDate(startedAt, true)}</div>
                  </div>
                  <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">{formatDurationLong(now - startedAt)}</span>
                </li>
              )}
              {attempts.map((a) => (
                <li key={a.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-semibold">{tr('Attempt #{n}', { n: a.id ?? 0 })}{a.habitName ? ` · ${a.habitName}` : ''}</div>
                      <div className="text-xs text-muted">
                        {formatDate(a.startedAt)} → {formatDate(a.endedAt)}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface2 px-3 py-1 text-xs font-semibold">{formatDurationShort(a.durationMs)}</span>
                  </div>
                  {a.note && <p className="mt-2 rounded-xl bg-surface2/60 px-3 py-2 text-sm text-muted">{a.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <StartTimerModal open={modal === 'start' || modal === 'edit'} onClose={() => setModal(null)} mode={modal === 'edit' ? 'edit' : 'start'} />
      <ResetModal open={modal === 'reset'} onClose={() => setModal(null)} />
    </div>
  );
}
