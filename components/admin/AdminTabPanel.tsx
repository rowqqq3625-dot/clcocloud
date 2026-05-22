"use client";

import React, { useState } from "react";
import InventoryTab from "./InventoryTab";
import { AdminOrdersTable } from "./AdminOrdersTable";
import InquiryList from "./InquiryList";
import BundleProductManager from "./BundleProductManager";
import { AdminReviewsTable } from "./AdminReviewsTable";
import type { ReviewRecord } from "@/lib/supabase-admin";

interface AdminTabPanelProps {
  initialReviews: ReviewRecord[];
}

type TabType = "inventory" | "orders" | "inquiries" | "bundles" | "reviews";

export default function AdminTabPanel({ initialReviews }: AdminTabPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: "inventory", label: "재고/키 관리" },
    { id: "orders", label: "주문 내역" },
    { id: "inquiries", label: "대량 충전 문의" },
    { id: "bundles", label: "AI플랜 번들 관리" },
    { id: "reviews", label: "리뷰 관리", count: initialReviews.length },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* 탭 네비게이션 */}
      <div className="flex border-b border-[var(--border-subtle)] pb-px overflow-x-auto scrollbar-none">
        <div className="flex space-x-1 min-w-max">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3.5 text-sm font-bold tracking-tight transition-all duration-300 rounded-t-[14px] ${
                  isActive
                    ? "bg-white text-[var(--surface-dark)] border-t border-x border-[rgba(15,14,13,0.08)] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                    : "text-[var(--cream-soft)] hover:text-[var(--surface-dark)] hover:bg-cream/40"
                }`}
              >
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-[9px] font-mono font-bold rounded-full bg-[var(--coral)] text-white">
                      {tab.count}
                    </span>
                  )}
                </span>
                {isActive && (
                  <span className="absolute left-0 right-0 bottom-[-1px] h-[2px] bg-white z-20" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 탭 본문 영역 */}
      <div className="transition-all duration-300">
        {activeTab === "inventory" && <InventoryTab />}
        {activeTab === "orders" && <AdminOrdersTable />}
        {activeTab === "inquiries" && <InquiryList />}
        {activeTab === "bundles" && <BundleProductManager />}
        {activeTab === "reviews" && <AdminReviewsTable reviews={initialReviews} />}
      </div>
    </div>
  );
}
