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

function ColumnHeader({ columnKey, index }: { columnKey: ComparisonColumnKey; index: number }) {
  const col = COMPARISON_COLUMNS[columnKey];
  const isHighlight = col.highlight;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.42, delay: index * 0.12, ease: EASE }}
      className={[
        "relative flex h-full flex-col gap-3 rounded-t-2xl px-6 py-7 text-center",
        isHighlight
          ? "bg-[radial-gradient(circle_at_50%_-20%,rgba(217,119,87,0.18),transparent_70%)] ring-2 ring-coral"
          : "bg-dark-2 ring-1 ring-cream/10",
      ].join(" ")}
    >
      {isHighlight ? (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-pill bg-coral px-[10px] py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream shadow-coral"
        >
          BEST CHOICE
        </span>
      ) : null}

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
          "text-[22px] font-semibold leading-tight tracking-[-0.01em]",
          isHighlight ? "text-cream" : "text-cream/90",
        ].join(" ")}
      >
        {col.name}
      </h3>

      <div className="mt-1 flex flex-col gap-1">
        <p
          className={[
            "text-[18px] font-semibold leading-tight tabular-nums",
            isHighlight ? "text-coral" : "text-cream/85",
          ].join(" ")}
        >
          {col.price}
        </p>
        {col.priceSuffix ? (
          <p className="text-[12px] font-medium text-cream/45">{col.priceSuffix}</p>
        ) : null}
      </div>

      {isHighlight ? (
        <motion.span
          aria-hidden
          initial={{ opacity: 0.6 }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 rounded-t-2xl bg-[radial-gradient(circle_at_50%_0%,rgba(217,119,87,0.18),transparent_60%)]"
        />
      ) : null}
    </motion.div>
  );
}

export function ComparisonTable() {
  return (
    <div className="relative">
      <div
        role="table"
        aria-label="클코클라우드, 타사 공유 구독, 클로드 정식 API 비교표"
        className="overflow-hidden rounded-2xl ring-1 ring-cream/[0.06]"
      >
        {/* Header row */}
        <div role="rowgroup">
          <div role="row" className="grid grid-cols-[minmax(160px,1.1fr)_repeat(3,minmax(0,1fr))]">
            <div role="columnheader" className="bg-dark-2 px-6 py-7" aria-hidden />
            {COMPARISON_COLUMN_ORDER.map((key, index) => (
              <div key={key} role="columnheader" className="bg-dark-2">
                <ColumnHeader columnKey={key} index={index} />
              </div>
            ))}
          </div>
        </div>

        {/* Body rows */}
        <div role="rowgroup" className="divide-y divide-cream/[0.06] bg-dark">
          {COMPARISON_ROWS.map((row, rowIndex) => (
            <motion.div
              key={row.id}
              role="row"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.36, delay: 0.32 + rowIndex * 0.03, ease: EASE }}
              className="group grid min-h-[64px] grid-cols-[minmax(160px,1.1fr)_repeat(3,minmax(0,1fr))] items-center transition-colors hover:bg-cream/[0.03]"
            >
              <div
                role="rowheader"
                className="flex h-full items-center px-6 text-[15px] font-semibold text-cream"
              >
                <span className="mr-3 font-mono text-[11px] text-cream/30 tabular-nums">
                  {String(row.id).padStart(2, "0")}
                </span>
                {row.label}
              </div>
              {COMPARISON_COLUMN_ORDER.map((key) => {
                const highlight = COMPARISON_COLUMNS[key].highlight;
                return (
                  <div
                    key={key}
                    role="cell"
                    className={[
                      "flex h-full items-center justify-center px-4 py-4",
                      highlight ? "bg-coral/[0.04]" : "",
                    ].join(" ")}
                  >
                    <ComparisonCell data={row[key]} highlight={highlight} layout="table" />
                  </div>
                );
              })}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
