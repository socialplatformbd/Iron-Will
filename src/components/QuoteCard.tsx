import { Copy, Heart, Quote as QuoteIcon, Share2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import { useNow } from '@/hooks/useNow';
import { quoteForDay } from '@/services/quoteService';
import { localDayNumber } from '@/utils/time';
import { cn } from '@/utils/cn';

/** Daily quote from the offline library. Favoriting and sharing are user-initiated only. */
export function QuoteCard() {
  const { favoriteIds, toggleFavorite } = useApp();
  const toast = useToast();
  const now = useNow(60_000);
  const quote = quoteForDay(localDayNumber(now));
  const isFav = favoriteIds.includes(quote.id);
  const text = `"${quote.text}" — Iron Will`;

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ text, title: 'Iron Will' });
        return;
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
    }
    copy();
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Quote copied');
    } catch {
      toast.error('Could not copy', 'Your browser blocked clipboard access.');
    }
  };

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
          <QuoteIcon className="h-4 w-4 text-accent" /> Daily motivation
        </div>
        <span className="rounded-full bg-surface2 px-2.5 py-1 text-[11px] font-medium capitalize text-muted">{quote.category}</span>
      </div>
      <p className="text-lg font-semibold leading-snug tracking-tight">&ldquo;{quote.text}&rdquo;</p>
      <div className="mt-4 flex items-center gap-1.5">
        <button
          onClick={() => void toggleFavorite(quote.id).catch(() => undefined)}
          aria-pressed={isFav}
          aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
          className={cn('flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-surface2', isFav ? 'text-danger' : 'text-muted')}
        >
          <Heart className={cn('h-5 w-5', isFav && 'fill-current')} />
        </button>
        <button onClick={copy} aria-label="Copy quote" className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink">
          <Copy className="h-5 w-5" />
        </button>
        <button onClick={share} aria-label="Share quote" className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-surface2 hover:text-ink">
          <Share2 className="h-5 w-5" />
        </button>
      </div>
    </Card>
  );
}
