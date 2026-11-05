import { useState, type FormEvent } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field, SelectInput, TextInput } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { useLock } from '@/context/LockContext';
import { AUTO_LOCK_OPTIONS, DEFAULT_AUTO_LOCK_SEC, isLockSupported, isValidPinFormat, type VerifyResult } from '@/services/lockService';
import { tr } from '@/i18n';

type Mode = 'set' | 'change' | 'remove' | null;

const digitsOnly = (v: string) => v.replace(/\D/g, '').slice(0, 6);

function autoLockLabel(sec: number): string {
  if (sec === 0) return tr('Immediately');
  if (sec === 30) return tr('After 30 seconds');
  if (sec === 60) return tr('After 1 minute');
  return tr('After 5 minutes');
}

function verifyMessage(res: Extract<VerifyResult, { ok: false }>): string {
  if (res.reason === 'cooldown') return tr('Too many attempts. Try again in {s}s.', { s: Math.ceil(res.waitMs / 1000) });
  if (res.reason === 'wrong') return tr('Wrong PIN. {n} tries left before a short pause.', { n: res.attemptsLeft });
  return tr('Something went wrong');
}

/** Settings card: set, change or remove the PIN lock and choose the auto-lock delay. */
export function PinLockSettings() {
  const { enabled, autoLockSec, lockNow, enable, change, disable, setAutoLock } = useLock();
  const toast = useToast();
  const [mode, setMode] = useState<Mode>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [delay, setDelay] = useState<number>(DEFAULT_AUTO_LOCK_SEC);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const supported = isLockSupported();

  const open = (m: Exclude<Mode, null>) => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setDelay(autoLockSec);
    setError(null);
    setMode(m);
  };
  const close = () => {
    if (!busy) setMode(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !mode) return;
    setError(null);
    if (mode !== 'remove') {
      if (!isValidPinFormat(next)) return setError(tr('Use 4 to 6 digits.'));
      if (next !== confirm) return setError(tr('The two PINs do not match.'));
    }
    setBusy(true);
    try {
      if (mode === 'set') {
        await enable(next, delay);
        toast.success(tr('PIN lock is on'), tr('Iron Will will ask for your PIN when it opens.'));
      } else if (mode === 'change') {
        const res = await change(current, next);
        if (!res.ok) return setError(verifyMessage(res));
        toast.success(tr('PIN changed'));
      } else {
        const res = await disable(current);
        if (!res.ok) return setError(verifyMessage(res));
        toast.success(tr('PIN lock is off'));
      }
      setMode(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const title = mode === 'set' ? tr('Set a PIN') : mode === 'change' ? tr('Change PIN') : tr('Remove PIN lock');

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/15 text-accent">{enabled ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}</div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold">{enabled ? tr('PIN lock is on') : tr('PIN lock is off')}</div>
          <p className="mt-1 text-xs leading-relaxed text-muted">{tr('Hides your data behind a PIN when the app opens or comes back from the background. This stops casual snooping; it does not encrypt your data.')}</p>
        </div>
      </div>

      {!supported && <p className="mt-3 text-xs text-danger">{tr('PIN lock needs a secure (HTTPS) connection.')}</p>}

      {enabled ? (
        <>
          <div className="mt-4">
            <Field label={tr('Lock automatically')}>
              <SelectInput value={autoLockSec} onChange={(e) => setAutoLock(Number(e.target.value))}>
                {AUTO_LOCK_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {autoLockLabel(s)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="primary" icon={<Lock className="h-4 w-4" />} onClick={lockNow}>
              {tr('Lock now')}
            </Button>
            <Button onClick={() => open('change')}>{tr('Change PIN')}</Button>
          </div>
          <Button className="mt-2" variant="ghost" full onClick={() => open('remove')}>
            {tr('Remove PIN lock')}
          </Button>
        </>
      ) : (
        <Button className="mt-4" variant="primary" full disabled={!supported} icon={<KeyRound className="h-4 w-4" />} onClick={() => open('set')}>
          {tr('Set a PIN')}
        </Button>
      )}

      <p className="mt-3 text-xs leading-relaxed text-muted">{tr('Keep your PIN safe. If you forget it, the only way back in is to erase all data on this device.')}</p>

      <Modal open={mode !== null} onClose={close} title={title}>
        <form onSubmit={(e) => void submit(e)} className="space-y-4">
          {mode !== 'set' && (
            <Field label={tr('Current PIN')}>
              <TextInput type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={current} onChange={(e) => setCurrent(digitsOnly(e.target.value))} />
            </Field>
          )}
          {mode !== 'remove' && (
            <>
              <Field label={mode === 'change' ? tr('New PIN') : tr('PIN (4 to 6 digits)')}>
                <TextInput type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={next} onChange={(e) => setNext(digitsOnly(e.target.value))} />
              </Field>
              <Field label={tr('Repeat the PIN')}>
                <TextInput type="password" inputMode="numeric" autoComplete="off" maxLength={6} value={confirm} onChange={(e) => setConfirm(digitsOnly(e.target.value))} />
              </Field>
            </>
          )}
          {mode === 'set' && (
            <Field label={tr('Lock automatically')} hint={tr('Choosing a file or the share sheet can send the app to the background, so a very short delay may lock it then.')}>
              <SelectInput value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
                {AUTO_LOCK_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {autoLockLabel(s)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          )}
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <div className="grid gap-2">
            <Button type="submit" variant={mode === 'remove' ? 'danger' : 'primary'} full disabled={busy}>
              {mode === 'set' ? tr('Turn on PIN lock') : mode === 'change' ? tr('Save new PIN') : tr('Remove PIN lock')}
            </Button>
            <Button variant="secondary" full onClick={close} disabled={busy}>
              {tr('Cancel')}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
