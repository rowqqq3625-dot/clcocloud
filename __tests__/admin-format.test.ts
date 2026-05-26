import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * Mirrors lib/admin/format.ts pure functions without importing server-only.
 */

// Mirrors lib/admin/format.ts — operator policy is FULL VISIBILITY of PII
// inside the admin console. These helpers no longer mask, but they retain
// their original names to avoid churning every call site.

function maskEmail(input: string | null | undefined): string {
  if (!input) return "—";
  return input;
}

function maskPhone(input: string | null | undefined): string {
  if (!input) return "—";
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  return input;
}

function maskName(input: string | null | undefined): string {
  if (!input) return "—";
  return input.trim();
}

function formatKrw(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₩${Math.trunc(value).toLocaleString("ko-KR")}`;
}

function getKstDayBounds(timezone: string, now: Date): { startIso: string; endIso: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const hh = Number(parts.find((p) => p.type === "hour")?.value);
  const mm = Number(parts.find((p) => p.type === "minute")?.value);
  const ss = Number(parts.find((p) => p.type === "second")?.value);
  const utcMillis = now.getTime();
  const localMillis = Date.UTC(y, m - 1, d, hh, mm, ss);
  const tzOffsetMillis = localMillis - utcMillis;
  const startMillis = Date.UTC(y, m - 1, d, 0, 0, 0) - tzOffsetMillis;
  const endMillis = startMillis + 24 * 60 * 60 * 1000;
  return { startIso: new Date(startMillis).toISOString(), endIso: new Date(endMillis).toISOString() };
}

describe("admin format helpers (no masking — full visibility policy)", () => {
  it("returns the raw email as-is", () => {
    assert.strictEqual(maskEmail("clcocloud@example.com"), "clcocloud@example.com");
    assert.strictEqual(maskEmail("a@b.com"), "a@b.com");
    assert.strictEqual(maskEmail(null), "—");
    assert.strictEqual(maskEmail("noatsign"), "noatsign");
  });

  it("formats KR phone numbers without hiding any digits", () => {
    assert.strictEqual(maskPhone("010-1234-5678"), "010-1234-5678");
    assert.strictEqual(maskPhone("01012345678"), "010-1234-5678");
    assert.strictEqual(maskPhone("0212345678"), "02-1234-5678");
    assert.strictEqual(maskPhone("0312345678"), "031-234-5678");
    assert.strictEqual(maskPhone(null), "—");
    assert.strictEqual(maskPhone("12"), "12");
  });

  it("returns the raw name (trimmed)", () => {
    assert.strictEqual(maskName("김정후"), "김정후");
    assert.strictEqual(maskName(" A "), "A");
    assert.strictEqual(maskName(""), "—");
    assert.strictEqual(maskName(null), "—");
  });

  it("formats KRW with comma separators", () => {
    assert.strictEqual(formatKrw(0), "₩0");
    assert.strictEqual(formatKrw(1234567), "₩1,234,567");
    assert.strictEqual(formatKrw(null), "—");
  });

  it("computes KST day bounds spanning exactly 24h", () => {
    const at = new Date(Date.UTC(2026, 4, 26, 6, 0, 0)); // 15:00 KST on 2026-05-26
    const { startIso, endIso } = getKstDayBounds("Asia/Seoul", at);
    // KST midnight on 2026-05-26 = UTC 2026-05-25T15:00:00Z
    assert.strictEqual(startIso, "2026-05-25T15:00:00.000Z");
    assert.strictEqual(endIso, "2026-05-26T15:00:00.000Z");
  });
});
