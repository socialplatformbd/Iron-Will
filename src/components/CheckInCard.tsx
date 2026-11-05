import { useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useNow } from '@/hooks/useNow';
import { checkinStreak, dayKey, listCheckinDays, setCheckin } from '@/services/checkinService';
import { MS_DAY } from '@/data/constants';
import { tr } from '@/i18n';
import { cn } from '@/utils/cn';

const DOTS = 14;

/** One tap per day: "I stayed strong today". Stored on this device only. */
export function CheckInCard() {
  const toast = useToast();
  const now = useNow(60_000);
  const [days, setDays] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setDays(await listCheckinDays());
    } catch {
      /* the card still renders without data */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const today = dayKey(now);
  const done = days.includes(today);
  const streak = checkinStreak(days, now);
  const dots = Array.from({ length: DOTS }, (_, i) => dayKey(now - (DOTS - 1 - i) * MS_DAY));
  const lastWindow = dots.filter((d) => days.includes(d)).length;

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await setCheckin(today, !done);
      await refresh();
      if (!done) toast.success(tr('Checked in'), tr('Another strong day. Keep going.'));
    } catch (err) {
      toast.error(tr('Could not save your check-in'), (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <CalendarCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{tr("Daily check-in")}</h2>
          <p className="text-xs text-muted">
            {streak > 0 ? tr('{n} days in a row', { n: streak }) : tr('Tap once a day to mark that you stayed strong.')}
          </p>
        </div>
      </div>
      <div className="mt-4 flex justify-between gap-1" role="img" aria-label={tr('Check-ins over the last 14 days')}>
        {dots.map((d) => (
          <span key={d} className={cn('h-5 w-5 rounded-full', days.includes(d) ? 'bg-success' : 'bg-surface2', d === today && 'ring-2 ring-accent/60')} />
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">{tr('{n} of the last 14 days', { n: lastWindow })}</p>
      <Button className="mt-4" full variant={done ? 'secondary' : 'primary'} icon={done ? <Check className="h-4 w-4" /> : undefined} onClick={() => void toggle()} disabled={busy}>
        {done ? tr("Checked in today (tap to undo)") : tr("I stayed strong today")}
      </Button>
    </Card>
  );
}
