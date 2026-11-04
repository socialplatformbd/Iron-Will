import { CURRENCIES } from '@/data/constants';

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code;
}

export function formatMoney(amount: number, code: string): string {
  const symbol = currencySymbol(code);
  const zeroDecimals = code === 'JPY';
  const value = amount.toLocaleString(undefined, {
    minimumFractionDigits: zeroDecimals ? 0 : amount >= 1000 ? 0 : 2,
    maximumFractionDigits: zeroDecimals ? 0 : amount >= 1000 ? 0 : 2,
  });
  return `${symbol}${value}`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
