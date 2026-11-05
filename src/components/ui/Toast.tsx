import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, Trophy } from 'lucide-react';

import { tr } from '@/i18n';
type ToastKind = 'success' | 'error' | 'info' | 'achievement';
interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastApi {
  show: (kind: ToastKind, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  achievement: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <AlertTriangle className="h-5 w-5 text-danger" />,
  info: <Info className="h-5 w-5 text-accent" />,
  achievement: <Trophy className="h-5 w-5 text-accent" />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((kind: ToastKind, title: string, message?: string) => {
    const id = ++idRef.current;
    setItems((prev) => [...prev.slice(-2), { id, kind, title, message }]);
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), kind === 'achievement' ? 6000 : 4000);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      show,
      success: (t, m) => show('success', t, m),
      error: (t, m) => show('error', t, m),
      info: (t, m) => show('info', t, m),
      achievement: (t, m) => show('achievement', t, m),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)]"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-elev/95 p-3.5 shadow-2xl backdrop-blur-xl ${
                t.kind === 'achievement' ? 'border-accent/50' : 'border-line'
              }`}
              role="status"
            >
              <div className="mt-0.5 shrink-0">{ICONS[t.kind]}</div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{t.title}</p>
                {t.message && <p className="mt-0.5 text-sm text-muted">{t.message}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error(tr("useToast must be used inside ToastProvider"));
  return ctx;
}
