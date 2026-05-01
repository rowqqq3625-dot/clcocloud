export function maskDisplayName(value: string) {
  const clean = value.trim().replace(/\s+/g, " ").slice(0, 40);
  if (!clean) return "사용자…";
  const chars = Array.from(clean);
  if (chars.length === 1) return `${chars[0]}…`;
  return `${chars.slice(0, Math.min(2, chars.length)).join("")}…`;
}

export function splitMaskedName(maskedName: string) {
  const clean = maskedName.trim() || "사용자…";
  if (!clean.endsWith("…")) return { visible: clean, blurred: "" };
  return { visible: clean.slice(0, -1), blurred: "…" };
}
