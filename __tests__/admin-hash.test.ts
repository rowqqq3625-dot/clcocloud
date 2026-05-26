import { describe, it } from "node:test";
import assert from "node:assert";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

// Mirror of lib/admin/hash.ts parameters.
const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;
const PREFIX = `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$`;

function scryptHash(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM,
  });
  return `${PREFIX}${salt.toString("base64")}$${derived.toString("base64")}`;
}

function verifyScrypt(plain: string, stored: string | null | undefined): boolean {
  if (!stored || !stored.startsWith(PREFIX)) return false;
  const remainder = stored.slice(PREFIX.length);
  const parts = remainder.split("$");
  if (parts.length !== 2) return false;
  const [saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== SCRYPT_KEYLEN) return false;
  const derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: SCRYPT_MAXMEM,
  });
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

describe("admin scrypt hash", () => {
  it("round-trips a typical password", () => {
    const hash = scryptHash("clcocloud-admin!");
    assert.strictEqual(verifyScrypt("clcocloud-admin!", hash), true);
  });

  it("rejects an incorrect password", () => {
    const hash = scryptHash("correct horse battery staple");
    assert.strictEqual(verifyScrypt("correct horse battery", hash), false);
    assert.strictEqual(verifyScrypt("", hash), false);
  });

  it("rejects malformed stored values", () => {
    assert.strictEqual(verifyScrypt("anything", ""), false);
    assert.strictEqual(verifyScrypt("anything", "argon2$..."), false);
    assert.strictEqual(verifyScrypt("anything", `${PREFIX}only-one-segment`), false);
    assert.strictEqual(verifyScrypt("anything", null), false);
  });

  it("normalizes NFKC: composed vs decomposed forms verify equally", () => {
    const composed = "비밀번호Å"; // Å (composed)
    const decomposed = "비밀번호Å"; // A + combining ring above
    const hash = scryptHash(composed);
    assert.strictEqual(verifyScrypt(decomposed, hash), true);
  });
});
