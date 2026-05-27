import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getPublishedCaseStudies } from "@/lib/case-studies/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "고객 사례 | 클코클라우드",
  description: "구독에서 API로 옮겨온 분들의 실제 변화. 사용량·비용 절감·운영 안정성 등 운영자가 직접 큐레이션한 심층 사례입니다.",
  alternates: { canonical: "/case-studies" },
};

export default async function CaseStudiesIndexPage() {
  const items = await getPublishedCaseStudies(48);

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[220px]" />
      <SiteHeader variant="floating" />

      <section className="container-cinematic relative z-[1] py-12">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
            Case Studies
          </p>
          <h1 className="mt-4 text-[clamp(36px,5vw,64px)] font-[680] leading-[1.04] tracking-[-0.045em]">
            구독을 떠난 사람들의 이야기
          </h1>
          <p className="mt-4 max-w-2xl break-keep text-[15.5px] leading-7 text-secondary">
            한 줄 리뷰에 담기지 않는 변화의 결을 운영자가 직접 정리했습니다.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-16 rounded-[28px] border border-dashed border-[var(--border-subtle)] bg-cream/60 px-6 py-16 text-center">
            <p className="text-lg font-bold text-primary">아직 공개된 사례가 없습니다.</p>
            <p className="mt-2 text-sm text-secondary">
              새 케이스 스터디가 게시되면 이곳에 차례로 노출됩니다.
            </p>
            <Link
              href="/reviews"
              className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-coral px-5 text-sm font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi"
            >
              실 사용자 리뷰 보기 →
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const metricEntries = Object.entries(item.metrics || {}).slice(0, 3);
              return (
                <Link
                  key={item.id}
                  href={`/case-studies/${item.slug}`}
                  className="group flex flex-col overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream/85 shadow-[0_18px_60px_rgba(31,30,29,.06)] transition hover:-translate-y-0.5 hover:border-coral/35 hover:shadow-[0_24px_80px_rgba(31,30,29,.10)]"
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
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-coral">
                        case study
                      </span>
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.16em] text-secondary">
                      {item.plan_code ? (
                        <span className="rounded-full bg-[var(--border-subtle)]/40 px-2 py-0.5">
                          {item.plan_code}
                        </span>
                      ) : null}
                      {item.customer_label ? (
                        <span className="truncate">{item.customer_label}</span>
                      ) : null}
                    </div>
                    <h3 className="line-clamp-2 break-keep text-[18px] font-[680] leading-tight tracking-[-0.02em] text-primary">
                      {item.title}
                    </h3>
                    <p className="line-clamp-3 break-keep text-[13.5px] leading-6 text-secondary">
                      {item.summary}
                    </p>
                    {metricEntries.length > 0 ? (
                      <div className="mt-auto grid grid-cols-3 gap-2 border-t border-[var(--border-subtle)]/60 pt-3">
                        {metricEntries.map(([key, value]) => (
                          <div key={key} className="min-w-0">
                            <p className="truncate font-mono text-[9px] uppercase tracking-[0.14em] text-secondary/70">
                              {key}
                            </p>
                            <p className="truncate text-sm font-bold text-coral">
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
        )}
      </section>
    </main>
  );
}
