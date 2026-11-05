import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { changePin, getLockInfo, hasPin, removePin, setAutoLock as saveAutoLock, setPin, verifyPin, wipeLock, type LockInfo, type VerifyResult } from '@/services/lockService';

interface LockContextValue extends LockInfo {
  locked: boolean;
  lockNow: () => void;
  unlock: (pin: string) => Promise<VerifyResult>;
  enable: (pin: string, autoLockSec: number) => Promise<void>;
  change: (oldPin: string, newPin: string) => Promise<VerifyResult>;
  disable: (pin: string) => Promise<VerifyResult>;
  setAutoLock: (sec: number) => void;
  /** After all data was erased because the PIN was forgotten. */
  resetAfterWipe: () => void;
}

const Ctx = createContext<LockContextValue | null>(null);

export function LockProvider({ children }: { children: ReactNode }) {
  const [info, setInfo] = useState<LockInfo>(() => getLockInfo());
  // Start locked when a PIN exists, before anything personal is rendered.
  const [locked, setLocked] = useState<boolean>(() => hasPin());
  const hiddenAt = useRef<number | null>(null);

  const refresh = useCallback(() => setInfo(getLockInfo()), []);

  // Lock again when the app returns from the background after the chosen delay.
  useEffect(() => {
    if (!info.enabled) return;
    const onChange = () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        if (info.autoLockSec === 0) setLocked(true);
      } else if (hiddenAt.current !== null) {
        if (Date.now() - hiddenAt.current >= info.autoLockSec * 1000) setLocked(true);
        hiddenAt.current = null;
      }
    };
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, [info.enabled, info.autoLockSec]);

  const value = useMemo<LockContextValue>(
    () => ({
      ...info,
      locked: info.enabled && locked,
      lockNow: () => setLocked(true),
      unlock: async (pin) => {
        const res = await verifyPin(pin);
        if (res.ok) setLocked(false);
        return res;
      },
      enable: async (pin, autoLockSec) => {
        await setPin(pin, autoLockSec);
        refresh();
        setLocked(false);
      },
      change: async (oldPin, newPin) => {
        const res = await changePin(oldPin, newPin);
        if (res.ok) refresh();
        return res;
      },
      disable: async (pin) => {
        const res = await removePin(pin);
        if (res.ok) {
          refresh();
          setLocked(false);
        }
        return res;
      },
      setAutoLock: (sec) => {
        saveAutoLock(sec);
        refresh();
      },
      resetAfterWipe: () => {
        wipeLock();
        refresh();
        setLocked(false);
      },
    }),
    [info, locked, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLock(): LockContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLock must be used inside LockProvider');
  return ctx;
}
