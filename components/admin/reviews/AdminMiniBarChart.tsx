type Point = { label: string; value: number };

/**
 * Tiny pure-CSS bar chart for the operations dashboard. No D3, no Recharts —
 * good enough for the 12-bucket trend and the 5-bucket rating distribution.
 * Bar height is relative to the max value in the set; a label appears below
 * each bar with its raw count.
 */
export function AdminMiniBarChart({
  data,
  height = 80,
  format = (n: number) => String(n),
}: {
  data: Point[];
  height?: number;
  format?: (n: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d) => {
        const h = Math.max(2, Math.round((d.value / max) * height));
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-[#D97757]/70 transition-[height]"
                style={{ height: `${h}px` }}
                title={`${d.label}: ${format(d.value)}`}
              />
            </div>
            <span className="font-mono text-[9px] text-cream/40 leading-none">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
