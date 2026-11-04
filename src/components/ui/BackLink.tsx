import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/** Visible way out of distraction-free pages (they hide the navigation bar). */
export function BackLink({ to = '/', label = 'Back to home' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink">
      <ArrowLeft className="h-4 w-4" /> {label}
    </Link>
  );
}
