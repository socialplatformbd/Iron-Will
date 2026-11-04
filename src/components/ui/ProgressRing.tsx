import { useId, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** 0..1 */
  value: number;
  size?: number;
  stroke?: number;
  children?: ReactNode;
  className?: string;
}

/** Animated circular progress indicator with an accent gradient. */
export function ProgressRing({ value, size = 240, stroke = 14, children, className }: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, Math.max(0, value));
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', maxWidth: '100%' }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-2)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{ filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--accent) 50%, transparent))' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
