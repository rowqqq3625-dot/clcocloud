/**
 * Dependency-free SVG donut chart. Server-renderable.
 */
export type DonutSlice = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  data: DonutSlice[];
  /** SVG viewBox size (square). */
  size?: number;
  /** Inner radius as a ratio of outer (0–1). */
  innerRatio?: number;
  /** Centered headline rendered inside the donut. */
  centerLabel?: string;
  /** Smaller text under the headline. */
  centerSub?: string;
};

function polar(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const oStart = polar(cx, cy, rOuter, startAngle);
  const oEnd = polar(cx, cy, rOuter, endAngle);
  const iStart = polar(cx, cy, rInner, endAngle);
  const iEnd = polar(cx, cy, rInner, startAngle);
  return [
    `M ${oStart.x} ${oStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${oEnd.x} ${oEnd.y}`,
    `L ${iStart.x} ${iStart.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${iEnd.x} ${iEnd.y}`,
    "Z",
  ].join(" ");
}

export function AdminDonutChart({
  data,
  size = 180,
  innerRatio = 0.62,
  centerLabel,
  centerSub,
}: Props) {
  const total = data.reduce((acc, d) => acc + Math.max(0, d.value), 0);
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 4;
  const rInner = rOuter * innerRatio;

  // Empty-state circle to avoid zero-divide rendering.
  if (total <= 0) {
    return (
      <svg viewBox={`0 0 ${size} ${size}`} className="block h-full w-full" role="img">
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(247,241,232,0.1)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(247,241,232,0.1)" strokeWidth={1} />
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={10}
          fill="rgba(247,241,232,0.5)"
          fontFamily="ui-monospace,monospace"
        >
          데이터 없음
        </text>
      </svg>
    );
  }

  let cursor = -Math.PI / 2; // start at 12 o'clock
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="block h-full w-full" role="img">
      {data.map((slice, idx) => {
        const portion = slice.value / total;
        if (portion <= 0) return null;
        const start = cursor;
        const end = cursor + portion * Math.PI * 2;
        cursor = end;
        // Slight gap between slices for readability.
        const gap = portion < 0.02 ? 0 : 0.012;
        const path = arcPath(cx, cy, rOuter, rInner, start + gap, end - gap);
        return <path key={`${slice.label}-${idx}`} d={path} fill={slice.color} opacity={0.9} />;
      })}
      {centerLabel ? (
        <text
          x={cx}
          y={cy - (centerSub ? 6 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={14}
          fontWeight={700}
          fill="#F7F1E8"
          fontFamily="ui-monospace,monospace"
        >
          {centerLabel}
        </text>
      ) : null}
      {centerSub ? (
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={9}
          fill="rgba(247,241,232,0.5)"
          fontFamily="ui-monospace,monospace"
        >
          {centerSub}
        </text>
      ) : null}
    </svg>
  );
}
