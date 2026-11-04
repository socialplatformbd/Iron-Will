/**
 * Sanitise free-text user input before it is stored.
 * React already escapes output; this additionally strips markup and control characters
 * so exported/imported backups never carry executable content.
 */
export function sanitizeText(input: unknown, maxLength = 200): string {
  if (typeof input !== 'string') return '';
  return input
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

/** Parse a non-negative money amount from user input. Returns 0 for anything invalid. */
export function parseMoney(input: unknown): number {
  const n = typeof input === 'number' ? input : parseFloat(String(input).replace(/,/g, '.'));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.round(n * 100) / 100, 1_000_000);
}

/**
 * Like sanitizeText, but keeps line breaks (journal notes use them).
 * Strips markup and control characters, limits consecutive blank lines.
 */
export function sanitizeMultiline(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\r\n?/g, '\n')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}
