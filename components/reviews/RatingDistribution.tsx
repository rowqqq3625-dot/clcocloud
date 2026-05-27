type RatingDistributionProps = {
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  total: number;
};

/**
 * 5-row horizontal bar chart, 1 row per rating. The bar fill is
 * proportional to that bucket's share of the total approved reviews.
 *
 * `total` is passed in (not derived from the distribution sum) so we
 * can show a consistent percentage even if the caller already has the
 * approved-review total handy from review_stats_view.
 */
export function RatingDistribution({ distribution, total }: RatingDistributionProps) {
  const safeTotal = total > 0 ? total : 0;
  return (
    <div className="grid gap-1.5">
      {[5, 4, 3, 2, 1].map((star) => {
        const count = distribution[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
        const pct = safeTotal > 0 ? Math.round((count / safeTotal) * 1000) / 10 : 0;
        return (
          <div key={star} className="grid grid-cols-[44px_minmax(0,1fr)_56px] items-center gap-3 text-xs">
            <span className="flex items-center gap-1 font-mono font-bold text-secondary">
              <span className="text-coral" aria-hidden="true">
                ★
              </span>
              {star}
            </span>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-[var(--border-subtle)]/40"
              aria-hidden="true"
            >
              <div
                className="h-full rounded-full bg-coral transition-[width] duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-right font-mono font-semibold text-secondary tabular-nums">
              {count}
              <span className="ml-1 text-secondary/60">·</span>
              <span className="ml-1 text-secondary/60">{pct}%</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
