import { createHash } from "crypto";

export interface KeyFingerprint {
  fp_full: string;
  fp16: string;
  last4: string;
}

export function getFingerprint(apiKey: string): KeyFingerprint {
  const trimmed = apiKey.trim();
  const fp_full = createHash("sha256").update(trimmed).digest("hex");
  const fp16 = fp_full.slice(0, 16);
  const last4 = trimmed.slice(-4);
  return { fp_full, fp16, last4 };
}
