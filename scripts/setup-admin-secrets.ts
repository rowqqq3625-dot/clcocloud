/**
 * One-shot admin secret setup: generates the four required hashes and
 * patches them into .env.local in the current working directory.
 *
 * Usage:
 *   npx tsx scripts/setup-admin-secrets.ts <loginId> <password>
 *
 * - Generates ADMIN_LOGIN_ID_HASH and ADMIN_PASSWORD_HASH for the given creds.
 * - Generates ADMIN_COOKIE_SECRET and ADMIN_CSRF_SECRET only if they're empty
 *   in .env.local (preserves existing values).
 * - Updates existing `KEY=` lines in place. Appends if the key is missing.
 * - Never echoes plaintext.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;
const HASH_PREFIX = `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$`;

function scryptHash(plain: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return `${HASH_PREFIX}${salt.toString("base64")}$${derived.toString("base64")}`;
}

const [, , loginId, password] = process.argv;
if (!loginId || !password) {
  console.error("Usage: npx tsx scripts/setup-admin-secrets.ts <loginId> <password>");
  process.exit(1);
}
if (password.length < 8) {
  console.error("비밀번호는 8자 이상이어야 합니다.");
  process.exit(1);
}
if (password.length < 12) {
  console.warn("⚠️  비밀번호가 12자 미만입니다. 운영 배포 전 반드시 강한 비밀번호로 교체하세요.");
}

const envPath = resolve(process.cwd(), ".env.local");
const exists = existsSync(envPath);
const original = exists ? readFileSync(envPath, "utf8") : "";

function currentValue(content: string, key: string): string | null {
  const re = new RegExp(`^${key}=(.*)$`, "m");
  const match = content.match(re);
  return match ? match[1] : null;
}

function upsert(content: string, key: string, value: string): string {
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, `${key}=${value}`);
  const sep = content.length === 0 || content.endsWith("\n") ? "" : "\n";
  return `${content}${sep}${key}=${value}\n`;
}

const newLoginHash = scryptHash(loginId);
const newPasswordHash = scryptHash(password);

const existingCookie = currentValue(original, "ADMIN_COOKIE_SECRET");
const existingCsrf = currentValue(original, "ADMIN_CSRF_SECRET");
const nextCookieSecret = existingCookie && existingCookie.length > 0
  ? existingCookie
  : randomBytes(32).toString("base64");
const nextCsrfSecret = existingCsrf && existingCsrf.length > 0
  ? existingCsrf
  : randomBytes(32).toString("base64");

let next = original;
next = upsert(next, "ADMIN_LOGIN_ID_HASH", newLoginHash);
next = upsert(next, "ADMIN_PASSWORD_HASH", newPasswordHash);
next = upsert(next, "ADMIN_COOKIE_SECRET", nextCookieSecret);
next = upsert(next, "ADMIN_CSRF_SECRET", nextCsrfSecret);

writeFileSync(envPath, next, "utf8");

console.log(`✅ ${envPath} 갱신 완료`);
console.log(`   ADMIN_LOGIN_ID_HASH    ${exists && currentValue(original, "ADMIN_LOGIN_ID_HASH") ? "updated" : "added"}`);
console.log(`   ADMIN_PASSWORD_HASH    ${exists && currentValue(original, "ADMIN_PASSWORD_HASH") ? "updated" : "added"}`);
console.log(`   ADMIN_COOKIE_SECRET    ${existingCookie ? "preserved" : "generated"}`);
console.log(`   ADMIN_CSRF_SECRET      ${existingCsrf ? "preserved" : "generated"}`);
console.log("\n다음 단계:");
console.log("  1. dev 서버 종료 (Ctrl+C) 후 npm run dev 재시작");
console.log("  2. localhost:3001 → 로그인 → 프로필 → 관리자 페이지");
console.log("  3. 방금 입력한 ID/비밀번호 + 오늘 MMDD 4자리");
