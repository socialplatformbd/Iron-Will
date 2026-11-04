import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { HabitTree } from '@/components/HabitTree';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { computeStats } from '@/utils/progress';
import { getTreeGrowth } from '@/utils/tree';
import { MS_DAY } from '@/data/constants';

export function TreePreviewCard() {
  const { startedAt, attempts } = useApp();
  const now = useNow(60_000);
  const totalDays = computeStats(startedAt, attempts, now).totalCleanMs / MS_DAY;
  const g = getTreeGrowth(totalDays);
  return (
    <Link to="/tree" className="block h-full">
      <Card className="h-full transition hover:border-accent/40">
        <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          Habit Tree <ChevronRight className="h-4 w-4" />
        </div>
        <div className="flex items-center gap-4">
          <HabitTree stage={g.stage.index} className="h-28 w-28 shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-bold leading-tight">{g.stage.name}</div>
            <div className="mt-0.5 text-sm text-muted">{g.percent}% grown</div>
            <div className="mt-3 h-2 w-full min-w-[96px] overflow-hidden rounded-full bg-surface2">
              <div className="h-full rounded-full bg-gradient-accent transition-all duration-700" style={{ width: `${g.percent}%` }} />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
