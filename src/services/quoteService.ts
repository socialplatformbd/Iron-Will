import { db, safe } from '@/database/db';
import { QUOTES } from '@/data/quotes';
import type { Quote } from '@/types';

/** Small deterministic PRNG so the daily quote is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledOrder(cycle: number): number[] {
  const rnd = mulberry32(cycle * 7919 + 17);
  const order = QUOTES.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * One new quote per local day. Every quote is shown once per cycle before any repeats,
 * and the first quote of a new cycle never equals the last quote of the previous one.
 */
export function quoteForDay(dayNumber: number, offset = 0): Quote {
  const n = QUOTES.length;
  const d = dayNumber + offset;
  const cycle = Math.floor(d / n);
  const pos = ((d % n) + n) % n;
  const order = shuffledOrder(cycle);
  if (pos === 0) {
    const prevLast = shuffledOrder(cycle - 1)[n - 1];
    if (order[0] === prevLast) [order[0], order[1]] = [order[1], order[0]];
  }
  return QUOTES[order[pos]];
}

export function getQuoteById(id: string): Quote | undefined {
  return QUOTES.find((q) => q.id === id);
}

export async function listFavoriteIds(): Promise<string[]> {
  const rows = await safe(() => db.favoriteQuotes.toArray());
  return rows.map((r) => r.quoteId);
}

export async function toggleFavoriteQuote(quoteId: string, makeFavorite: boolean): Promise<void> {
  if (makeFavorite) await safe(() => db.favoriteQuotes.put({ quoteId, savedAt: Date.now() }));
  else await safe(() => db.favoriteQuotes.delete(quoteId));
}
