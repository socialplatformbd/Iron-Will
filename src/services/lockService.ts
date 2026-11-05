import { tr } from '@/i18n';

/**
 * Optional PIN lock. The PIN is never stored: only a salted PBKDF2 hash is kept in localStorage
 * (separate from preferences, so it is never part of a JSON backup).
 *
 * This is a privacy screen against casual snooping, not encryption of the stored data.
 */

const KEY = 'ironwill:lock';
const ITERATIONS = 120_000;
const FREE_ATTEMPTS = 5;
const BASE_COOLDOWN_MS = 30_000;
const MAX_COOLDOWN_MS = 15 * 60_000;
const PIN_RE = /^\d{4,6}$/;

export const AUTO_LOCK_OPTIONS = [0, 30, 60, 300] as const;
export const DEFAULT_AUTO_LOCK_SEC = 60;

interface LockRecord {
  v: 1;
  salt: string;
  hash: string;
  iter: number;
  len: number;
  autoLockSec: number;
  fails: number;
  lockedUntil: number;
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'wrong'; attemptsLeft: number }
  | { ok: false; reason: 'cooldown'; waitMs: number }
  | { ok: false; reason: 'none' };

export interface LockInfo {
  enabled: boolean;
  len: number;
  autoLockSec: number;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function read(): LockRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Partial<LockRecord>;
    if (r.v !== 1 || typeof r.salt !== 'string' || typeof r.hash !== 'string' || !isNum(r.iter) || !isNum(r.len)) return null;
    return {
      v: 1,
      salt: r.salt,
      hash: r.hash,
      iter: r.iter,
      len: r.len,
      autoLockSec: isNum(r.autoLockSec) ? r.autoLockSec : DEFAULT_AUTO_LOCK_SEC,
      fails: isNum(r.fails) ? Math.max(0, Math.floor(r.fails)) : 0,
      lockedUntil: isNum(r.lockedUntil) ? r.lockedUntil : 0,
    };
  } catch {
    return null;
  }
}

function write(r: LockRecord): void {
  localStorage.setItem(KEY, JSON.stringify(r));
}

const toB64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pin: string, salt: Uint8Array, iter: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, key, 256);
  return toB64(new Uint8Array(bits));
}

function sameString(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function hasPin(): boolean {
  return read() !== null;
}

export function getLockInfo(): LockInfo {
  const r = read();
  return r ? { enabled: true, len: r.len, autoLockSec: r.autoLockSec } : { enabled: false, len: 0, autoLockSec: DEFAULT_AUTO_LOCK_SEC };
}

/** PIN hashing needs the Web Crypto API, which browsers only provide on secure (HTTPS) pages. */
export function isLockSupported(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof localStorage !== 'undefined';
}

export function isValidPinFormat(pin: string): boolean {
  return PIN_RE.test(pin);
}

export async function setPin(pin: string, autoLockSec: number = DEFAULT_AUTO_LOCK_SEC): Promise<void> {
  if (!isLockSupported()) throw new Error(tr('PIN lock needs a secure (HTTPS) connection.'));
  if (!isValidPinFormat(pin)) throw new Error(tr('Use 4 to 6 digits.'));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(pin, salt, ITERATIONS);
  write({
    v: 1,
    salt: toB64(salt),
    hash,
    iter: ITERATIONS,
    len: pin.length,
    autoLockSec: (AUTO_LOCK_OPTIONS as readonly number[]).includes(autoLockSec) ? autoLockSec : DEFAULT_AUTO_LOCK_SEC,
    fails: 0,
    lockedUntil: 0,
  });
}

export async function verifyPin(pin: string, now: number = Date.now()): Promise<VerifyResult> {
  const r = read();
  if (!r) return { ok: false, reason: 'none' };
  if (r.lockedUntil > now) return { ok: false, reason: 'cooldown', waitMs: r.lockedUntil - now };
  let match = false;
  try {
    match = isValidPinFormat(pin) && sameString(await derive(pin, fromB64(r.salt), r.iter), r.hash);
  } catch {
    match = false;
  }
  if (match) {
    if (r.fails !== 0 || r.lockedUntil !== 0) write({ ...r, fails: 0, lockedUntil: 0 });
    return { ok: true };
  }
  const fails = r.fails + 1;
  if (fails >= FREE_ATTEMPTS) {
    const wait = Math.min(MAX_COOLDOWN_MS, BASE_COOLDOWN_MS * 2 ** (fails - FREE_ATTEMPTS));
    write({ ...r, fails, lockedUntil: now + wait });
    return { ok: false, reason: 'cooldown', waitMs: wait };
  }
  write({ ...r, fails });
  return { ok: false, reason: 'wrong', attemptsLeft: FREE_ATTEMPTS - fails };
}

export async function changePin(oldPin: string, newPin: string): Promise<VerifyResult> {
  const check = await verifyPin(oldPin);
  if (!check.ok) return check;
  await setPin(newPin, getLockInfo().autoLockSec);
  return { ok: true };
}

export async function removePin(pin: string): Promise<VerifyResult> {
  const check = await verifyPin(pin);
  if (!check.ok) return check;
  wipeLock();
  return { ok: true };
}

export function setAutoLock(sec: number): void {
  const r = read();
  if (r && (AUTO_LOCK_OPTIONS as readonly number[]).includes(sec)) write({ ...r, autoLockSec: sec });
}

/** Remove the lock without a PIN. Only used together with erasing all data ("Forgot PIN"). */
export function wipeLock(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to remove */
  }
}
