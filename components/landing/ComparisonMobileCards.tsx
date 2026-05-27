"use client";

import { motion } from "framer-motion";
import {
  COMPARISON_COLUMNS,
  COMPARISON_COLUMN_ORDER,
  COMPARISON_ROWS,
  type ComparisonColumnKey,
} from "@/lib/data/comparison";
import { ComparisonCell } from "./ComparisonCell";

const EASE = [0.22, 1, 0.36, 1] as const;

function MobileColumnCard({
  columnKey,
  index,
}: {
  columnKey: ComparisonColumnKey;
  index: number;
}) {
  const col = COMPARISON_COLUMNS[columnKey];
  const isHighlight = col.highlight;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.42, delay: index * 0.12, ease: EASE }}
      className={[
        "relative rounded-[16px] p-5",
        isHighlight
          ? "bg-[radial-gradient(circle_at_50%_-30%,rgba(217,119,87,0.18),transparent_70%),var(--surface-dark-2)] ring-2 ring-coral shadow-[0_24px_60px_-30px_rgba(217,119,87,0.45)]"
          : "bg-dark-2 ring-1 ring-cream/10",
      ].join(" ")}
    >
      {isHighlight ? (
        <span className="absolute -top-3 left-5 rounded-pill bg-coral px-[10px] py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream shadow-coral">
          BEST CHOICE
        </span>
      ) : null}

      {/* Header */}
      <header
        className={[
          "flex flex-col gap-1 border-b pb-4",
          isHighlight ? "border-coral/30" : "border-cream/10",
        ].join(" ")}
      >
        <p
          className={[
            "font-mono text-[10.5px] uppercase tracking-[0.2em]",
            isHighlight ? "text-coral" : "text-cream/45",
          ].join(" ")}
        >
          {col.sub}
        </p>
        <h3
          className={[
            "text-[20px] font-semibold leading-tight",
            isHighlight ? "text-cream" : "text-cream/90",
          ].join(" ")}
        >
          {col.name}
        </h3>
        <div className="mt-1 flex items-baseline gap-2">
          <p
            className={[
              "text-[18px] font-semibold tabular-nums",
              isHighlight ? "text-coral" : "text-cream/85",
            ].join(" ")}
          >
            {col.price}
          </p>
          {col.priceSuffix ? (
            <p className="text-[11.5px] text-cream/45">{col.priceSuffix}</p>
          ) : null}
        </div>
      </header>

      {/* Rows: label | value pairs */}
      <ul className="mt-4 flex flex-col divide-y divide-cream/[0.06]">
        {COMPARISON_ROWS.map((row) => (
          <li
            key={row.id}
            className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] items-center gap-3 py-3"
          >
            <span className="min-w-0 break-keep text-[13px] font-medium text-cream/55">
              {row.label}
            </span>
            <div className="min-w-0">
              <ComparisonCell data={row[columnKey]} highlight={isHighlight} layout="card" />
            </div>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

export function ComparisonMobileCards() {
  return (
    <div
      role="list"
      aria-label="클코클라우드, 타사 공유 구독, 클로드 정식 API 비교 카드"
      className="flex flex-col gap-5"
    >
      {COMPARISON_COLUMN_ORDER.map((key, index) => (
        <div key={key} role="listitem">
          <MobileColumnCard columnKey={key} index={index} />
        </div>
      ))}
    </div>
  );
}
