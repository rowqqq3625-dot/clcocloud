"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUB_ITEMS = [
  { href: "/admin-panel/reviews", label: "운영 대시보드" },
  { href: "/admin-panel/reviews/list", label: "목록" },
  { href: "/admin-panel/reviews/rewards", label: "보상 원장" },
  { href: "/admin-panel/reviews/featured", label: "추천 큐레이션" },
  { href: "/admin-panel/reviews/logs", label: "활동 로그" },
  { href: "/admin-panel/reviews/stats", label: "통계" },
];

/**
 * Horizontal sub-navigation rendered at the top of every
 * /admin-panel/reviews/* page. Mirrors the section structure from the
 * spec's "리뷰 운영 대시보드" so the operator can switch surfaces
 * without leaving the section.
 */
export function ReviewsSubNav() {
  const pathname = usePathname() || "";

  return (
    <nav
      aria-label="리뷰 운영 메뉴"
      className="flex flex-wrap items-center gap-1 rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-1"
    >
      {SUB_ITEMS.map((item) => {
        const active =
          item.href === "/admin-panel/reviews"
            ? pathname === "/admin-panel/reviews"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              active
                ? "bg-[#D97757]/20 text-[#F0E2D2]"
                : "text-cream/60 hover:bg-cream/5 hover:text-cream"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
