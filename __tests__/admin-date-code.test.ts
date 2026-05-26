import { describe, it } from "node:test";
import assert from "node:assert";

/**
 * MMDD KST date code tests.
 *
 * Mirrors lib/admin/date-code.ts:getTodayAdminDateCode without importing
 * server-only modules so the test runs under plain `node --test` with a TS
 * loader.
 */
function getTodayAdminDateCode(timezone: string, now: Date): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!month || !day) throw new Error("format failed");
  return `${month}${day}`;
}

describe("admin date code (Asia/Seoul MMDD)", () => {
  it("formats 2026-05-26 as 0526 in KST", () => {
    // 2026-05-26T03:00:00Z is 2026-05-26 12:00:00 KST.
    const at = new Date(Date.UTC(2026, 4, 26, 3, 0, 0));
    assert.strictEqual(getTodayAdminDateCode("Asia/Seoul", at), "0526");
  });

  it("formats 2026-01-03 as 0103 in KST", () => {
    const at = new Date(Date.UTC(2026, 0, 3, 6, 0, 0));
    assert.strictEqual(getTodayAdminDateCode("Asia/Seoul", at), "0103");
  });

  it("formats 2026-12-31 as 1231 in KST", () => {
    const at = new Date(Date.UTC(2026, 11, 31, 6, 0, 0));
    assert.strictEqual(getTodayAdminDateCode("Asia/Seoul", at), "1231");
  });

  it("rolls over to next KST day for late-UTC timestamps", () => {
    // 2026-05-26T15:30:00Z = 2026-05-27 00:30 KST.
    const at = new Date(Date.UTC(2026, 4, 26, 15, 30, 0));
    assert.strictEqual(getTodayAdminDateCode("Asia/Seoul", at), "0527");
  });

  it("strict 4-digit regex matches MMDD and rejects others", () => {
    const re = /^\d{4}$/;
    assert.strictEqual(re.test("0526"), true);
    assert.strictEqual(re.test("1231"), true);
    assert.strictEqual(re.test("12-31"), false);
    assert.strictEqual(re.test("12345"), false);
    assert.strictEqual(re.test(""), false);
  });
});
