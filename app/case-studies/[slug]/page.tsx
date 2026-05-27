import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getPublishedCaseStudyBySlug } from "@/lib/case-studies/queries";
import { renderMarkdownLite } from "@/lib/case-studies/markdown";

export const dynamic = "force-dynamic";

type RouteProps = { params: { slug: string } };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const item = await getPublishedCaseStudyBySlug(params.slug);
  if (!item) return { title: "고객 사례" };
  return {
    title: `${item.title} | 클코클라우드 고객 사례`,
    description: item.summary,
    alternates: { canonical: `/case-studies/${item.slug}` },
    openGraph: {
      title: item.title,
      description: item.summary,
      images: item.hero_image_url ? [item.hero_image_url] : undefined,
    },
  };
}

function formatKoreanDate(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(d);
}

export default async function CaseStudyDetailPage({ params }: RouteProps) {
  const item = await getPublishedCaseStudyBySlug(params.slug);
  if (!item) notFound();

  const html = renderMarkdownLite(item.body_md);
  const metricEntries = Object.entries(item.metrics || {});

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[220px]" />
      <SiteHeader variant="floating" />

      <article className="container-cinematic relative z-[1] max-w-4xl py-12">
        <Link
          href="/case-studies"
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-coral"
        >
          ← 전체 사례
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-secondary">
            {item.plan_code ? (
              <span className="rounded-full bg-[var(--border-subtle)]/40 px-2.5 py-0.5">
                {item.plan_code}
              </span>
            ) : null}
            {item.customer_label ? <span>{item.customer_label}</span> : null}
            {item.published_at ? (
              <>
                <span className="text-secondary/40">·</span>
                <span>{formatKoreanDate(item.published_at)}</span>
              </>
            ) : null}
          </div>
          <h1 className="mt-4 break-keep text-[clamp(32px,4.5vw,56px)] font-[680] leading-[1.06] tracking-[-0.04em]">
            {item.title}
          </h1>
          <p className="mt-4 max-w-3xl break-keep text-[16px] leading-7 text-secondary">
            {item.summary}
          </p>
        </header>

        {item.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.hero_image_url}
            alt={item.title}
            referrerPolicy="no-referrer"
            className="mt-10 w-full rounded-[28px] border border-[var(--border-subtle)] object-cover"
          />
        ) : null}

        {metricEntries.length > 0 ? (
          <section className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metricEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-[var(--border-subtle)] bg-cream/85 p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-secondary/70">
                  {key}
                </p>
                <p className="mt-2 text-2xl font-[680] tracking-[-0.025em] text-coral">
                  {String(value)}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        <section
          className="prose-clco mt-10 break-keep text-[16px] text-primary"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {item.review_id ? (
          <p className="mt-12 rounded-2xl border border-[var(--border-subtle)] bg-coral/5 px-5 py-4 text-sm leading-7 text-secondary">
            <span className="font-bold text-coral">실 사용자 리뷰에서 발전한 사례입니다.</span>
            <br />
            <Link
              href={`/reviews/${item.review_id}`}
              className="font-bold text-coral underline-offset-4 hover:underline"
            >
              원본 리뷰 보기 →
            </Link>
          </p>
        ) : null}
      </article>
    </main>
  );
}
