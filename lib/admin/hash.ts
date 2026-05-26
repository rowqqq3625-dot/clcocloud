import "server-only";
import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "crypto";

// scrypt parameters: N=2^17 (~128MB), r=8, p=1, output 64 bytes
const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;

const HASH_PREFIX = `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$`;

export function scryptHash(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return `${HASH_PREFIX}${salt.toString("base64")}$${derived.toString("base64")}`;
}

/**
 * Verifies a plain value against a stored scrypt hash. Returns false on any
 * malformed input. Uses constant-time comparison.
 */
export function verifyScrypt(plain: string, stored: string | undefined | null): boolean {
  if (!stored || !stored.startsWith(HASH_PREFIX)) return false;
  const remainder = stored.slice(HASH_PREFIX.length);
  const parts = remainder.split("$");
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;
  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltB64, "base64");
    expected = Buffer.from(hashB64, "base64");
  } catch {
    return false;
  }
  if (expected.length !== SCRYPT_KEYLEN) return false;
  let derived: Buffer;
  try {
    derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
      N: SCRYPT_N,
      r: SCRYPT_R,
      p: SCRYPT_P,
      maxmem: SCRYPT_MAXMEM,
    });
  } catch {
    return false;
  }
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * Deterministic hex SHA-256, used for indexable lookups of tokens / UAs that
 * must never be compared as plaintext.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function hashUserAgent(ua: string | null | undefined): string | null {
  if (!ua) return null;
  return createHash("sha256").update(ua).digest("hex");
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hmacSign(value: string, secret: string): string {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function hmacVerify(value: string, signature: string, secret: string): boolean {
  const expected = hmacSign(value, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
