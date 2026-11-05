import { useEffect, useState } from 'react';
import { HeartHandshake, RotateCcw, Sprout } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, TextArea } from '@/components/ui/Field';
import { useApp } from '@/context/AppContext';

import { tr } from '@/i18n';
/** Reset confirmation (no shame – achievements, longest streak and history are all preserved). */
export function ResetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { resetWithRecovery } = useApp();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) setNote('');
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    try {
      await resetWithRecovery(note);
      onClose();
    } catch {
      /* toast shown */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tr("Start again?")}>
      <p className="text-sm leading-relaxed text-muted">
        {tr("A setback is part of the journey, not the end of it. Your attempt will be saved to your history and a fresh one begins right now.")}
      </p>
      <ul className="mt-4 space-y-2.5 rounded-2xl border border-line bg-surface2/50 p-4 text-sm">
        <li className="flex items-center gap-2.5">
          <HeartHandshake className="h-4 w-4 shrink-0 text-success" /> {tr("Achievements & badges are kept")}
        </li>
        <li className="flex items-center gap-2.5">
          <HeartHandshake className="h-4 w-4 shrink-0 text-success" /> {tr("Longest streak & history are kept")}
        </li>
        <li className="flex items-center gap-2.5">
          <Sprout className="h-4 w-4 shrink-0 text-success" /> {tr("Your Habit Tree keeps its growth")}
        </li>
      </ul>
      <div className="mt-4">
        <Field label={tr("What did you learn? (optional, private)")}>
          <TextArea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder={tr("A trigger, a feeling, something to try next time...")} />
        </Field>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button variant="ghost" onClick={onClose}>
          {tr("Keep going")}
        </Button>
        <Button variant="primary" onClick={confirm} disabled={busy} icon={<RotateCcw className="h-4 w-4" />}>
          {tr("Start again")}
        </Button>
      </div>
    </Modal>
  );
}

const RECOVERY_MESSAGES = [
  'A setback does not erase your progress. Every attempt teaches you something. Start again.',
  'You are not starting from zero. You are starting from experience.',
  'Falling is part of learning. Standing up is the part that counts.',
];

export function RecoveryModal() {
  const { recoveryOpen, closeRecovery, attempts } = useApp();
  const msg = RECOVERY_MESSAGES[attempts.length % RECOVERY_MESSAGES.length];
  return (
    <Modal open={recoveryOpen} onClose={closeRecovery} hideClose>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-success/15 text-success">
          <Sprout className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold">{tr("A fresh start")}</h2>
        <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{tr(msg)}</p>
        <p className="mx-auto mt-3 max-w-xs text-sm text-muted">
          {tr("Your achievements, longest streak, and history are safe. Your new attempt has begun.")}
        </p>
        <Button variant="primary" full className="mt-6" onClick={closeRecovery}>
          {tr("I'm ready")}
        </Button>
      </div>
    </Modal>
  );
}
