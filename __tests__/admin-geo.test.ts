import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Mirrors lib/admin/geo.ts header parsing + isKoreaRequest.
 * Re-implements inline so the test runs without server-only imports.
 */
function getCountryFromRequest(headers: Headers): string | null {
  for (const name of ["x-vercel-ip-country", "cf-ipcountry"]) {
    const raw = headers.get(name);
    if (raw && raw.trim()) return raw.trim().toUpperCase();
  }
  return null;
}

function isKoreaRequest(headers: Headers, failClosed = true): boolean {
  const country = getCountryFromRequest(headers);
  if (country === "KR") return true;
  if (country) return false;
  return !failClosed;
}

describe("admin geo: country header parsing", () => {
  it("reads x-vercel-ip-country", () => {
    const h = new Headers({ "x-vercel-ip-country": "kr" });
    assert.strictEqual(getCountryFromRequest(h), "KR");
    assert.strictEqual(isKoreaRequest(h), true);
  });

  it("falls back to cf-ipcountry", () => {
    const h = new Headers({ "cf-ipcountry": "JP" });
    assert.strictEqual(getCountryFromRequest(h), "JP");
    assert.strictEqual(isKoreaRequest(h), false);
  });

  it("prefers vercel header over cloudflare", () => {
    const h = new Headers({ "x-vercel-ip-country": "KR", "cf-ipcountry": "US" });
    assert.strictEqual(getCountryFromRequest(h), "KR");
    assert.strictEqual(isKoreaRequest(h), true);
  });

  it("fail-closed when no country header present", () => {
    const h = new Headers();
    assert.strictEqual(getCountryFromRequest(h), null);
    assert.strictEqual(isKoreaRequest(h, true), false);
    assert.strictEqual(isKoreaRequest(h, false), true);
  });
});
