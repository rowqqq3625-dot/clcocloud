import "server-only";
import { createHash } from "node:crypto";

// SHA-256 hex 지문 — DB partial UNIQUE 와 동일 알고리즘.
export function computeFingerprint(keyValue: string): string {
  return createHash("sha256").update(keyValue, "utf8").digest("hex");
}

// 목록 표시용 마스킹 — "앞8...뒤4"
// DB 의 key_preview 컬럼과 일치해야 한다.
export function computePreview(keyValue: string): string {
  const trimmed = keyValue.trim();
  if (trimmed.length <= 12) {
    return `${trimmed.slice(0, 4)}...${trimmed.slice(-2)}`;
  }
  return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
}

// 자판기에 등록 가능한 API 키 형식 검증.
// 너무 엄격하지 않게 — 길이와 공백만 검사.
const MIN_KEY_LEN = 16;
const MAX_KEY_LEN = 512;

export function isValidKeyFormat(raw: string): boolean {
  if (typeof raw !== "string") return false;
  const v = raw.trim();
  if (v.length < MIN_KEY_LEN || v.length > MAX_KEY_LEN) return false;
  if (/\s/.test(v)) return false;
  return true;
}

// 대량 등록 텍스트 박스 입력 파싱.
// 한 줄당 1키, 공백·빈 줄·중복은 제거.
export function parseBulkText(input: string, max: number): {
  keys: Array<{ line: number; key: string }>;
  skipped: Array<{ line: number; raw: string; reason: string }>;
} {
  const lines = input.split(/\r?\n/);
  const seen = new Set<string>();
  const keys: Array<{ line: number; key: string }> = [];
  const skipped: Array<{ line: number; raw: string; reason: string }> = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (keys.length >= max) {
      skipped.push({ line: i + 1, raw: trimmed, reason: `max ${max} exceeded` });
      continue;
    }
    if (!isValidKeyFormat(trimmed)) {
      skipped.push({ line: i + 1, raw: trimmed, reason: "invalid_format" });
      continue;
    }
    if (seen.has(trimmed)) {
      skipped.push({ line: i + 1, raw: trimmed, reason: "duplicate_in_input" });
      continue;
    }
    seen.add(trimmed);
    keys.push({ line: i + 1, key: trimmed });
  }
  return { keys, skipped };
}

// 미니멀 CSV 파서 — RFC4180 따옴표/쉼표/줄바꿈 지원.
// 외부 의존성 회피. 테이블 헤더는 첫 행으로 가정한다.
export function parseCsv(input: string): {
  headers: string[];
  rows: Array<Record<string, string>>;
} {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === "\"") {
        if (input[i + 1] === "\"") {
          field += "\"";
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === "\"") {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (ch === "\r") continue;
    if (ch === "\n") {
      row.push(field);
      records.push(row);
      row = [];
      field = "";
      continue;
    }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push(row);
  }

  if (records.length === 0) return { headers: [], rows: [] };
  const headers = records[0].map((h) => h.trim().toLowerCase());
  const rows: Array<Record<string, string>> = [];
  for (let r = 1; r < records.length; r++) {
    const cells = records[r];
    if (cells.every((c) => c.trim() === "")) continue;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cells[c] ?? "").trim();
    }
    rows.push(obj);
  }
  return { headers, rows };
}

export function getLowStockThreshold(): number {
  const raw = process.env.VENDING_LOW_STOCK_THRESHOLD;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 5;
}

export function getBulkMax(): number {
  const raw = process.env.VENDING_BULK_MAX;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 500;
}
