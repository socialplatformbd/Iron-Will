import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, CalendarDays, Clock, Share2, ShieldCheck, TrendingUp } from 'lucide-react';
import { db, type GenericRow } from '@/database/db';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import { dayKey } from '@/services/checkinService';
import { MS_DAY } from '@/data/constants';
import { tr } from '@/i18n';
import { formatMoney } from '@/utils/format';

type Row = GenericRow & { createdAt?: number; startedAt?: number; intensity?: number; trigger?: string; mood?: string; durationSeconds?: number; completed?: boolean };

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PERIODS = [
  { name: 'Morning', hint: '5am – 12pm', test: (h: number) => h >= 5 && h < 12 },
  { name: 'Afternoon', hint: '12pm – 5pm', test: (h: number) => h >= 12 && h < 17 },
  { name: 'Evening', hint: '5pm – 9pm', test: (h: number) => h >= 17 && h < 21 },
  { name: 'Night', hint: '9pm – 5am', test: (h: number) => h >= 21 || h < 5 },
];

function startOfDay(ts: number): number {
  const d = new Date(ts);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export default function HistoryPage() {
  const toast = useToast();
  const { profile, startedAt } = useApp();
  const [checkinDays, setCheckinDays] = useState<string[]>([]);
  const [journal, setJournal] = useState<Row[]>([]);
  const [focus, setFocus] = useState<Row[]>([]);
  const [cravings, setCravings] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      db.journal.orderBy('createdAt').reverse().toArray(),
      db.focusSessions.orderBy('startedAt').reverse().toArray(),
      db.cravings.orderBy('createdAt').reverse().toArray(),
      db.checkins.toArray(),
    ])
      .then(([j, f, c, ci]) => {
        if (cancelled) return;
        setJournal(j as Row[]);
        setFocus(f as Row[]);
        setCravings(c as Row[]);
        setCheckinDays(ci.map((x) => x.day));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
          setLoaded(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const week = now - 7 * MS_DAY;
    const month = now - 30 * MS_DAY;
    const recent = journal.filter((x) => (x.createdAt ?? 0) >= week);
    const avg = recent.length ? recent.reduce((a, x) => a + Number(x.intensity || 0), 0) / recent.length : 0;

    const triggerCounts: Record<string, number> = {};
    for (const x of recent) {
      const k = String(x.trigger || 'Not specified');
      triggerCounts[k] = (triggerCounts[k] ?? 0) + 1;
    }
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    // Activity (journal entries + emergency uses) for each of the last 7 days.
    const today = startOfDay(now);
    const days = Array.from({ length: 7 }, (_, i) => {
      const start = today - (6 - i) * MS_DAY;
      const count = [...journal, ...cravings].filter((x) => {
        const t = x.createdAt ?? 0;
        return t >= start && t < start + MS_DAY;
      }).length;
      return { label: tr(DAY_LABELS[new Date(start).getDay()]), count };
    });

    // When difficult moments tend to happen (last 30 days, journal + emergency records).
    const periodCounts = PERIODS.map((p) => ({
      ...p,
      count: [...journal, ...cravings].filter((x) => (x.createdAt ?? 0) >= month && p.test(new Date(x.createdAt ?? 0).getHours())).length,
    }));

    const focusMinutes = Math.round(focus.filter((x) => x.completed).reduce((a, x) => a + Number(x.durationSeconds || 0), 0) / 60);
    const completedEmergency = cravings.filter((x) => x.completed).length;
    const weekStartKey = dayKey(now - 6 * MS_DAY);
    const week7 = {
      checkins: checkinDays.filter((d) => d >= weekStartKey).length,
      journal: recent.length,
      emergency: cravings.filter((x) => (x.createdAt ?? 0) >= week).length,
      focusMinutes: Math.round(
        focus.filter((x) => x.completed && (x.startedAt ?? 0) >= week).reduce((a, x) => a + Number(x.durationSeconds || 0), 0) / 60
      ),
      saved: startedAt != null && profile.dailyCost > 0 ? (Math.min(Math.max(0, now - startedAt), 7 * MS_DAY) / MS_DAY) * profile.dailyCost : 0,
    };
    return { recent, avg, topTriggers, days, periodCounts, focusMinutes, completedEmergency, week7 };
  }, [journal, focus, cravings, checkinDays, startedAt, profile.dailyCost]);

  const shareWeek = async () => {
    const w = stats.week7;
    const text = tr('My week with Iron Will: {c} check-ins, {j} journal entries, {e} emergency uses, {m} focus minutes.', {
      c: w.checkins,
      j: w.journal,
      e: w.emergency,
      m: w.focusMinutes,
    });
    try {
      if (navigator.share) {
        await navigator.share({ text, title: 'Iron Will' });
        return;
      }
      await navigator.clipboard.writeText(text);
      toast.success(tr('Weekly summary copied'));
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') toast.error(tr('Could not share'), tr('Your browser blocked sharing.'));
    }
  };

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count));
  const maxTrigger = Math.max(1, ...stats.topTriggers.map((x) => x[1]));
  const maxPeriod = Math.max(1, ...stats.periodCounts.map((p) => p.count));
  const hasPeriodData = stats.periodCounts.some((p) => p.count > 0);
  const riskiest = hasPeriodData ? [...stats.periodCounts].sort((a, b) => b.count - a.count)[0] : null;

  return (
    <div className="space-y-5">
      <PageHeader title={tr("History & Insights")} subtitle={tr("A private summary calculated from records stored on this device.")} />
      {failed && <Card className="text-sm text-danger">{tr("Could not read your records from this device. Please reload the app.")}</Card>}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <BookOpen className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{journal.length}</div>
          <div className="text-xs text-muted">{tr("Journal entries")}</div>
        </Card>
        <Card>
          <TrendingUp className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{stats.avg.toFixed(1)}/5</div>
          <div className="text-xs text-muted">{tr("Avg. urge intensity (7d)")}</div>
        </Card>
        <Card>
          <BarChart3 className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{focus.filter((x) => x.completed).length}</div>
          <div className="text-xs text-muted">{tr('Focus sessions · {n} min', { n: stats.focusMinutes })}</div>
        </Card>
        <Card>
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{cravings.length}</div>
          <div className="text-xs text-muted">{tr('Emergency uses · {n} completed', { n: stats.completedEmergency })}</div>
        </Card>
      </div>

      <Card glow>
        <h2 className="flex items-center gap-2 font-semibold">
          <CalendarDays className="h-4 w-4 text-accent" />
          {tr("Weekly report")}
        </h2>
        <p className="mt-1 text-xs text-muted">{tr("The last 7 days, calculated on this device.")}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-2xl bg-surface2/60 p-3">
            <dd className="text-xl font-bold">{stats.week7.checkins}/7</dd>
            <dt className="text-xs text-muted">{tr("Check-ins")}</dt>
          </div>
          <div className="rounded-2xl bg-surface2/60 p-3">
            <dd className="text-xl font-bold">{stats.week7.journal}</dd>
            <dt className="text-xs text-muted">{tr("Journal entries")}</dt>
          </div>
          <div className="rounded-2xl bg-surface2/60 p-3">
            <dd className="text-xl font-bold">{stats.week7.emergency}</dd>
            <dt className="text-xs text-muted">{tr("Emergency uses")}</dt>
          </div>
          <div className="rounded-2xl bg-surface2/60 p-3">
            <dd className="text-xl font-bold">{stats.week7.focusMinutes}</dd>
            <dt className="text-xs text-muted">{tr("Focus minutes")}</dt>
          </div>
        </dl>
        {stats.week7.saved > 0 && (
          <p className="mt-3 text-sm">
            {tr('Money saved this week: {amount}', { amount: formatMoney(stats.week7.saved, profile.currency) })}
          </p>
        )}
        <Button className="mt-4" variant="outline" full icon={<Share2 className="h-4 w-4" />} onClick={() => void shareWeek()}>
          {tr("Share my week")}
        </Button>
      </Card>

      <Card>
        <h2 className="font-semibold">{tr("Last 7 days")}</h2>
        <p className="mt-1 text-xs text-muted">{tr("Journal entries and Emergency Mode uses per day.")}</p>
        <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label={tr("Activity over the last seven days")}>
          {stats.days.map((d, i) => (
            <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span className="text-[11px] font-semibold tabular-nums text-muted">{d.count || ''}</span>
              <div className="w-full rounded-t-lg bg-accent/80" style={{ height: d.count ? Math.max(8, (d.count / maxDay) * 72) : 3, opacity: d.count ? 1 : 0.25 }} />
              <span className="text-[11px] text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="flex items-center gap-2 font-semibold">
          <Clock className="h-4 w-4 text-accent" />
          {tr("When moments get hard · last 30 days")}
        </h2>
        {hasPeriodData ? (
          <>
            <p className="mt-1 text-sm text-muted">
              {tr('Most records fall in the {period} ({hint}). Plan a replacement activity for that time.', { period: tr(riskiest?.name ?? '').toLowerCase(), hint: tr(riskiest?.hint ?? '') })}
            </p>
            <div className="mt-4 space-y-3">
              {stats.periodCounts.map((p) => (
                <div key={p.name}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span>
                      {tr(p.name)} <span className="text-xs text-muted">{tr(p.hint)}</span>
                    </span>
                    <b>{p.count}</b>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface2">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${(p.count / maxPeriod) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-muted">{loaded ? tr("Add journal entries or use Emergency Mode to see which times of day are hardest.") : tr("Loading…")}</p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">{tr("Common triggers · last 7 days")}</h2>
        {stats.topTriggers.length ? (
          <div className="mt-4 space-y-3">
            {stats.topTriggers.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate">{tr(name)}</span>
                  <b>{count}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(count / maxTrigger) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{tr("Add journal entries with triggers to see patterns here.")}</p>
        )}
        <p className="mt-4 text-xs text-muted">{tr("These are descriptive patterns, not predictions or medical assessments.")}</p>
      </Card>

      <Card>
        <h2 className="font-semibold">{tr("Recent journal activity")}</h2>
        {stats.recent.length ? (
          <div className="mt-3 divide-y divide-line">
            {stats.recent.slice(0, 6).map((x, i) => (
              <div key={x.id ?? i} className="flex justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 truncate">{x.trigger || (x.mood ? tr(x.mood) : tr("Journal entry"))}</span>
                <span className="shrink-0 text-muted">{new Date(x.createdAt ?? 0).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{tr("No entries in the last seven days.")}</p>
        )}
      </Card>
    </div>
  );
}
