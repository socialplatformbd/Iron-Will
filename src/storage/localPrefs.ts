import type { AccentId, LocalPrefs, ThemeMode } from '@/types';

const KEY = 'ironwill:prefs';

export const DEFAULT_PREFS: LocalPrefs = {
  theme: 'dark',
  accent: 'forge',
  welcomeSeen: false,
  communityDismissedAt: null,
};

const THEMES: ThemeMode[] = ['dark', 'light'];
const ACCENT_IDS: AccentId[] = ['forge', 'emerald', 'sky', 'violet', 'rose'];

/** Read lightweight preferences from localStorage (safe against corrupt / blocked storage). */
export function loadPrefs(): LocalPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const p = JSON.parse(raw) as Partial<LocalPrefs>;
    return {
      theme: THEMES.includes(p.theme as ThemeMode) ? (p.theme as ThemeMode) : 'dark',
      accent: ACCENT_IDS.includes(p.accent as AccentId) ? (p.accent as AccentId) : 'forge',
      welcomeSeen: p.welcomeSeen === true,
      communityDismissedAt: typeof p.communityDismissedAt === 'number' ? p.communityDismissedAt : null,
      lastQuoteSeen: typeof p.lastQuoteSeen === 'string' ? p.lastQuoteSeen : undefined,
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: LocalPrefs): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function clearPrefs() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** Apply theme/accent to the document and the browser UI colour. */
export function applyTheme(theme: ThemeMode, accent: AccentId) {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.setAttribute('data-accent', accent);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f5f2' : '#0a0a0f');
}

/** Sanitise an imported prefs object. */
export function sanitizePrefs(input: unknown): Partial<LocalPrefs> {
  if (!input || typeof input !== 'object') return {};
  const p = input as Record<string, unknown>;
  const out: Partial<LocalPrefs> = {};
  if (THEMES.includes(p.theme as ThemeMode)) out.theme = p.theme as ThemeMode;
  if (ACCENT_IDS.includes(p.accent as AccentId)) out.accent = p.accent as AccentId;
  return out;
}
