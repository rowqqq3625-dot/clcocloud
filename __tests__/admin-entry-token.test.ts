import { describe, it } from "node:test";
import assert from "node:assert";
import { createHash, randomBytes } from "node:crypto";

/**
 * Token lifecycle test — exercises the hashing + expiry logic used by
 * lib/admin/entry.ts without touching Supabase. The "store" is a Map.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

type Challenge = {
  email: string;
  hash: string;
  expiresAt: number;
  consumedAt: number | null;
  passwordPassed: boolean;
};

class FakeStore {
  private byHash = new Map<string, Challenge>();
  insert(c: Challenge) { this.byHash.set(c.hash, c); }
  find(hash: string) { return this.byHash.get(hash); }
}

function createEntryToken(email: string, ttlMs: number, store: FakeStore): string {
  const raw = randomBytes(32).toString("base64url");
  store.insert({
    email,
    hash: hashToken(raw),
    expiresAt: Date.now() + ttlMs,
    consumedAt: null,
    passwordPassed: false,
  });
  return raw;
}

function verifyEntryToken(rawToken: string | undefined, expectedEmail: string | null, store: FakeStore, now = Date.now()): Challenge | null {
  if (!rawToken) return null;
  const row = store.find(hashToken(rawToken));
  if (!row) return null;
  if (row.consumedAt) return null;
  if (row.expiresAt <= now) return null;
  if (expectedEmail && row.email.toLowerCase() !== expectedEmail.toLowerCase()) return null;
  return row;
}

describe("admin entry token", () => {
  it("issues a fresh token and verifies it", () => {
    const store = new FakeStore();
    const token = createEntryToken("gimjeonghugimk@gmail.com", 5 * 60_000, store);
    const challenge = verifyEntryToken(token, "gimjeonghugimk@gmail.com", store);
    assert.ok(challenge);
    assert.strictEqual(challenge!.passwordPassed, false);
  });

  it("rejects an expired token", () => {
    const store = new FakeStore();
    const token = createEntryToken("a@b.com", 1, store);
    const challenge = verifyEntryToken(token, "a@b.com", store, Date.now() + 10_000);
    assert.strictEqual(challenge, null);
  });

  it("rejects a wrong-email mismatch", () => {
    const store = new FakeStore();
    const token = createEntryToken("a@b.com", 5 * 60_000, store);
    assert.strictEqual(verifyEntryToken(token, "other@b.com", store), null);
  });

  it("rejects a token absent from the store", () => {
    const store = new FakeStore();
    assert.strictEqual(verifyEntryToken("forged-token-value", null, store), null);
  });

  it("rejects an already-consumed token", () => {
    const store = new FakeStore();
    const token = createEntryToken("a@b.com", 5 * 60_000, store);
    const c = verifyEntryToken(token, "a@b.com", store)!;
    c.consumedAt = Date.now();
    assert.strictEqual(verifyEntryToken(token, "a@b.com", store), null);
  });

  it("hashes the token deterministically (so store lookup is repeatable)", () => {
    assert.strictEqual(hashToken("aaaa"), hashToken("aaaa"));
    assert.notStrictEqual(hashToken("aaaa"), hashToken("aaab"));
  });
});
