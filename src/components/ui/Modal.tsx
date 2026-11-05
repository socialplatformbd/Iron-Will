import { useEffect, useId, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

import { tr } from '@/i18n';
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Hide the close (X) button, e.g. for blocking flows. */
  hideClose?: boolean;
  className?: string;
  /** Allow dismissing by tapping the backdrop. */
  dismissible?: boolean;
}

/** Bottom sheet on mobile, centered dialog on larger screens. */
export function Modal({ open, onClose, title, children, hideClose, className, dismissible = true }: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the latest callbacks in refs so the effect only depends on `open` (no focus stealing on re-render).
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const dismissibleRef = useRef(dismissible);
  dismissibleRef.current = dismissible;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissibleRef.current) closeRef.current();
    };
    window.addEventListener('keydown', onKey);
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={dismissible ? onClose : undefined}
            aria-hidden
          />
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            className={cn(
              'relative z-10 max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-line bg-elev p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl outline-none sm:max-w-md sm:rounded-[28px] sm:pb-5',
              className
            )}
          >
            {(title || !hideClose) && (
              <div className="mb-4 flex items-start justify-between gap-3">
                {title ? (
                  <h2 id={titleId} className="text-lg font-bold tracking-tight">
                    {title}
                  </h2>
                ) : (
                  <span />
                )}
                {!hideClose && (
                  <button
                    onClick={onClose}
                    aria-label={tr("Close")}
                    className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
