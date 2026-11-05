import { Check, Lock, ShieldCheck } from 'lucide-react';
import { Card, PageHeader, SectionTitle } from '@/components/ui/Card';
import { HabitTree } from '@/components/HabitTree';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { computeStats } from '@/utils/progress';
import { getTreeGrowth, TREE_STAGES } from '@/utils/tree';
import { MS_DAY } from '@/data/constants';
import { cn } from '@/utils/cn';

import { tr } from '@/i18n';
export default function TreePage() {
  const { startedAt, attempts } = useApp();
  const now = useNow(30_000);
  const totalDays = computeStats(startedAt, attempts, now).totalCleanMs / MS_DAY;
  const g = getTreeGrowth(totalDays);

  return (
    <div className="space-y-6">
      <PageHeader title={tr("Habit Tree")} subtitle={tr("It grows with every clean day you accumulate.")} />
      <Card glow className="text-center">
        <HabitTree key={g.stage.index} stage={g.stage.index} className="mx-auto h-64 w-64 max-w-full sm:h-72 sm:w-72" />
        <h2 className="text-2xl font-extrabold">{tr(g.stage.name)}</h2>
        <p className="mt-1 text-sm text-muted">{tr(g.stage.blurb)}</p>
        <div className="mx-auto mt-5 max-w-sm">
          <div className="mb-1.5 flex justify-between text-xs font-medium text-muted">
            <span>{tr('{p}% grown', { p: g.percent })}</span>
            <span>{g.next ? tr('Next: {name} at {n} days', { name: tr(g.next.name), n: g.next.minDays }) : tr("Fully bloomed")}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-surface2">
            <div className="h-full rounded-full bg-gradient-accent transition-all duration-700" style={{ width: `${g.percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{Math.floor(totalDays)} {tr("total clean days across all attempts")}</p>
        </div>
      </Card>

      <Card className="flex items-start gap-3.5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">{tr("Recovery-based growth.")}</span> {tr("Your tree grows from your total clean days across every attempt. A setback pauses growth, but your tree is never destroyed.")}
        </p>
      </Card>

      <section>
        <SectionTitle title={tr("Growth stages")} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TREE_STAGES.map((s) => {
            const done = totalDays >= s.minDays;
            return (
              <Card key={s.index} className={cn('!p-3.5', g.stage.index === s.index && 'border-accent/50')}>
                <div className="flex items-center gap-3">
                  <HabitTree stage={s.index} className={cn('h-16 w-16 shrink-0', !done && 'opacity-30 grayscale')} />
                  <div className="min-w-0 flex-1">
                    <div className="font-bold">{tr(s.name)}</div>
                    <div className="text-xs text-muted">{s.minDays === 0 ? tr("Start") : `${s.minDays} clean days`}</div>
                  </div>
                  {done ? <Check className="h-5 w-5 text-success" /> : <Lock className="h-4 w-4 text-muted/50" />}
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
