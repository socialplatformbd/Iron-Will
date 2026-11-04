import { memo } from 'react';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { useNow } from '@/hooks/useNow';
import { getMilestoneProgress } from '@/utils/progress';
import { splitDuration } from '@/utils/time';
import type { Milestone } from '@/types';

interface Props {
  startedAt: number;
  milestones: Milestone[];
  size?: number;
}

/** Circular progress toward the next milestone, driven by the real clock. */
function TimerRingBase({ startedAt, milestones, size = 250 }: Props) {
  const now = useNow(1000);
  const elapsed = now - startedAt;
  const { days } = splitDuration(elapsed);
  const prog = getMilestoneProgress(elapsed, milestones);
  return (
    <ProgressRing value={prog.fraction} size={size} stroke={size > 200 ? 14 : 10}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Streak</div>
      <div className="tabular text-gradient my-0.5 text-6xl font-extrabold leading-none tracking-tight">{days}</div>
      <div className="text-sm font-medium text-ink/80">{days === 1 ? 'day' : 'days'} strong</div>
      <div className="mt-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
        {prog.next ? `${Math.floor(prog.fraction * 100)}% to ${prog.next.title}` : 'All milestones complete'}
      </div>
    </ProgressRing>
  );
}

export const TimerRing = memo(TimerRingBase);
