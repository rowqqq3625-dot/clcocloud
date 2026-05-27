import type { ComparisonCellData, ComparisonTier } from "@/lib/data/comparison";

interface TierStyle {
  icon: string;
  iconLabel: string;
  iconClass: string;
  textClass: string;
}

const TIER_STYLES: Record<ComparisonTier, TierStyle> = {
  good: {
    icon: "✓",
    iconLabel: "우수",
    iconClass: "text-coral",
    textClass: "text-cream",
  },
  fair: {
    icon: "○",
    iconLabel: "양호",
    iconClass: "text-cream/70",
    textClass: "text-cream/85",
  },
  poor: {
    icon: "×",
    iconLabel: "미흡",
    iconClass: "text-cream/40",
    textClass: "text-cream/45",
  },
};

interface ComparisonCellProps {
  data: ComparisonCellData;
  highlight?: boolean;
  layout?: "table" | "card";
}

export function ComparisonCell({ data, highlight = false, layout = "table" }: ComparisonCellProps) {
  const style = TIER_STYLES[data.tier];
  const isCard = layout === "card";

  return (
    <div
      className={[
        "flex min-w-0 items-center gap-2",
        isCard ? "justify-end text-right" : "justify-center text-center",
      ].join(" ")}
    >
      <span
        aria-label={style.iconLabel}
        className={[
          "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[12px] leading-none",
          style.iconClass,
          highlight && data.tier === "good"
            ? "bg-coral/10 ring-1 ring-coral/30"
            : "bg-cream/[0.04]",
        ].join(" ")}
      >
        {style.icon}
      </span>
      <span
        className={[
          "min-w-0 break-keep text-[13.5px] font-medium leading-snug",
          isCard ? "" : "max-w-[18ch]",
          style.textClass,
        ].join(" ")}
      >
        {data.text}
      </span>
    </div>
  );
}
