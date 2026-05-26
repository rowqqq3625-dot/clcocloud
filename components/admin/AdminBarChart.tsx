/**
 * Dependency-free SVG bar chart. Server-renderable, no client JS.
 * Bars are sized in viewport coordinates so the chart scales fluidly.
 */
export type BarDatum = {
  label: string;
  value: number;
  /** Optional secondary value displayed under the bar (e.g. order count). */
  secondary?: number | string;
};

type Props = {
  data: BarDatum[];
  /** Pixels per bar in the SVG viewBox. */
  barWidth?: number;
  /** Pixels of gap between bars. */
  barGap?: number;
  /** SVG viewBox height. */
  height?: number;
  /** Pre-formatted tooltip/value renderer for the headline number above the bar. */
  valueLabel?: (value: number) => string;
  /** When true, hides the value label above each bar. */
  hideValueLabel?: boolean;
};

export function AdminBarChart({
  data,
  barWidth = 22,
  barGap = 6,
  height = 180,
  valueLabel,
  hideValueLabel,
}: Props) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const padTop = 24;
  const padBottom = 36;
  const innerH = height - padTop - padBottom;
  const totalWidth = data.length * (barWidth + barGap);

  return (
    <svg
      viewBox={`0 0 ${Math.max(totalWidth, 100)} ${height}`}
      preserveAspectRatio="none"
      className="block h-full w-full"
      role="img"
    >
      {/* baseline */}
      <line
        x1={0}
        x2={totalWidth}
        y1={padTop + innerH}
        y2={padTop + innerH}
        stroke="rgba(247,241,232,0.12)"
      />
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map((g, idx) => (
        <line
          key={idx}
          x1={0}
          x2={totalWidth}
          y1={padTop + innerH * (1 - g)}
          y2={padTop + innerH * (1 - g)}
          stroke="rgba(247,241,232,0.05)"
          strokeDasharray="2 4"
        />
      ))}
      {data.map((d, idx) => {
        const h = Math.max(1, (d.value / max) * innerH);
        const x = idx * (barWidth + barGap);
        const y = padTop + innerH - h;
        return (
          <g key={`${d.label}-${idx}`}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={h}
              rx={3}
              fill={d.value > 0 ? "#D97757" : "rgba(247,241,232,0.18)"}
              opacity={d.value > 0 ? 0.9 : 0.4}
            />
            {!hideValueLabel && d.value > 0 ? (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(247,241,232,0.7)"
                fontFamily="ui-monospace,monospace"
              >
                {valueLabel ? valueLabel(d.value) : d.value}
              </text>
            ) : null}
            <text
              x={x + barWidth / 2}
              y={padTop + innerH + 14}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(247,241,232,0.5)"
              fontFamily="ui-monospace,monospace"
            >
              {d.label}
            </text>
            {d.secondary !== undefined ? (
              <text
                x={x + barWidth / 2}
                y={padTop + innerH + 26}
                textAnchor="middle"
                fontSize={8}
                fill="rgba(247,241,232,0.35)"
                fontFamily="ui-monospace,monospace"
              >
                {d.secondary}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}
