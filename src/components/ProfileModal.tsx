import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, SelectInput, TextInput } from '@/components/ui/Field';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { CURRENCIES } from '@/data/constants';
import { parseMoney, sanitizeText } from '@/utils/sanitize';

import { tr } from '@/i18n';
/** Habit name, previous daily spending, currency and personal reasons. Saved on-device only. */
export function ProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, saveProfile } = useApp();
  const toast = useToast();
  const [habit, setHabit] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [reasons, setReasons] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!open) return;
    setHabit(profile.habitName);
    setCost(profile.dailyCost ? String(profile.dailyCost) : '');
    setCurrency(profile.currency);
    setReasons(profile.reasons);
    setDraft('');
  }, [open, profile]);

  const addReason = () => {
    const r = sanitizeText(draft, 160);
    if (!r) return;
    setReasons((prev) => (prev.length >= 10 ? prev : [...prev, r]));
    setDraft('');
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const pending = sanitizeText(draft, 160);
    const finalReasons = pending && reasons.length < 10 ? [...reasons, pending] : reasons;
    try {
      await saveProfile({ habitName: sanitizeText(habit, 60), dailyCost: parseMoney(cost), currency, reasons: finalReasons });
      toast.success(tr("Profile saved on this device"));
      onClose();
    } catch {
      /* toast shown */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tr("Habit & savings")}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={tr("Habit you are quitting")}>
          <TextInput value={habit} onChange={(e) => setHabit(e.target.value)} maxLength={60} placeholder={tr("e.g. Smoking")} />
        </Field>
        <div className="grid grid-cols-5 gap-3">
          <div className="col-span-3">
            <Field label={tr("Daily spending")} hint={tr("What you used to spend per day.")}>
              <TextInput inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9.,]/g, ''))} placeholder="0.00" />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label={tr("Currency")}>
              <SelectInput value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.symbol}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">{tr("My reasons for quitting")}</span>
          <div className="flex gap-2">
            <TextInput
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addReason();
                }
              }}
              maxLength={160}
              placeholder={tr("e.g. To be present for my family")}
            />
            <Button onClick={addReason} aria-label={tr("Add reason")} className="px-4" icon={<Plus className="h-5 w-5" />} />
          </div>
          {reasons.length > 0 && (
            <ul className="mt-3 space-y-2">
              {reasons.map((r, i) => (
                <li key={`${r}-${i}`} className="flex items-start justify-between gap-2 rounded-xl border border-line bg-surface2/60 px-3 py-2.5 text-sm">
                  <span className="min-w-0 break-words">{r}</span>
                  <button type="button" aria-label={tr("Remove reason")} onClick={() => setReasons((p) => p.filter((_, idx) => idx !== i))} className="shrink-0 text-muted hover:text-danger">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button variant="ghost" onClick={onClose}>
            {tr("Cancel")}
          </Button>
          <Button type="submit" variant="primary" icon={<Save className="h-4 w-4" />}>
            {tr("Save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
