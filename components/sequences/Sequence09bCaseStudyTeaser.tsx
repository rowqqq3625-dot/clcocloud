"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TeaserItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  hero_image_url: string | null;
  customer_label: string | null;
  plan_code: string | null;
  metrics: Record<string, string | number>;
};

type TeaserResponse = {
  items: TeaserItem[];
};

/**
 * Landing-page "고객 사례" teaser. Renders up to 3 published case
 * studies just below the STATS section, with a "전체 사례" link
 * pointing at /case-studies. The component renders nothing when
 * the operator hasn't published anything yet — case studies are
 * curated content and "coming soon" placeholders would feel weak.
 */
export function Sequence09bCaseStudyTeaser() {
  const [items, setItems] = useState<TeaserItem[] | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/case-studies?limit=3", { cache: "no-store" })
      .then((r) => r.json() as Promise<TeaserResponse>)
      .then((data) => {
        if (active) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => {
        if (active) setItems([]);
      });
    return () => {
      active = false;
    };
  }, []);

  if (items === null) return null; // initial load: render nothing instead of placeholder
  if (items.length === 0) return null;

  return (
    <section className="cinematic-section bg-cream px-5 py-24">
      <div className="container-cinematic">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Case Studies</p>
            <h2 className="mt-4 text-[clamp(36px,5vw,64px)] font-[680] leading-[1.04] tracking-[-0.04em] text-[var(--ink)]">
              실제 고객의 변화
            </h2>
            <p className="mt-3 max-w-xl break-keep text-[15.5px] leading-7 text-[var(--ink-soft)]">
              한 줄 리뷰가 아닌, 한 문장 한 문장 곱씹게 되는 후기들.
              구독에서 API로 옮겨온 분들의 실전 사례를 모았습니다.
            </p>
          </div>
          <Link
            href="/case-studies"
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--coral)]/30 bg-[var(--coral)]/8 px-5 py-2.5 text-sm font-bold text-[var(--coral)] transition hover:bg-[var(--coral)] hover:text-cream"
          >
            전체 사례
            <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {items.slice(0, 3).map((item) => {
            const metricEntries = Object.entries(item.metrics || {}).slice(0, 3);
            return (
              <Link
                key={item.id}
                href={`/case-studies/${item.slug}`}
                className="group flex flex-col overflow-hidden rounded-[28px] border border-[var(--line)] bg-cream/80 shadow-[var(--shadow-md)] transition hover:-translate-y-0.5 hover:border-[var(--coral)]/35 hover:shadow-[var(--shadow-lg)]"
              >
                {item.hero_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.hero_image_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-44 w-full place-items-center bg-[linear-gradient(135deg,rgba(217,119,87,0.18),rgba(217,119,87,0.04))]">
                    <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--coral)]">
                      case study
                    </span>
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-3 p-6">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                    {item.plan_code ? (
                      <span className="rounded-full bg-[var(--line)]/40 px-2 py-0.5">
                        {item.plan_code}
                      </span>
                    ) : null}
                    {item.customer_label ? (
                      <span className="truncate">{item.customer_label}</span>
                    ) : null}
                  </div>
                  <h3 className="line-clamp-2 break-keep text-[18px] font-[680] leading-tight tracking-[-0.02em] text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="line-clamp-3 break-keep text-[13.5px] leading-6 text-[var(--ink-soft)]">
                    {item.summary}
                  </p>
                  {metricEntries.length > 0 ? (
                    <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[var(--line)]/60 pt-3">
                      {metricEntries.map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <p className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-soft)]/70">
                            {key}
                          </p>
                          <p className="truncate text-sm font-bold text-[var(--coral)]">
                            {String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
