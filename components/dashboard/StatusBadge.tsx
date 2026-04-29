import { getRequestStatusTone } from "@/lib/dashboard-utils";

type StatusBadgeProps = {
  value: string | number;
  kind?: "key" | "request";
};

export function StatusBadge({ value, kind = "request" }: StatusBadgeProps) {
  const tone = kind === "key" ? "success" : getRequestStatusTone(Number(value));
  const styles = {
    success: "border-[#5A8A6B]/25 bg-[rgba(90,138,107,0.12)] text-[#5A8A6B]",
    client: "border-coral/25 bg-coral/10 text-coral",
    server: "border-primary/20 bg-primary/10 text-primary",
    neutral: "border-[var(--border-subtle)] bg-cream-2 text-secondary",
  }[tone];

  return (
    <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] ${styles}`}>
      {value}
    </span>
  );
}
