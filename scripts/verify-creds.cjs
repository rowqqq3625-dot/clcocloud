/**
 * Standalone credential verifier. Reads ADMIN_*_HASH from .env.local and
 * tests them against the plaintext passed via env vars. Outputs only
 * boolean results — plaintexts never echoed back.
 *
 * Usage:
 *   ID=... PW=... node scripts/verify-creds.cjs
 */
require("dotenv").config({ path: ".env.local" });
const { scryptSync, timingSafeEqual } = require("node:crypto");

function verify(plain, stored) {
  if (!stored) return false;
  const m = stored.match(/^scrypt\$N=(\d+),r=(\d+),p=(\d+)\$([A-Za-z0-9+/=]+)\$([A-Za-z0-9+/=]+)$/);
  if (!m) return false;
  const [, N, r, p, saltB, derivedB] = m;
  const salt = Buffer.from(saltB, "base64");
  const expected = Buffer.from(derivedB, "base64");
  const got = scryptSync(plain.normalize("NFKC"), salt, expected.length, {
    N: +N, r: +r, p: +p, maxmem: 256 * 1024 * 1024,
  });
  if (got.length !== expected.length) return false;
  return timingSafeEqual(got, expected);
}

const id = process.env.ID;
const pw = process.env.PW;

console.log("ADMIN_LOGIN_ID_HASH prefix:", (process.env.ADMIN_LOGIN_ID_HASH || "").slice(0, 35));
console.log("ADMIN_PASSWORD_HASH prefix:", (process.env.ADMIN_PASSWORD_HASH || "").slice(0, 35));
console.log();
if (id) console.log("ID match:", verify(id, process.env.ADMIN_LOGIN_ID_HASH));
if (pw) console.log("PW match:", verify(pw, process.env.ADMIN_PASSWORD_HASH));
