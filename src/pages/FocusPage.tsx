import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Pause, Play, RotateCcw, Timer } from 'lucide-react';
import { db } from '@/database/db';
import { Card, PageHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BackLink } from '@/components/ui/BackLink';
import { useToast } from '@/components/ui/Toast';

const options = [5, 10, 15, 25, 30];

export default function FocusPage() {
  const toast = useToast();
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const deadlineRef = useRef<number | null>(null);
  const remainingRef = useRef(25 * 60);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const update = () => {
      const seconds = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000));
      remainingRef.current = seconds;
      setRemaining(seconds);
      if (seconds === 0 && !completedRef.current) {
        completedRef.current = true;
        setRunning(false);
        setDone(true);
        if (startedAt !== null) {
          db.focusSessions
            .add({ startedAt, endedAt: Date.now(), durationSeconds: minutes * 60, completed: true })
            .catch((err: unknown) => toast.error('Could not save this session', (err as Error).message));
          try {
            navigator.vibrate?.([200, 100, 200]);
          } catch {
            /* vibration is optional */
          }
        }
      }
    };
    update();
    const id = window.setInterval(update, 250);
    return () => window.clearInterval(id);
  }, [running, startedAt, minutes, toast]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && running) {
        const seconds = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000));
        remainingRef.current = seconds;
        setRemaining(seconds);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [running]);

  const reset = () => {
    setRunning(false);
    deadlineRef.current = null;
    remainingRef.current = minutes * 60;
    setRemaining(minutes * 60);
    setStartedAt(null);
    setDone(false);
    completedRef.current = false;
  };

  const start = () => {
    if (remainingRef.current <= 0) {
      remainingRef.current = minutes * 60;
      setRemaining(minutes * 60);
      completedRef.current = false;
    }
    if (startedAt === null || done) setStartedAt(Date.now());
    deadlineRef.current = Date.now() + remainingRef.current * 1000;
    setRunning(true);
    setDone(false);
  };

  const pause = () => {
    const seconds = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000));
    remainingRef.current = seconds;
    setRemaining(seconds);
    deadlineRef.current = null;
    setRunning(false);
  };

  const mm = Math.floor(remaining / 60);
  const ss = remaining % 60;
  const progress = 1 - remaining / (minutes * 60);

  return <div className="space-y-5">
    <BackLink />
    <PageHeader title="Focus Mode" subtitle="Give your attention to one useful thing at a time." />
    <Card className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent"><Timer /></div>
      <h2 className="mt-3 font-semibold">Choose a session</h2>
      <div className="mt-4 flex flex-wrap justify-center gap-2">{options.map(n => <button key={n} disabled={running} onClick={() => { setMinutes(n); remainingRef.current = n * 60; setRemaining(n * 60); setDone(false); setStartedAt(null); completedRef.current = false; }} className={`rounded-xl px-4 py-2 text-sm font-semibold ${minutes === n ? 'bg-accent text-onaccent' : 'bg-surface2 text-muted'}`}>{n} min</button>)}</div>
      <div className="relative mx-auto my-7 flex h-56 w-56 items-center justify-center rounded-full" style={{ background: `conic-gradient(var(--accent) ${progress * 360}deg, var(--line) 0deg)` }}>
        <div className="flex h-48 w-48 flex-col items-center justify-center rounded-full bg-surface"><span className="text-5xl font-black tabular-nums">{mm}:{String(ss).padStart(2, '0')}</span><span className="mt-1 text-xs text-muted">{running ? 'Stay focused' : 'Ready when you are'}</span></div>
      </div>
      <div className="flex justify-center gap-2"><Button onClick={() => running ? pause() : start()}>{running ? <><Pause className="mr-1 h-4 w-4" />Pause</> : <><Play className="mr-1 h-4 w-4" />{done ? 'Start again' : remaining < minutes * 60 ? 'Resume focus' : 'Start focus'}</>}</Button><Button variant="secondary" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" />Reset</Button></div>
      {done && <p className="mt-4 flex items-center justify-center gap-2 text-sm font-semibold text-success"><CheckCircle2 className="h-4 w-4" />Session completed. Well done!</p>}
    </Card>
    <Card><h3 className="font-semibold">A simple focus plan</h3><ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted"><li>Choose one small task.</li><li>Put away distractions if possible.</li><li>Work until the timer ends. Take a short break afterward.</li></ol></Card>
  </div>;
}
