import { memo } from 'react';
import { useNow } from '@/hooks/useNow';
import { pad2, splitDuration } from '@/utils/time';
import { cn } from '@/utils/cn';
import { tr } from '@/i18n';

/** Live d/h/m/s tiles computed from the real start timestamp every second. */
function LiveTimerBase({ startedAt, className }: { startedAt: number; className?: string }) {
  const now = useNow(1000);
  const { days, hours, minutes, seconds } = splitDuration(now - startedAt);
  const items = [
    { label: 'Days', value: String(days) },
    { label: 'Hours', value: pad2(hours) },
    { label: 'Minutes', value: pad2(minutes) },
    { label: 'Seconds', value: pad2(seconds) },
  ];
  return (
    <div className={cn('grid grid-cols-4 gap-2 sm:gap-3', className)} role="timer" aria-label={tr("Time since you started")}>
      {items.map((it) => (
        <div key={it.label} className="rounded-2xl border border-line bg-surface2/60 px-1 py-3 text-center">
          <div className="tabular text-xl font-bold leading-none sm:text-2xl">{it.value}</div>
          <div className="mt-1.5 text-[10px] font-medium uppercase tracking-wider text-muted sm:text-[11px]">{tr(it.label)}</div>
        </div>
      ))}
    </div>
  );
}

export const LiveTimer = memo(LiveTimerBase);
