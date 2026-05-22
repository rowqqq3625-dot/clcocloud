import { centerEllipsis } from "@/lib/text-utils";

type PriceProps = {
  value?: number | string;
  prefix?: string;
  suffix?: string;
  className?: string;
  compact?: boolean;
  krw?: number;
  usd?: number;
};

export function Price({
  value,
  prefix = "",
  suffix = "",
  className = "",
  compact = false,
  krw,
  usd,
}: PriceProps) {
  if (krw !== undefined) {
    const formattedKrw = new Intl.NumberFormat("ko-KR").format(krw);
    const formattedUsd = usd !== undefined ? new Intl.NumberFormat("en-US").format(usd) : null;

    return (
      <span className={`flex items-baseline gap-2 tabular-nums whitespace-nowrap ${className}`}>
        <span className="font-bold text-ink-100">
          ₩{formattedKrw}
        </span>
        {formattedUsd !== null && (
          <span className="font-mono text-[13px] text-ink-65">
            ≈ ${formattedUsd}
          </span>
        )}
      </span>
    );
  }

  const raw = typeof value === "number" ? `${value}` : (value || "");
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
