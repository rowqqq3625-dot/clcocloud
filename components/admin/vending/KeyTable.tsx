"use client";

import Link from "next/link";
import type { KeyRowSafe, VendingKeyStatus } from "@/lib/vending/types";

const STATUS_TONE: Record<VendingKeyStatus, string> = {
  available: "bg-emerald-500/15 text-emerald-300",
  reserved: "bg-amber-500/15 text-amber-300",
  issued: "bg-[#D97757]/15 text-[#F0E2D2]",
  revoked: "bg-cream/10 text-cream/60",
  expired: "bg-cream/10 text-cream/50",
};

type Props = {
  rows: KeyRowSafe[];
  total: number;
  page: number;
  pageSize: number;
  baseHref: string; // 예: "/admin-panel/vending/keys?status=available"
  onRowAction?: (row: KeyRowSafe, action: "revoke" | "reissue" | "detail") => void;
};

export function KeyTable({ rows, total, page, pageSize, baseHref, onRowAction }: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
      <table className="w-full table-fixed text-left text-xs">
        <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
          <tr>
            <th className="w-[18%] px-3 py-2 font-mono">키 프리뷰</th>
            <th className="w-[10%] px-3 py-2 font-mono">플랜</th>
            <th className="w-[10%] px-3 py-2 font-mono">상태</th>
            <th className="w-[14%] px-3 py-2 font-mono">등록일</th>
            <th className="w-[14%] px-3 py-2 font-mono">발급일</th>
            <th className="w-[16%] px-3 py-2 font-mono">주문번호</th>
            <th className="w-[10%] px-3 py-2 font-mono">메모</th>
            <th className="w-[8%] px-3 py-2 font-mono text-right">액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-cream/5 text-cream/85">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 py-10 text-center text-cream/40">
                등록된 키가 없습니다.
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id} className="hover:bg-cream/[0.02]">
                <td className="px-3 py-2 font-mono text-[11px]">
                  {row.key_preview || "—"}
                </td>
                <td className="px-3 py-2 font-mono text-[10px]">{row.product_code || "—"}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${STATUS_TONE[row.status] || "bg-cream/10 text-cream/70"}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[10px] text-cream/70">{fmt(row.created_at)}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-cream/70">{fmt(row.issued_at)}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-cream/70 truncate">{row.issued_order_no || "—"}</td>
                <td className="px-3 py-2 text-[11px] text-cream/70 truncate">{row.memo || "—"}</td>
                <td className="px-3 py-2 text-right">
                  <div className="inline-flex gap-1">
                    <Link
                      href={`/admin-panel/vending/keys/${row.id}`}
                      className="rounded-full border border-cream/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/70 hover:border-cream/40"
                    >
                      상세
                    </Link>
                    {row.status === "issued" && onRowAction ? (
                      <button onClick={() => onRowAction(row, "reissue")} className="rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2] hover:bg-[#D97757]/25">
                        재발급
                      </button>
                    ) : null}
                    {(row.status === "available" || row.status === "issued") && onRowAction ? (
                      <button onClick={() => onRowAction(row, "revoke")} className="rounded-full border border-[#D97757]/40 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#D97757] hover:bg-[#D97757]/10">
                        폐기
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {total > 0 ? (
        <div className="flex items-center justify-between border-t border-cream/5 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/40">
          <span>
            {((page - 1) * pageSize + 1).toLocaleString()}–
            {Math.min(page * pageSize, total).toLocaleString()} / {total.toLocaleString()}
          </span>
          <span className="flex gap-2">
            <PageLink baseHref={baseHref} page={Math.max(1, page - 1)} disabled={page === 1}>
              이전
            </PageLink>
            <span className="text-cream/60">{page} / {lastPage}</span>
            <PageLink baseHref={baseHref} page={Math.min(lastPage, page + 1)} disabled={page === lastPage}>
              다음
            </PageLink>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function PageLink({ baseHref, page, disabled, children }: { baseHref: string; page: number; disabled: boolean; children: React.ReactNode }) {
  const sep = baseHref.includes("?") ? "&" : "?";
  if (disabled) return <span className="opacity-30">{children}</span>;
  return (
    <Link href={`${baseHref}${sep}page=${page}`} className="hover:text-cream">
      {children}
    </Link>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
