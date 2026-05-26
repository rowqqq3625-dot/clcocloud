/**
 * Generate ADMIN_LOGIN_ID_HASH and ADMIN_PASSWORD_HASH values for .env.
 *
 * Usage: npx tsx scripts/create-admin-secrets.ts
 *
 * The script never logs the plaintext inputs and disables stdin echo for the
 * password field. The hashes use Node's built-in scrypt — same parameters as
 * lib/admin/hash.ts.
 */
import { scryptSync, randomBytes } from "node:crypto";
import readline from "node:readline";

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

function ask(prompt: string, hidden: boolean): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      const stdinAny = process.stdin as NodeJS.ReadStream & { setRawMode?: (mode: boolean) => void };
      if (stdinAny.setRawMode) stdinAny.setRawMode(true);
      process.stdout.write(prompt);
      let value = "";
      const onData = (chunk: Buffer) => {
        const str = chunk.toString("utf8");
        for (const ch of str) {
          const code = ch.charCodeAt(0);
          if (code === 0x03) {
            process.stdout.write("\n");
            if (stdinAny.setRawMode) stdinAny.setRawMode(false);
            process.exit(130);
          }
          if (code === 0x0d || code === 0x0a) {
            process.stdout.write("\n");
            if (stdinAny.setRawMode) stdinAny.setRawMode(false);
            process.stdin.removeListener("data", onData);
            rl.close();
            resolve(value);
            return;
          }
          if (code === 0x7f || code === 0x08) {
            value = value.slice(0, -1);
            continue;
          }
          if (code >= 0x20) {
            value += ch;
          }
        }
      };
      process.stdin.on("data", onData);
    } else {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  const loginId = (await ask("Admin login id: ", false)).trim();
  if (!loginId) {
    console.error("Login id is required.");
    process.exit(1);
  }
  const password = await ask("Admin password (input hidden): ", true);
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const confirm = await ask("Confirm password (input hidden): ", true);
  if (password !== confirm) {
    console.error("Passwords do not match.");
    process.exit(1);
  }
  const adminCookieSecret = randomBytes(32).toString("base64");
  const adminCsrfSecret = randomBytes(32).toString("base64");

  process.stdout.write("\n--- Paste into .env ---\n");
  process.stdout.write(`ADMIN_LOGIN_ID_HASH=${scryptHash(loginId)}\n`);
  process.stdout.write(`ADMIN_PASSWORD_HASH=${scryptHash(password)}\n`);
  process.stdout.write(`ADMIN_COOKIE_SECRET=${adminCookieSecret}\n`);
  process.stdout.write(`ADMIN_CSRF_SECRET=${adminCsrfSecret}\n`);
  process.stdout.write("--- end ---\n");
  process.stdout.write("Plaintext is NOT echoed. If you forget the credentials, regenerate.\n");
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
