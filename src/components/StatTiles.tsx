import { memo } from 'react';
import { Flame, Hourglass, Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { computeStats } from '@/utils/progress';
import { MS_DAY } from '@/data/constants';

function StatTilesBase() {
  const { startedAt, attempts } = useApp();
  const now = useNow(5000);
  const s = computeStats(startedAt, attempts, now);
  const tiles = [
    { label: 'Current streak', value: Math.floor(s.currentMs / MS_DAY), icon: Flame, tone: 'text-accent' },
    { label: 'Longest streak', value: Math.floor(s.longestMs / MS_DAY), icon: Trophy, tone: 'text-accent2' },
    { label: 'Total clean days', value: Math.floor(s.totalCleanMs / MS_DAY), icon: Hourglass, tone: 'text-success' },
  ];
  return (
    <div className="grid grid-cols-3 gap-3">
      {tiles.map((t) => {
        const Icon = t.icon;
        return (
          <div key={t.label} className="rounded-3xl border border-line bg-surface p-3.5 sm:p-4">
            <Icon className={`mb-2 h-5 w-5 ${t.tone}`} />
            <div className="tabular text-2xl font-extrabold leading-none">{t.value}</div>
            <div className="mt-1.5 text-[11px] font-medium leading-tight text-muted">{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export const StatTiles = memo(StatTilesBase);
