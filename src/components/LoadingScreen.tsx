import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { APP_TAGLINE } from '@/data/constants';

import { tr } from '@/i18n';
export function LoadingScreen() {
  return (
    <div className="glow-bg flex min-h-dvh flex-col items-center justify-center bg-bg px-6 text-center">
      <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
        <Logo size={84} />
      </motion.div>
      <h1 className="mt-5 text-2xl font-extrabold tracking-[0.18em]">{tr("IRON WILL")}</h1>
      <p className="mt-1.5 text-sm text-muted">{tr(APP_TAGLINE)}</p>
      <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-surface2">
        <motion.div className="h-full w-1/2 rounded-full bg-gradient-accent" animate={{ x: ['-100%', '200%'] }} transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }} />
      </div>
    </div>
  );
}
