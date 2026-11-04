import { memo } from 'react';
import { Flag, Target } from 'lucide-react';
import { useNow } from '@/hooks/useNow';
import { getMilestoneProgress } from '@/utils/progress';
import { formatDurationLong } from '@/utils/time';
import type { Milestone } from '@/types';

function MilestoneSummaryBase({ startedAt, milestones }: { startedAt: number; milestones: Milestone[] }) {
  const now = useNow(1000);
  const p = getMilestoneProgress(now - startedAt, milestones);
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-line bg-surface2/50 p-3.5">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Flag className="h-3.5 w-3.5 text-success" /> Current
        </div>
        <div className="truncate text-[15px] font-bold">{p.reached ? p.reached.title : 'Just begun'}</div>
        <div className="text-xs text-muted">{p.reached ? `${p.reached.days}-day milestone` : 'First goal: 1 day'}</div>
      </div>
      <div className="rounded-2xl border border-line bg-surface2/50 p-3.5">
        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
          <Target className="h-3.5 w-3.5 text-accent" /> Next
        </div>
        <div className="truncate text-[15px] font-bold">{p.next ? p.next.title : 'All complete'}</div>
        <div className="text-xs text-muted">{p.next ? `in ${formatDurationLong(p.remainingMs)}` : 'You are a legend'}</div>
      </div>
    </div>
  );
}

export const MilestoneSummary = memo(MilestoneSummaryBase);
