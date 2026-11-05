import { BN } from '@/i18n/bn';

export type Lang = 'en' | 'bn';
export const LANGS: Lang[] = ['en', 'bn'];

let current: Lang = 'en';

export function setLanguage(lang: Lang) {
  current = lang;
}

export function getLanguage(): Lang {
  return current;
}

/** Pick the singular or plural English key by count; `{n}` is filled with the count. */
export function trn(n: number, one: string, many: string, vars?: Record<string, string | number>): string {
  return tr(n === 1 ? one : many, { n, ...vars });
}

/** First launch default: Bengali for Bengali browsers, otherwise English. */
export function detectLanguage(): Lang {
  try {
    return (navigator.language || '').toLowerCase().startsWith('bn') ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Translate an English UI string. English text is the lookup key, so a missing
 * translation simply shows the English text. `{name}` placeholders are filled from `vars`.
 */
export function tr(text: string, vars?: Record<string, string | number>): string {
  let out = current === 'bn' ? (BN[text] ?? text) : text;
  if (vars) out = out.replace(/\{(\w+)\}/g, (_m, k: string) => (k in vars ? String(vars[k]) : `{${k}}`));
  return out;
}
