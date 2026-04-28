import { centerEllipsis } from "@/lib/text-utils";

type PriceProps = {
  value: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
};

export function Price({
  value,
  prefix = "",
  suffix = "",
  className = "",
  compact = false
}: PriceProps) {
  const raw = typeof value === "number" ? `${value}` : value;
  const safe = compact ? centerEllipsis(raw, 16) : raw;
  const [integerPart, decimalPart = ""] = safe.split(".");

  return (
    <span className={`tabular-nums whitespace-nowrap ${className}`}>
      {prefix ? <span className="align-top text-[0.72em] tracking-[0.05em] opacity-70">{prefix}</span> : null}
      <span>{integerPart}</span>
      {decimalPart ? <span className="text-[0.72em] opacity-70">.{decimalPart}</span> : null}
      {suffix ? <span>{suffix}</span> : null}
    </span>
  );
}
