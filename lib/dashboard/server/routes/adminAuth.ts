import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

const ADMIN_COOKIE = 'gudokpin_admin_session';
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;
const DEFAULT_ADMIN_CODE_HASH = '32607c374f9730269e9bdefcb06199e399b76a385c3345f0d0fac97069a38f24';

export function verifyAdminCode(code: string): boolean {
  const expectedHash = process.env.ADMIN_DASHBOARD_CODE_HASH;
  const expectedCode = process.env.ADMIN_DASHBOARD_ACCESS_CODE;
  const actualHash = sha256(code);

  if (expectedHash !== undefined && expectedHash !== '') {
    return safeEq(actualHash, expectedHash.trim().toLowerCase());
  }
  if (expectedCode !== undefined && expectedCode !== '') {
    return safeEq(actualHash, sha256(expectedCode));
  }
  return safeEq(actualHash, DEFAULT_ADMIN_CODE_HASH);
}

export function createAdminSessionCookie(now = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  const nonce = randomBytes(16).toString('hex');
  const payload = `${expiresAt}.${nonce}`;
  const signature = sign(payload);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${ADMIN_COOKIE}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure}`;
}

export function clearAdminSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function hasValidAdminSession(cookieHeader: string | undefined, now = Date.now()): boolean {
  const raw = cookieValue(cookieHeader, ADMIN_COOKIE);
  if (raw === null) {
    return false;
  }

  const parts = raw.split('.');
  if (parts.length !== 3) {
    return false;
  }

  const [expiresRaw, nonce, signature] = parts;
  if (expiresRaw === undefined || nonce === undefined || signature === undefined) {
    return false;
  }

  const expiresAt = Number(expiresRaw);
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }

  return safeEq(signature, sign(`${expiresRaw}.${nonce}`));
}

function cookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (cookieHeader === undefined || cookieHeader === '') {
    return null;
  }

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...valueParts] = part.trim().split('=');
    if (rawName === name) {
      return valueParts.join('=');
    }
  }
  return null;
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('hex');
}

function sessionSecret(): string {
  const explicit = process.env.ADMIN_DASHBOARD_SESSION_SECRET;
  if (explicit !== undefined && explicit !== '') {
    return explicit;
  }

  const hash = process.env.ADMIN_DASHBOARD_CODE_HASH;
  if (hash !== undefined && hash !== '') {
    return hash;
  }

  const code = process.env.ADMIN_DASHBOARD_ACCESS_CODE;
  return code !== undefined && code !== '' ? sha256(code) : DEFAULT_ADMIN_CODE_HASH;
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEq(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
