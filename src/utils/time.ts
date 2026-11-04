import { MS_DAY, MS_HOUR, MS_MINUTE, MS_SECOND } from '@/data/constants';

export interface DurationParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Split a millisecond duration into whole d/h/m/s. Negative values clamp to 0. */
export function splitDuration(ms: number): DurationParts {
  const t = Math.max(0, Math.floor(ms));
  return {
    days: Math.floor(t / MS_DAY),
    hours: Math.floor((t % MS_DAY) / MS_HOUR),
    minutes: Math.floor((t % MS_HOUR) / MS_MINUTE),
    seconds: Math.floor((t % MS_MINUTE) / MS_SECOND),
  };
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** "3d 4h 12m" style label (largest two relevant units). */
export function formatDurationShort(ms: number): string {
  const { days, hours, minutes, seconds } = splitDuration(ms);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

/** Long label: "2 days, 3 hours". */
export function formatDurationLong(ms: number): string {
  const { days, hours, minutes } = splitDuration(ms);
  const parts: string[] = [];
  if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (!days && minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  return parts.length ? parts.join(', ') : 'less than a minute';
}

export function daysFromMs(ms: number): number {
  return Math.max(0, ms) / MS_DAY;
}

export function formatDate(ts: number, withTime = false): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** Convert epoch ms to the value format used by <input type="datetime-local"> (local time). */
export function toDateTimeLocal(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Parse <input type="datetime-local"> value as local time. Returns null when invalid. */
export function fromDateTimeLocal(value: string): number | null {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

/** Day index since epoch in local time – used for stable "quote of the day". */
export function localDayNumber(ts = Date.now()): number {
  const d = new Date(ts);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS_DAY);
}

export function greetingFor(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return 'Still up? Stay strong';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}
