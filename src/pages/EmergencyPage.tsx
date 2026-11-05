import { useEffect, useRef, useState } from 'react';
import { HeartHandshake, Play, RotateCcw, ShieldCheck } from 'lucide-react';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BackLink } from '@/components/ui/BackLink';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import { db } from '@/database/db';
import { sanitizeMultiline } from '@/utils/sanitize';

const TOTAL_SECONDS = 300;
const CYCLE_SECONDS = 14; // 4 in + 4 hold + 6 out
const STEPS = [
  { label: 'Breathe in', seconds: 4 },
  { label: 'Hold', seconds: 4 },
  { label: 'Breathe out', seconds: 6 },
];
const REMINDERS = [
  'A craving is a feeling, not an instruction. Let it pass.',
  'Change your environment. Stand up, get some water, and take a short walk.',
  'You only need to choose what helps you for the next five minutes.',
  'Slow your breathing. Notice five things you can see around you.',
];

/** Whole seconds elapsed, derived from an absolute deadline (survives backgrounding). */
function elapsedFromDeadline(deadline: number | null): number {
  if (deadline == null) return 0;
  const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
  return Math.min(TOTAL_SECONDS, TOTAL_SECONDS - remaining);
}

export default function EmergencyPage() {
  const toast = useToast();
  const { profile } = useApp();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const deadlineRef = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      const next = elapsedFromDeadline(deadlineRef.current);
      setElapsed(next);
      if (next >= TOTAL_SECONDS) {
        setRunning(false);
        deadlineRef.current = null;
        try {
          navigator.vibrate?.([200, 100, 200]);
        } catch {
          /* vibration is optional */
        }
      }
    };
    update();
    const id = window.setInterval(update, 250);
    const onVisible = () => {
      if (document.visibilityState === 'visible') update();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [running]);

  const complete = elapsed >= TOTAL_SECONDS;
  const inCycle = elapsed % CYCLE_SECONDS;
  const phaseIndex = inCycle < 4 ? 0 : inCycle < 8 ? 1 : 2;
  const phase = STEPS[phaseIndex];
  const phaseRemaining = phaseIndex === 0 ? 4 - inCycle : phaseIndex === 1 ? 8 - inCycle : CYCLE_SECONDS - inCycle;
  const totalRemaining = Math.max(0, TOTAL_SECONDS - elapsed);

  const startOrPause = () => {
    if (running) {
      setElapsed(elapsedFromDeadline(deadlineRef.current));
      deadlineRef.current = null;
      setRunning(false);
    } else if (!complete) {
      deadlineRef.current = Date.now() + (TOTAL_SECONDS - elapsed) * 1000;
      setRunning(true);
    }
  };

  const reset = () => {
    setRunning(false);
    deadlineRef.current = null;
    setElapsed(0);
  };

  const finish = async () => {
    if (saving) return;
    const seconds = running ? elapsedFromDeadline(deadlineRef.current) : elapsed;
    setSaving(true);
    try {
      await db.cravings.add({
        createdAt: Date.now(),
        intensity: 0,
        trigger: 'Emergency Mode',
        note: sanitizeMultiline(reason, 500) || (seconds >= TOTAL_SECONDS ? 'Completed five-minute breathing exercise' : `Used Emergency Mode for ${seconds} seconds`),
        completed: seconds >= TOTAL_SECONDS,
      });
      reset();
      setReason('');
      toast.success('Well done', 'You got through this moment. It has been saved to your history.');
    } catch (err) {
      toast.error('Could not save this record', (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const scale = running ? (phaseIndex === 0 ? 'scale-110' : phaseIndex === 2 ? 'scale-90' : 'scale-100') : '';

  return (
    <div className="space-y-5">
      <BackLink />
      <PageHeader title="Emergency Mode" subtitle="Pause. Breathe. Give the urge time to pass." />
      <Card glow className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <HeartHandshake className="h-7 w-7" />
        </div>
        <h2 className="mt-3 text-xl font-bold">You are in control of your next choice.</h2>
        <p className="mt-2 text-sm text-muted">Try this short breathing exercise. You can stop at any time.</p>
        <div className="mx-auto my-7 flex h-52 w-52 items-center justify-center rounded-full border border-accent/30 bg-accent/5">
          <div className={`flex h-36 w-36 flex-col items-center justify-center rounded-full bg-accent/15 text-accent transition-transform duration-700 ${scale}`}>
            <span className="text-lg font-bold">{running ? phase.label : complete ? 'Complete' : 'Breathe'}</span>
            <span className="text-3xl font-black tabular-nums">
              {complete ? 'Done' : `${Math.floor(totalRemaining / 60)}:${String(totalRemaining % 60).padStart(2, '0')}`}
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-2">
          <Button onClick={startOrPause} disabled={complete}>
            {running ? (
              'Pause'
            ) : (
              <>
                <Play className="mr-1 h-4 w-4" />
                {elapsed > 0 && !complete ? 'Resume breathing' : 'Start breathing'}
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={reset}>
            <RotateCcw className="mr-1 h-4 w-4" />
            Reset
          </Button>
        </div>
        {running && (
          <p className="mt-3 text-xs text-muted">
            {phase.label} · {phaseRemaining}s in this breathing phase
          </p>
        )}
        {complete && <p className="mt-3 text-sm font-semibold text-success">You completed five minutes. Well done.</p>}
      </Card>

      {profile.reasons.length > 0 && (
        <Card glow>
          <h3 className="font-semibold">Why you started</h3>
          <ul className="mt-3 space-y-2">
            {profile.reasons.map((r, i) => (
              <li key={`${r}-${i}`} className="rounded-2xl bg-surface2/60 px-4 py-3 text-[15px] font-medium leading-snug">
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold">A reminder for this moment</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{REMINDERS[Math.floor(elapsed / 30) % REMINDERS.length]}</p>
        <label className="mt-4 block text-sm">
          What do you need right now?
          <textarea className="field mt-1 min-h-20 w-full" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} placeholder="Write a quick note (optional)" />
        </label>
        <Button className="mt-3" full onClick={() => void finish()} disabled={saving}>
          <ShieldCheck className="mr-2 h-4 w-4" />I got through this moment
        </Button>
      </Card>

      <p className="px-1 text-xs leading-relaxed text-muted">
        If you feel unsafe or in crisis, contact your local emergency number or someone you trust right now. Iron Will is a self-help tool, not medical care.
      </p>
    </div>
  );
}
