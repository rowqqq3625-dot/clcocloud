/**
 * Loads .env.local using Next.js's own env loader and verifies that the
 * scrypt hash $ separators survive the load (i.e. dotenv expansion is
 * properly disabled by single-quote wrapping).
 *
 * Usage: npx tsx scripts/verify-next-env.ts
 *
 * Run from a directory containing .env.local.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const loginHash = process.env.ADMIN_LOGIN_ID_HASH || "";
const pwHash = process.env.ADMIN_PASSWORD_HASH || "";

const EXPECTED_PREFIX = "scrypt$N=131072,r=8,p=1$";

function check(name: string, value: string) {
  console.log(`\n[${name}]`);
  console.log(`  loaded length: ${value.length}`);
  console.log(`  prefix (first 30): ${JSON.stringify(value.slice(0, 30))}`);
  console.log(`  $ count: ${(value.match(/\$/g) || []).length} (expected 3)`);
  console.log(`  starts with expected prefix: ${value.startsWith(EXPECTED_PREFIX) ? "✅" : "❌"}`);
}

check("ADMIN_LOGIN_ID_HASH", loginHash);
check("ADMIN_PASSWORD_HASH", pwHash);

const ok = loginHash.startsWith(EXPECTED_PREFIX) && pwHash.startsWith(EXPECTED_PREFIX);
if (ok) {
  console.log("\n✅ Next.js env loader preserved $ separators. Hashes should verify correctly.");
} else {
  console.log("\n❌ Next.js env loader corrupted the hash. $-expansion still active.");
  console.log("   Open .env.local and ensure ADMIN_LOGIN_ID_HASH and ADMIN_PASSWORD_HASH");
  console.log("   are wrapped in SINGLE quotes, e.g.:");
  console.log("     ADMIN_LOGIN_ID_HASH='scrypt$N=131072,r=8,p=1$xxxx$yyyy'");
  process.exit(1);
}
