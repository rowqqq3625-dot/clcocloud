"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin-panel", label: "대시보드" },
  { href: "/admin-panel/members", label: "회원" },
  { href: "/admin-panel/orders", label: "주문/결제" },
  { href: "/admin-panel/api-keys", label: "API 키" },
  { href: "/admin-panel/vending", label: "API 자판기" },
  { href: "/admin-panel/bundles", label: "번들 상품" },
  { href: "/admin-panel/reviews", label: "리뷰 운영" },
  { href: "/admin-panel/case-studies", label: "케이스 스터디" },
  { href: "/admin-panel/inquiries", label: "문의" },
  { href: "/admin-panel/security", label: "보안/감사" },
  { href: "/admin-panel/analytics", label: "통계" },
];

export function AdminSidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="hidden w-60 shrink-0 border-r border-cream/10 bg-[#15140F] md:flex md:flex-col">
      <div className="px-5 py-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">
          CLCOCLOUD
        </p>
        <p className="mt-1 text-sm font-bold text-cream">관리자 콘솔</p>
      </div>
      <nav className="grid gap-0.5 px-3" aria-label="관리자 메뉴">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/admin-panel"
              ? pathname === "/admin-panel"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-[#D97757]/20 text-[#F0E2D2]"
                  : "text-cream/70 hover:bg-cream/5 hover:text-cream",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
