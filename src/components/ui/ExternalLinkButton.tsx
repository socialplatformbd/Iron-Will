import type { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Props {
  href: string;
  children: ReactNode;
  icon?: ReactNode;
  className?: string;
  onClick?: () => void;
  brand?: 'telegram' | 'whatsapp' | 'neutral';
}

const BRAND: Record<NonNullable<Props['brand']>, string> = {
  telegram: 'bg-[#229ED9] text-white hover:brightness-110 shadow-lg shadow-[#229ED9]/25',
  whatsapp: 'bg-[#25D366] text-[#052e16] hover:brightness-105 shadow-lg shadow-[#25D366]/25',
  neutral: 'bg-surface2 text-ink border border-line hover:brightness-110',
};

/** Secure external link: opens in a new tab, no opener / referrer leakage. */
export function ExternalLinkButton({ href, children, icon, className, onClick, brand = 'neutral' }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={onClick}
      className={cn(
        'inline-flex min-h-12 w-full select-none items-center justify-center gap-2.5 rounded-2xl px-5 text-[15px] font-semibold transition active:scale-[0.98]',
        BRAND[brand],
        className
      )}
    >
      {icon}
      <span>{children}</span>
      <ExternalLink className="h-4 w-4 opacity-60" aria-hidden />
    </a>
  );
}
