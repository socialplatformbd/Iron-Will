import { motion } from 'framer-motion';
import { ShieldCheck, Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/ui/Logo';
import { CommunityButtons } from '@/components/CommunityButtons';
import { useApp } from '@/context/AppContext';
import { DEVELOPER_CREDIT } from '@/data/constants';

import { tr } from '@/i18n';
/** First-launch welcome + optional community invitation. Never forces anyone to join. */
export function WelcomeModal() {
  const { welcomeOpen, closeWelcome, markWelcomeSeen } = useApp();
  return (
    <Modal open={welcomeOpen} onClose={closeWelcome} hideClose className="sm:max-w-lg">
      <div className="text-center">
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 18 }} className="mx-auto mb-4 w-fit">
          <Logo size={72} className="drop-shadow-[0_8px_30px_var(--accent)]" />
        </motion.div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{tr("Welcome to Iron Will")}</h1>
        <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
          {tr("Build discipline. Break bad habits. Become stronger every day.")}
        </p>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-2xl border border-line bg-surface2/60 p-3.5 text-left">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
        <p className="text-sm leading-relaxed text-muted">
          <span className="font-semibold text-ink">{tr("Private by design.")}</span> {tr("No account, no login. Everything you record stays on this device.")}
        </p>
      </div>

      <div className="mt-5 rounded-3xl border border-line bg-surface p-4">
        <div className="mb-1 flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          <h2 className="text-lg font-bold">{tr("Join Our Community")}</h2>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-muted">
          {tr("Join our Telegram Channel and WhatsApp Group to receive updates, new features, announcements, and useful resources.")}
        </p>
        <CommunityButtons onJoin={markWelcomeSeen} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={closeWelcome}>
          {tr("Maybe Later")}
        </Button>
        <Button variant="primary" onClick={closeWelcome}>
          {tr("Continue to App")}
        </Button>
      </div>
      <p className="mt-4 text-center text-xs text-muted">{tr(DEVELOPER_CREDIT)}</p>
    </Modal>
  );
}
