import { PiggyBank, Pencil } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useApp } from '@/context/AppContext';
import { useNow } from '@/hooks/useNow';
import { computeStats } from '@/utils/progress';
import { formatMoney } from '@/utils/format';
import { MS_DAY } from '@/data/constants';

export function MoneySavedCard({ onEdit }: { onEdit: () => void }) {
  const { profile, startedAt, attempts } = useApp();
  const now = useNow(30_000);
  const stats = computeStats(startedAt, attempts, now);
  const days = stats.totalCleanMs / MS_DAY;
  const saved = days * profile.dailyCost;
  const has = profile.dailyCost > 0;

  return (
    <Card className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <PiggyBank className="h-4 w-4 text-success" /> Money saved
        </div>
        <button onClick={onEdit} aria-label="Edit savings settings" className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-surface2 hover:text-ink">
          <Pencil className="h-4 w-4" />
        </button>
      </div>
      {has ? (
        <>
          <div className="tabular text-3xl font-extrabold tracking-tight">{formatMoney(saved, profile.currency)}</div>
          <p className="mt-1 text-sm text-muted">
            at {formatMoney(profile.dailyCost, profile.currency)}/day over {Math.floor(days)} clean {Math.floor(days) === 1 ? 'day' : 'days'}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-surface2/60 px-3 py-2">
              <div className="text-xs text-muted">Weekly</div>
              <div className="font-semibold">{formatMoney(profile.dailyCost * 7, profile.currency)}</div>
            </div>
            <div className="rounded-xl bg-surface2/60 px-3 py-2">
              <div className="text-xs text-muted">Yearly</div>
              <div className="font-semibold">{formatMoney(profile.dailyCost * 365, profile.currency)}</div>
            </div>
          </div>
        </>
      ) : (
        <div>
          <p className="text-sm leading-relaxed text-muted">Add what you used to spend each day and watch your savings grow in real time.</p>
          <Button size="sm" variant="secondary" className="mt-4" onClick={onEdit}>
            Set daily spending
          </Button>
        </div>
      )}
    </Card>
  );
}
