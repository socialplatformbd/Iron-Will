import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  full?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-gradient-accent text-onaccent shadow-lg shadow-accent/20 hover:brightness-110',
  secondary: 'bg-surface2 text-ink hover:brightness-110 border border-line',
  outline: 'border border-line text-ink hover:bg-surface2',
  ghost: 'text-muted hover:text-ink hover:bg-surface2',
  danger: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
};

const SIZES: Record<Size, string> = {
  sm: 'min-h-10 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'min-h-12 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'min-h-14 px-6 text-base rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'secondary', size = 'md', icon, full, className, children, type = 'button', ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        className
      )}
      {...rest}
    >
      {icon}
      {children}
    </button>
  );
});
