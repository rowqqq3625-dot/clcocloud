"use client";

import React from "react";

interface StockStats {
  available: number;
  reserved: number;
  issued: number;
  recent24h: number;
}

interface StockDashboardProps {
  stats: Record<string, StockStats>;
  loading: boolean;
}

export default function StockDashboard({ stats, loading }: StockDashboardProps) {
  const plans = [
    { code: "STANDARD", name: "스탠다드 ($200)", threshold: 3 },
    { code: "PRO", name: "프로 ($500)", threshold: 3 },
    { code: "ULTRA", name: "울트라 ($1,000)", threshold: 3 },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 bg-[var(--surface-dark-2)] border border-[rgba(232,224,210,0.06)] rounded-[20px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
      {plans.map(({ code, name, threshold }) => {
        const planStats = stats[code] || { available: 0, reserved: 0, issued: 0, recent24h: 0 };
        const isLowStock = planStats.available < threshold;

        return (
          <div
            key={code}
            className={`p-6 rounded-[20px] border relative overflow-hidden transition-all duration-300 ${
              isLowStock
                ? "bg-[rgba(229,148,120,0.03)] border-[rgba(229,148,120,0.3)] shadow-[0_4px_20px_rgba(229,148,120,0.05)]"
                : "bg-white border-[rgba(15,14,13,0.08)] shadow-sm"
            }`}
          >
            {/* Background warning pattern for low stock */}
            {isLowStock && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--coral)] opacity-5 rounded-full blur-xl pointer-events-none" />
            )}

            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-mono tracking-widest text-[var(--coral)] uppercase block mb-0.5">· STOCK STATUS</span>
                <h3 className="text-base font-bold text-[var(--surface-dark)]">{name}</h3>
              </div>
              
              {isLowStock ? (
                <span className="px-2.5 py-0.5 text-[10px] font-bold border border-[var(--coral)]/30 rounded-full text-[var(--coral)] bg-[rgba(229,148,120,0.08)] animate-pulse">
                  재고 부족
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[10px] font-semibold border border-emerald-500/20 rounded-full text-emerald-600 bg-emerald-50">
                  안정
                </span>
              )}
            </div>

            {/* 재고 정보 그리드 */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[rgba(0,0,0,0.04)]">
              <div className="text-center">
                <span className="block text-[10px] text-[var(--cream-soft)] font-medium">사용 가능</span>
                <span className={`text-xl font-bold font-mono tracking-tight block mt-1 ${isLowStock ? "text-[var(--coral)]" : "text-[var(--surface-dark)]"}`}>
                  {planStats.available}개
                </span>
              </div>
              <div className="text-center border-x border-[rgba(0,0,0,0.04)]">
                <span className="block text-[10px] text-[var(--cream-soft)] font-medium">예약(결제중)</span>
                <span className="text-xl font-semibold font-mono tracking-tight text-[var(--surface-dark)] block mt-1">
                  {planStats.reserved}개
                </span>
              </div>
              <div className="text-center">
                <span className="block text-[10px] text-[var(--cream-soft)] font-medium">발급 완료</span>
                <span className="text-xl font-semibold font-mono tracking-tight text-[var(--surface-dark)] block mt-1">
                  {planStats.issued}개
                </span>
              </div>
            </div>

            {/* 24시간 통계 */}
            <div className="mt-4 pt-3 border-t border-[rgba(0,0,0,0.03)] flex justify-between items-center text-[11px] text-[var(--cream-soft)]">
              <span>최근 24시간 발급량</span>
              <span className="font-bold text-[var(--surface-dark)] font-mono">{planStats.recent24h}개</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
