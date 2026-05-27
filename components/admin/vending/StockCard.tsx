import type { PlanStock } from "@/lib/vending/types";

type Props = {
  stock: PlanStock;
  threshold: number;
  planName?: string;
};

export function StockCard({ stock, threshold, planName }: Props) {
  const low = stock.available_count <= threshold;
  return (
    <div
      className={[
        "rounded-2xl border bg-[#1F1E1D]/80 p-5 transition",
        low ? "border-[#D97757]/60" : "border-cream/10",
      ].join(" ")}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">
            {stock.plan_code}
          </p>
          {planName ? <p className="mt-1 text-sm font-bold text-cream">{planName}</p> : null}
        </div>
        {low ? (
          <span className="rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2]">
            재고 부족
          </span>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-5 gap-2 text-center">
        <Stat label="가용" value={stock.available_count} tone={low ? "coral" : "emerald"} />
        <Stat label="예약" value={stock.reserved_count} tone="amber" />
        <Stat label="발급" value={stock.issued_count} tone="cream" />
        <Stat label="폐기" value={stock.revoked_count} tone="muted" />
        <Stat label="만료" value={stock.expired_count} tone="muted" />
      </div>
      <div className="mt-3 border-t border-cream/5 pt-2 text-right">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
          total {stock.total_count}
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "emerald" | "amber" | "cream" | "muted" | "coral";
}) {
  const toneClass = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    cream: "text-[#F0E2D2]",
    muted: "text-cream/50",
    coral: "text-[#D97757]",
  }[tone];
  return (
    <div>
      <p className={`text-lg font-bold tabular-nums ${toneClass}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-[0.16em] text-cream/40">{label}</p>
    </div>
  );
}
