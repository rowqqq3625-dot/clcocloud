import Link from "next/link";
import { formatKstDateTime } from "@/lib/admin/format";
import { getAdminCaseStudies } from "@/lib/case-studies/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  published?: string;
  search?: string;
  limit?: string;
  offset?: string;
};

export default async function AdminCaseStudiesListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const publishedRaw = searchParams?.published;
  const published =
    publishedRaw === "true" ? true : publishedRaw === "false" ? false : undefined;
  const search = searchParams?.search?.trim() || "";
  const limitRaw = Number(searchParams?.limit ?? 25);
  const limit = [25, 50, 100].includes(limitRaw) ? limitRaw : 25;
  const offsetRaw = Number(searchParams?.offset ?? 0);
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const { rows, total } = await getAdminCaseStudies({
    published,
    search: search || undefined,
    limit,
    offset,
  });

  const baseQuery = new URLSearchParams();
  if (published !== undefined) baseQuery.set("published", published ? "true" : "false");
  if (search) baseQuery.set("search", search);
  if (limit !== 25) baseQuery.set("limit", String(limit));
  const hrefFor = (o: number | null) => {
    if (o === null) return null;
    const q = new URLSearchParams(baseQuery);
    if (o > 0) q.set("offset", String(o));
    return `/admin-panel/case-studies${q.toString() ? `?${q.toString()}` : ""}`;
  };

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
            Case Studies
          </p>
          <h1 className="mt-1 text-2xl font-bold">케이스 스터디</h1>
          <p className="mt-2 text-sm text-cream/60">
            리뷰에서 발전한 심층 사례를 큐레이션합니다. 게시된 항목만 /case-studies에 노출됩니다.
          </p>
        </div>
        <Link
          href="/admin-panel/case-studies/new"
          className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
        >
          + 새 케이스 스터디
        </Link>
      </header>

      <form className="flex flex-wrap items-center gap-2 rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4">
        <div className="flex items-center gap-1 rounded-full border border-cream/10 bg-cream/5 p-1">
          {[
            { value: "", label: "전체" },
            { value: "true", label: "게시됨" },
            { value: "false", label: "비공개" },
          ].map((opt) => {
            const active =
              (opt.value === "" && published === undefined) ||
              (opt.value === "true" && published === true) ||
              (opt.value === "false" && published === false);
            return (
              <Link
                key={opt.value}
                href={(() => {
                  const q = new URLSearchParams();
                  if (opt.value) q.set("published", opt.value);
                  if (search) q.set("search", search);
                  return `/admin-panel/case-studies${q.toString() ? `?${q.toString()}` : ""}`;
                })()}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  active
                    ? "bg-[#D97757] text-cream"
                    : "text-cream/70 hover:bg-cream/5 hover:text-cream"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
        <input
          name="search"
          defaultValue={search}
          placeholder="title · summary · slug"
          className="h-9 flex-1 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        />
        <button
          type="submit"
          className="h-9 rounded-lg bg-cream/10 px-4 text-xs font-bold text-cream transition hover:bg-cream/15"
        >
          검색
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-cream/10 bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2.5">slug</th>
                <th className="px-3 py-2.5">title</th>
                <th className="px-3 py-2.5">customer</th>
                <th className="px-3 py-2.5">상태</th>
                <th className="px-3 py-2.5">원본 리뷰</th>
                <th className="px-3 py-2.5">수정일</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-cream/50">
                    케이스 스터디가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((cs) => (
                  <tr key={cs.id} className="border-b border-cream/5 hover:bg-cream/5">
                    <td className="px-3 py-3 font-mono text-cream/80">{cs.slug}</td>
                    <td className="px-3 py-3">
                      <p className="truncate font-bold text-cream">{cs.title}</p>
                      <p className="line-clamp-1 text-cream/60">{cs.summary}</p>
                    </td>
                    <td className="px-3 py-3 font-mono text-cream/60">
                      {cs.customer_label ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${
                          cs.published
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-cream/10 text-cream/60"
                        }`}
                      >
                        {cs.published ? "게시됨" : "비공개"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-[#D97757]">
                      {cs.review_id ? (
                        <Link
                          href={`/admin-panel/reviews/list?search=${encodeURIComponent(cs.review_id)}`}
                          className="hover:brightness-125"
                        >
                          {cs.review_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="text-cream/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-cream/60">
                      {formatKstDateTime(cs.updated_at)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link
                        href={`/admin-panel/case-studies/${cs.id}`}
                        className="rounded-lg bg-cream/10 px-3 py-1.5 text-[11px] font-bold text-cream transition hover:bg-cream/15"
                      >
                        편집
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) ? (
          <Link
            href={hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) as string}
            className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
          >
            ← 이전
          </Link>
        ) : (
          <span />
        )}
        <span className="font-mono text-xs text-cream/50">
          {total === 0
            ? "0 / 0"
            : `${offset + 1} – ${Math.min(offset + limit, total)} / ${total}`}
        </span>
        {hrefFor(offset + limit < total ? offset + limit : null) ? (
          <Link
            href={hrefFor(offset + limit < total ? offset + limit : null) as string}
            className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
          >
            다음 →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
