"use client";

import { useEffect, useState } from "react";
import { CountUp } from "@/components/ui/CountUp";
import { SplitHeading } from "@/components/typography/SplitHeading";

type StatsResponse = {
  stats: {
    total_unique_buyers: number;
    repurchase_rate: number;
  };
};

// Uptime is intentionally static — the spec says "uptime_monitor 또는
// 정적 값 유지". We display 99.9% until an actual uptime feed exists.
const UPTIME_PERCENT = 99.9;

export function Sequence09IndependentKey() {
  const [buyers, setBuyers] = useState<number | null>(null);
  const [repurchaseRate, setRepurchaseRate] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews/stats", { cache: "no-store" })
      .then((r) => r.json() as Promise<StatsResponse>)
      .then((data) => {
        if (!active) return;
        setBuyers(Number(data.stats?.total_unique_buyers ?? 0));
        setRepurchaseRate(Number(data.stats?.repurchase_rate ?? 0));
      })
      .catch(() => {
        if (active) {
          // Surface zeros (which the Stat component handles as "coming soon")
          // rather than spinning forever on a transient failure.
          setBuyers(0);
          setRepurchaseRate(0);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="cinematic-section grid place-items-center bg-cream px-5 py-32">
      <div className="container-cinematic text-center">
        <p className="eyebrow">Independent Key</p>
        <SplitHeading
          as="h2"
          aria-label="구독계정이 아닌, 나만의 API 키."
          className="section-display mx-auto mt-6 max-w-5xl text-[clamp(48px,7vw,104px)] font-semibold text-[var(--ink)]"
          lines={[
            "구독계정이 아닌,",
            <span key="independent-emphasis">
              나만의{" "}
              <span className="serif-italic text-coral cc-underline-draw inline-block relative">
                API 키.
              </span>
            </span>,
          ]}
        />
        <div className="mt-20 grid gap-10 md:grid-cols-3">
          <Stat value={UPTIME_PERCENT} suffix="%" label="안정성" decimals={1} />
          <Stat value={buyers ?? undefined} suffix="명" label="이용고객" />
          <Stat value={repurchaseRate ?? undefined} suffix="%" label="재구매율" decimals={1} />
        </div>
      </div>
      <style jsx global>{`
        .cc-underline-draw:after {
          animation-duration: 0.6s !important;
          animation-delay: 0.2s !important;
          height: 1.5px !important;
        }
      `}</style>
    </section>
  );
}

function Stat({
  value,
  suffix,
  label,
  decimals = 0,
}: {
  value?: number | null;
  suffix: string;
  label: string;
  decimals?: number;
}) {
  const isEmpty = value === undefined || value === null || value === 0;
  return (
    <div className="relative border-coral/30 md:border-r md:last:border-r-0 flex flex-col justify-center items-center">
      {isEmpty ? (
        <div className="flex items-center justify-center h-[clamp(64px,10vw,140px)] select-none">
          <span className="font-mono text-xs tracking-[0.12em] text-[var(--ink-soft)] opacity-50 uppercase">
            · coming soon
          </span>
        </div>
      ) : (
        <strong className="text-[clamp(64px,10vw,140px)] font-semibold leading-none tracking-[-.06em] text-[var(--ink)]">
          <CountUp end={value} suffix={suffix} decimals={decimals} />
        </strong>
      )}
      <p className="mt-4 text-lg font-semibold text-secondary">{label}</p>
    </div>
  );
}
