import { cn } from '@/utils/cn';

export function Logo({ size = 36, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} className={cn('shrink-0', className)} aria-hidden="true">
      <defs>
        <linearGradient id="lg-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent-2)" />
          <stop offset="1" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="#0d0d13" />
      <path
        d="M256 82 400 138v110c0 90-58 150-144 184C170 398 112 338 112 248V138z"
        fill="none"
        stroke="url(#lg-gold)"
        strokeWidth="24"
        strokeLinejoin="round"
      />
      <path d="M214 196h84v28h-28v76h28v28h-84v-28h28v-76h-28z" fill="url(#lg-gold)" />
    </svg>
  );
}
