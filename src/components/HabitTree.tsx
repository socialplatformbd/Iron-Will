import { memo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  /** 0..5 */
  stage: number;
  className?: string;
}

const LEAF = ['#22c55e', '#16a34a', '#4ade80', '#15803d'];

// Canopy blobs: [cx, cy, r, colorIndex, minStage]
const CANOPY: [number, number, number, number, number][] = [
  [100, 92, 26, 0, 3],
  [76, 104, 20, 1, 3],
  [124, 104, 20, 2, 3],
  [100, 72, 22, 3, 3],
  [70, 82, 22, 2, 4],
  [130, 82, 22, 0, 4],
  [100, 52, 22, 1, 4],
  [84, 62, 18, 3, 4],
  [118, 62, 18, 2, 4],
  [56, 100, 16, 3, 5],
  [144, 100, 16, 1, 5],
];

const FLOWERS: [number, number][] = [
  [78, 76], [122, 70], [100, 50], [64, 98], [136, 96], [90, 100], [112, 90],
];
const FRUITS: [number, number][] = [
  [84, 110], [118, 108], [100, 84], [70, 90], [132, 88],
];

function HabitTreeBase({ stage, className }: Props) {
  const s = Math.max(0, Math.min(5, Math.floor(stage)));
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`Habit tree at stage ${s + 1} of 6`}>
      <defs>
        <radialGradient id="ht-glow" cx="50%" cy="60%" r="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ht-trunk" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7c5a3c" />
          <stop offset="1" stopColor="#a47a52" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="110" r="95" fill="url(#ht-glow)" />

      {/* ground */}
      <ellipse cx="100" cy="178" rx="62" ry="10" fill="#3b2a1d" opacity="0.9" />
      <ellipse cx="100" cy="175" rx="54" ry="8" fill="#5a4030" />

      {/* Stage 0: seed */}
      {s === 0 && (
        <motion.ellipse
          cx="100"
          cy="170"
          rx="7"
          ry="5"
          fill="#c89b62"
          initial={{ scale: 0.6 }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.6 }}
        />
      )}

      {/* Stage 1: sprout */}
      {s === 1 && (
        <g>
          <motion.path d="M100 174 C100 160 100 150 100 142" stroke="#4ade80" strokeWidth="4" strokeLinecap="round" fill="none" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
          <motion.path d="M100 148 C88 146 80 138 78 128 C90 128 98 136 100 148Z" fill="#22c55e" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '100px 148px' }} />
          <motion.path d="M100 144 C112 142 120 134 122 124 C110 124 102 132 100 144Z" fill="#4ade80" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '100px 144px' }} />
        </g>
      )}

      {/* Stage 2: small plant */}
      {s === 2 && (
        <g>
          <path d="M100 176 C100 150 100 128 100 108" stroke="#4ade80" strokeWidth="5" strokeLinecap="round" fill="none" />
          {[
            'M100 150 C84 150 72 140 70 128 C86 128 98 138 100 150Z',
            'M100 138 C116 138 128 128 130 116 C114 116 102 126 100 138Z',
            'M100 124 C86 122 76 112 76 100 C90 100 100 110 100 124Z',
            'M100 112 C114 110 122 100 122 88 C108 90 100 100 100 112Z',
            'M100 108 C94 98 96 88 100 80 C106 88 106 98 100 108Z',
          ].map((d, i) => (
            <motion.path key={i} d={d} fill={LEAF[i % 4]} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08 }} style={{ transformOrigin: '100px 130px' }} />
          ))}
        </g>
      )}

      {/* Stage 3+: trunk + branches */}
      {s >= 3 && (
        <g>
          <path d="M92 178 C94 150 96 130 96 104 L104 104 C104 130 106 150 108 178Z" fill="url(#ht-trunk)" />
          {s >= 4 && (
            <>
              <path d="M98 128 C86 120 78 112 72 100" stroke="#8a6644" strokeWidth="5" strokeLinecap="round" fill="none" />
              <path d="M102 120 C114 112 122 104 128 92" stroke="#8a6644" strokeWidth="5" strokeLinecap="round" fill="none" />
            </>
          )}
          {CANOPY.filter((c) => c[4] <= s).map(([cx, cy, r, ci], i) => (
            <motion.circle
              key={`${cx}-${cy}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={LEAF[ci]}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 200, damping: 16 }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          ))}
        </g>
      )}

      {/* Stage 4+: fruits (stage 4: a few) */}
      {s >= 4 &&
        FRUITS.slice(0, s === 4 ? 3 : 5).map(([x, y], i) => (
          <motion.circle key={`f${i}`} cx={x} cy={y} r="4.5" fill="#f43f5e" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.07 }} style={{ transformOrigin: `${x}px ${y}px` }} />
        ))}

      {/* Stage 5: flowers */}
      {s >= 5 &&
        FLOWERS.map(([x, y], i) => (
          <motion.g key={`fl${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 + i * 0.07 }} style={{ transformOrigin: `${x}px ${y}px` }}>
            {[0, 72, 144, 216, 288].map((a) => (
              <ellipse key={a} cx={x} cy={y - 4.5} rx="2.6" ry="4" fill={i % 2 ? '#fbcfe8' : '#fde68a'} transform={`rotate(${a} ${x} ${y})`} />
            ))}
            <circle cx={x} cy={y} r="2.2" fill="#f59e0b" />
          </motion.g>
        ))}
    </svg>
  );
}

export const HabitTree = memo(HabitTreeBase);
