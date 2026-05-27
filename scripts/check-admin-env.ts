/**
 * Local admin-env health check.
 *
 * Usage: npx tsx scripts/check-admin-env.ts [loginId] [password]
 *
 * - With no arguments: reports which admin env vars are set (no secrets shown).
 * - With loginId+password: verifies them against the stored scrypt hashes.
 *
 * Reads .env.local / .env from the current working directory.
 */
import { scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const SCRYPT_N = 131072;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEYLEN = 64;
const SCRYPT_MAXMEM = 256 * 1024 * 1024;
const HASH_PREFIX = `scrypt$N=${SCRYPT_N},r=${SCRYPT_R},p=${SCRYPT_P}$`;

function loadEnvFile(path: string): void {
  if (!existsSync(path)) return;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    // Unescape `\$` back to `$` (matches dotenv-expand semantics).
    value = value.replace(/\\\$/g, "$");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

function verifyScrypt(plain: string, stored: string | undefined): { ok: boolean; reason?: string } {
  if (!stored) return { ok: false, reason: "stored hash is empty" };
  if (!stored.startsWith(HASH_PREFIX)) return { ok: false, reason: "stored hash has wrong scrypt prefix" };
  const remainder = stored.slice(HASH_PREFIX.length);
  const parts = remainder.split("$");
  if (parts.length !== 2) return { ok: false, reason: "stored hash malformed (missing salt$hash)" };
  const [saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (expected.length !== SCRYPT_KEYLEN) return { ok: false, reason: `expected ${SCRYPT_KEYLEN}-byte hash, got ${expected.length}` };
  const derived = scryptSync(plain.normalize("NFKC"), salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM,
  });
  return { ok: timingSafeEqual(derived, expected) };
}

const REQUIRED = [
  "ADMIN_ALLOWED_EMAILS",
  "ADMIN_LOGIN_ID_HASH",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_COOKIE_SECRET",
  "ADMIN_CSRF_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "AUTH_SESSION_SECRET",
] as const;

const OPTIONAL = [
  "ADMIN_GEO_BYPASS",
  "ADMIN_GEO_FAIL_CLOSED",
  "ADMIN_GATE_PATH",
  "ADMIN_PANEL_PATH",
  "ADMIN_DATE_CODE_TIMEZONE",
  "NODE_ENV",
] as const;

console.log("=== Admin env check ===");
console.log(`cwd: ${process.cwd()}\n`);

console.log("[Required vars]");
let missing = 0;
for (const key of REQUIRED) {
  const value = process.env[key];
  if (!value) {
    console.log(`  MISSING  ${key}`);
    missing += 1;
  } else {
    console.log(`  set      ${key} (len=${value.length})`);
  }
}

console.log("\n[Optional vars / resolved]");
for (const key of OPTIONAL) {
  const value = process.env[key];
  console.log(`  ${key} = ${value ?? "(unset)"}`);
}

const isProduction = process.env.NODE_ENV === "production";
const bypassRaw = process.env.ADMIN_GEO_BYPASS?.toLowerCase();
const bypassResolved = bypassRaw === undefined
  ? !isProduction
  : ["true", "1", "yes"].includes(bypassRaw);
console.log(`\n  → ADMIN_GEO_BYPASS resolves to: ${bypassResolved} (NODE_ENV="${process.env.NODE_ENV ?? "(unset)"}")`);

const emailList = (process.env.ADMIN_ALLOWED_EMAILS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
console.log(`  → ADMIN_ALLOWED_EMAILS count: ${emailList.length}`);
if (emailList.length > 0) {
  console.log("    candidates:");
  for (const e of emailList) console.log(`      - ${e.toLowerCase()}`);
}

const [, , loginId, password] = process.argv;
if (loginId && password) {
  console.log("\n[Credential verification]");
  const idResult = verifyScrypt(loginId, process.env.ADMIN_LOGIN_ID_HASH);
  const pwResult = verifyScrypt(password, process.env.ADMIN_PASSWORD_HASH);
  console.log(`  loginId  ${idResult.ok ? "OK" : `FAIL — ${idResult.reason ?? "mismatch"}`}`);
  console.log(`  password ${pwResult.ok ? "OK" : `FAIL — ${pwResult.reason ?? "mismatch"}`}`);
  if (!idResult.ok || !pwResult.ok) {
    console.log("\n  ↳ ID 또는 비밀번호가 저장된 hash와 일치하지 않습니다.");
    console.log("    npx tsx scripts/create-admin-secrets.ts 로 새 hash를 생성한 뒤");
    console.log("    .env.local 의 ADMIN_LOGIN_ID_HASH / ADMIN_PASSWORD_HASH 를 교체하세요.");
  }
} else {
  console.log("\n[Credential verification]");
  console.log("  자격증명도 확인하려면:");
  console.log("    npx tsx scripts/check-admin-env.ts <loginId> <password>");
}

if (missing > 0) {
  console.log(`\n❌ ${missing} required env var(s) missing. Admin login WILL fail.`);
  process.exit(1);
}
console.log("\n✅ All required admin env vars are set.");
