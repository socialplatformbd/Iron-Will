import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Delete, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useApp } from '@/context/AppContext';
import { useLock } from '@/context/LockContext';
import { clearAllData, deleteAllSnapshots } from '@/services/backupService';
import { cn } from '@/utils/cn';
import { tr } from '@/i18n';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Full-screen PIN entry. Nothing personal is rendered while this is shown. */
export function LockScreen() {
  const { len, unlock, resetAfterWipe } = useLock();
  const { reload } = useApp();
  const toast = useToast();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [forgot, setForgot] = useState(false);
  const [wiping, setWiping] = useState(false);
  const busyRef = useRef(false);

  const waitMs = Math.max(0, waitUntil - now);
  const waiting = waitMs > 0;

  useEffect(() => {
    if (!waiting) return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [waiting]);

  const submit = useCallback(
    async (value: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      try {
        const res = await unlock(value);
        if (res.ok) return;
        setPin('');
        try {
          navigator.vibrate?.(120);
        } catch {
          /* vibration is optional */
        }
        if (res.reason === 'cooldown') {
          setNow(Date.now());
          setWaitUntil(Date.now() + res.waitMs);
          setError(null);
        } else if (res.reason === 'wrong') {
          setError(tr('Wrong PIN. {n} tries left before a short pause.', { n: res.attemptsLeft }));
        } else {
          setError(tr('Something went wrong'));
        }
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [unlock]
  );

  const press = useCallback(
    (digit: string) => {
      if (busyRef.current || waiting) return;
      setError(null);
      setPin((p) => {
        if (p.length >= len) return p;
        const next = p + digit;
        if (next.length === len) void submit(next);
        return next;
      });
    },
    [len, waiting, submit]
  );

  const backspace = useCallback(() => {
    if (busyRef.current) return;
    setPin((p) => p.slice(0, -1));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (forgot) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') backspace();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, backspace, forgot]);

  const wipe = async () => {
    if (wiping) return;
    setWiping(true);
    try {
      await clearAllData();
      await deleteAllSnapshots();
      await reload();
      resetAfterWipe();
    } catch (err) {
      toast.error(tr('Action failed'), (err as Error).message);
      setWiping(false);
    }
  };

  const seconds = Math.ceil(waitMs / 1000);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg px-6 py-8 text-ink">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent/15 text-accent">
        <Lock className="h-8 w-8" />
      </div>
      <h1 className="text-xl font-bold">{tr('Enter your PIN')}</h1>
      <div className="mt-6 flex gap-3" role="img" aria-label={tr('{n} of {total} digits entered', { n: pin.length, total: len })}>
        {Array.from({ length: len }, (_, i) => (
          <span key={i} className={cn('h-3.5 w-3.5 rounded-full border border-accent/60 transition', i < pin.length && 'bg-accent')} />
        ))}
      </div>
      <p className="mt-4 min-h-10 max-w-xs text-center text-sm text-muted" role="status" aria-live="polite">
        {waiting ? tr('Too many attempts. Try again in {s}s.', { s: seconds }) : error}
      </p>

      <div className="mt-4 grid w-full max-w-[18rem] grid-cols-3 gap-3">
        {KEYS.map((k) => (
          <PadKey key={k} onClick={() => press(k)} disabled={busy || waiting}>
            {k}
          </PadKey>
        ))}
        <span />
        <PadKey onClick={() => press('0')} disabled={busy || waiting}>
          0
        </PadKey>
        <PadKey onClick={backspace} disabled={busy || pin.length === 0} label={tr('Delete')}>
          <Delete className="mx-auto h-6 w-6" />
        </PadKey>
      </div>

      <button className="mt-8 min-h-11 px-4 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline" onClick={() => setForgot(true)}>
        {tr('Forgot PIN?')}
      </button>

      <Modal open={forgot} onClose={() => !wiping && setForgot(false)} title={tr('Forgot your PIN?')}>
        <p className="text-sm leading-relaxed text-muted">
          {tr('The PIN cannot be recovered. The only way back in is to erase everything saved on this device (timer, journal, letters, history) and remove the lock. You can import a backup afterwards if you have one.')}
        </p>
        <div className="mt-5 grid gap-2">
          <Button variant="danger" full onClick={() => void wipe()} disabled={wiping}>
            {tr('Erase all data and remove PIN')}
          </Button>
          <Button variant="secondary" full onClick={() => setForgot(false)} disabled={wiping}>
            {tr('Cancel')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function PadKey({ children, onClick, disabled, label }: { children: ReactNode; onClick: () => void; disabled?: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-16 select-none items-center justify-center rounded-full border border-line bg-surface text-2xl font-semibold transition active:scale-95 active:bg-surface2 disabled:opacity-40"
    >
      {children}
    </button>
  );
}
