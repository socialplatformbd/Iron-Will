import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, Clock, ShieldCheck, TrendingUp } from 'lucide-react';
import { db, type GenericRow } from '@/database/db';
import { Card, PageHeader } from '@/components/ui/Card';
import { MS_DAY } from '@/data/constants';

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
    ])
      .then(([j, f, c]) => {
        if (cancelled) return;
        setJournal(j as Row[]);
        setFocus(f as Row[]);
        setCravings(c as Row[]);
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
      return { label: DAY_LABELS[new Date(start).getDay()], count };
    });

    // When difficult moments tend to happen (last 30 days, journal + emergency records).
    const periodCounts = PERIODS.map((p) => ({
      ...p,
      count: [...journal, ...cravings].filter((x) => (x.createdAt ?? 0) >= month && p.test(new Date(x.createdAt ?? 0).getHours())).length,
    }));

    const focusMinutes = Math.round(focus.filter((x) => x.completed).reduce((a, x) => a + Number(x.durationSeconds || 0), 0) / 60);
    const completedEmergency = cravings.filter((x) => x.completed).length;
    return { recent, avg, topTriggers, days, periodCounts, focusMinutes, completedEmergency };
  }, [journal, focus, cravings]);

  const maxDay = Math.max(1, ...stats.days.map((d) => d.count));
  const maxTrigger = Math.max(1, ...stats.topTriggers.map((x) => x[1]));
  const maxPeriod = Math.max(1, ...stats.periodCounts.map((p) => p.count));
  const hasPeriodData = stats.periodCounts.some((p) => p.count > 0);
  const riskiest = hasPeriodData ? [...stats.periodCounts].sort((a, b) => b.count - a.count)[0] : null;

  return (
    <div className="space-y-5">
      <PageHeader title="History & Insights" subtitle="A private summary calculated from records stored on this device." />
      {failed && <Card className="text-sm text-danger">Could not read your records from this device. Please reload the app.</Card>}

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <BookOpen className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{journal.length}</div>
          <div className="text-xs text-muted">Journal entries</div>
        </Card>
        <Card>
          <TrendingUp className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{stats.avg.toFixed(1)}/5</div>
          <div className="text-xs text-muted">Avg. urge intensity (7d)</div>
        </Card>
        <Card>
          <BarChart3 className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{focus.filter((x) => x.completed).length}</div>
          <div className="text-xs text-muted">Focus sessions · {stats.focusMinutes} min</div>
        </Card>
        <Card>
          <ShieldCheck className="h-5 w-5 text-accent" />
          <div className="mt-3 text-2xl font-bold">{cravings.length}</div>
          <div className="text-xs text-muted">Emergency uses · {stats.completedEmergency} completed</div>
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold">Last 7 days</h2>
        <p className="mt-1 text-xs text-muted">Journal entries and Emergency Mode uses per day.</p>
        <div className="mt-4 flex h-32 items-end gap-2" role="img" aria-label="Activity over the last seven days">
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
          When moments get hard · last 30 days
        </h2>
        {hasPeriodData ? (
          <>
            <p className="mt-1 text-sm text-muted">
              Most records fall in the <b className="text-ink">{riskiest?.name.toLowerCase()}</b> ({riskiest?.hint}). Plan a replacement activity for that time.
            </p>
            <div className="mt-4 space-y-3">
              {stats.periodCounts.map((p) => (
                <div key={p.name}>
                  <div className="mb-1 flex justify-between gap-3 text-sm">
                    <span>
                      {p.name} <span className="text-xs text-muted">{p.hint}</span>
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
          <p className="mt-2 text-sm text-muted">{loaded ? 'Add journal entries or use Emergency Mode to see which times of day are hardest.' : 'Loading…'}</p>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold">Common triggers · last 7 days</h2>
        {stats.topTriggers.length ? (
          <div className="mt-4 space-y-3">
            {stats.topTriggers.map(([name, count]) => (
              <div key={name}>
                <div className="mb-1 flex justify-between gap-3 text-sm">
                  <span className="truncate">{name}</span>
                  <b>{count}</b>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface2">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${(count / maxTrigger) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">Add journal entries with triggers to see patterns here.</p>
        )}
        <p className="mt-4 text-xs text-muted">These are descriptive patterns, not predictions or medical assessments.</p>
      </Card>

      <Card>
        <h2 className="font-semibold">Recent journal activity</h2>
        {stats.recent.length ? (
          <div className="mt-3 divide-y divide-line">
            {stats.recent.slice(0, 6).map((x, i) => (
              <div key={x.id ?? i} className="flex justify-between gap-3 py-3 text-sm">
                <span className="min-w-0 truncate">{x.trigger || x.mood || 'Journal entry'}</span>
                <span className="shrink-0 text-muted">{new Date(x.createdAt ?? 0).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">No entries in the last seven days.</p>
        )}
      </Card>
    </div>
  );
}
