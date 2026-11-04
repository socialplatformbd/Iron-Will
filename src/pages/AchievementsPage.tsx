import { Award, Lock, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, PageHeader, SectionTitle } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { getMilestoneProgress } from '@/utils/progress';
import { formatDate, formatDurationLong } from '@/utils/time';
import { cn } from '@/utils/cn';

export default function AchievementsPage() {
  const { achievements, milestones, startedAt } = useApp();
  const now = useNow(1000);
  const earned = new Map(achievements.map((a) => [a.id, a]));
  const prog = startedAt != null ? getMilestoneProgress(now - startedAt, milestones) : null;
  const total = milestones.length;
  const count = milestones.filter((m) => earned.has(m.id)).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" subtitle="Badges you earn are yours forever, even after a reset." />

      <Card glow>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-accent text-onaccent">
            <Star className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-3xl font-extrabold leading-none">
              {count}
              <span className="text-lg font-semibold text-muted"> / {total}</span>
            </div>
            <div className="mt-1 text-sm text-muted">badges collected</div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface2">
              <motion.div className="h-full rounded-full bg-gradient-accent" initial={{ width: 0 }} animate={{ width: `${total ? (count / total) * 100 : 0}%` }} transition={{ duration: 0.9 }} />
            </div>
          </div>
        </div>
        {prog?.next && (
          <p className="mt-4 rounded-2xl bg-surface2/60 px-4 py-3 text-sm">
            Next: <span className="font-semibold">{prog.next.title}</span> in <span className="font-semibold">{formatDurationLong(prog.remainingMs)}</span>
          </p>
        )}
        {startedAt == null && <p className="mt-4 text-sm text-muted">Start your timer to begin earning badges.</p>}
      </Card>

      <section>
        <SectionTitle title="Badge collection" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {milestones.map((m, i) => {
            const a = earned.get(m.id);
            const isNext = prog?.next?.id === m.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className={cn(
                  'relative flex flex-col items-center rounded-3xl border p-4 text-center',
                  a ? 'border-accent/40 bg-surface shadow-[0_0_40px_-18px_var(--accent)]' : 'border-line bg-surface/60',
                  isNext && 'ring-1 ring-accent/50'
                )}
              >
                <div className={cn('mb-3 flex h-16 w-16 items-center justify-center rounded-full', a ? 'bg-gradient-accent text-onaccent' : 'bg-surface2 text-muted/60')}>
                  {a ? <Award className="h-8 w-8" /> : <Lock className="h-6 w-6" />}
                </div>
                <div className={cn('text-[15px] font-bold', !a && 'text-muted')}>{m.title}</div>
                <div className="mt-0.5 text-xs text-muted">
                  {m.days} {m.days === 1 ? 'day' : 'days'}
                </div>
                <div className="mt-2 text-[11px] leading-snug text-muted">{a ? `Earned ${formatDate(a.unlockedAt)}` : isNext ? 'Up next' : 'Locked'}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle title="Achievement history" />
        <Card padded={false}>
          {achievements.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Nothing unlocked yet. Your first badge is just one day away.</p>
          ) : (
            <ul className="divide-y divide-line">
              {achievements.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <Award className="h-5 w-5 shrink-0 text-accent" />
                    <span className="truncate font-semibold">{a.title}</span>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{formatDate(a.unlockedAt, true)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}
