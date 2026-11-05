import { useEffect, useState, type FormEvent } from 'react';
import { Play, Save } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, TextInput } from '@/components/ui/Field';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { fromDateTimeLocal, toDateTimeLocal } from '@/utils/time';
import { sanitizeText } from '@/utils/sanitize';

import { tr } from '@/i18n';
interface Props {
  open: boolean;
  onClose: () => void;
  /** "edit" changes the running timer's start; "start" begins a new one. */
  mode: 'start' | 'edit';
}

/** Start the timer now or at a custom past date/time. Also captures the habit name once. */
export function StartTimerModal({ open, onClose, mode }: Props) {
  const { startedAt, startTimerAt, editStart, profile, saveProfile } = useApp();
  const toast = useToast();
  const [value, setValue] = useState('');
  const [habit, setHabit] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [maxValue, setMaxValue] = useState('');

  useEffect(() => {
    if (!open) return;
    const now = Date.now();
    setValue(toDateTimeLocal(mode === 'edit' && startedAt ? startedAt : now));
    setMaxValue(toDateTimeLocal(now));
    setHabit(profile.habitName);
    setError('');
  }, [open, mode, startedAt, profile.habitName]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ts = fromDateTimeLocal(value);
    if (ts == null) return setError(tr("Please choose a valid date and time."));
    if (ts > Date.now() + 60_000) return setError(tr("The start time cannot be in the future."));
    if (ts < new Date('2000-01-01').getTime()) return setError(tr("Please choose a date after the year 2000."));
    setBusy(true);
    try {
      const cleanHabit = sanitizeText(habit, 60);
      if (cleanHabit !== profile.habitName) await saveProfile({ ...profile, habitName: cleanHabit });
      if (mode === 'edit') await editStart(ts);
      else await startTimerAt(ts);
      toast.success(mode === 'edit' ? tr('Start time updated') : tr('Your journey has begun'), tr("Every moment counts from here."));
      onClose();
    } catch {
      /* error toast already shown */
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit' ? tr("Edit start date & time") : tr("Start your journey")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={tr("What are you quitting? (optional)")} hint={tr("Stays on this device. Used only to personalise your screens.")}>
          <TextInput value={habit} onChange={(e) => setHabit(e.target.value)} placeholder={tr("e.g. Smoking, social media, sugar")} maxLength={60} />
        </Field>
        <Field
          label={tr("Start date & time")}
          hint={mode === 'edit' ? tr("Adjust when your current streak began.") : tr("Starting today? Leave as is. Already started earlier? Pick the real date and time.")}
        >
          <TextInput type="datetime-local" value={value} max={maxValue} onChange={(e) => setValue(e.target.value)} required />
        </Field>
        {error && <p className="text-sm font-medium text-danger">{error}</p>}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            {tr("Cancel")}
          </Button>
          <Button type="submit" variant="primary" disabled={busy} icon={mode === 'edit' ? <Save className="h-4 w-4" /> : <Play className="h-4 w-4" />}>
            {mode === 'edit' ? tr("Save") : tr("Start")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
