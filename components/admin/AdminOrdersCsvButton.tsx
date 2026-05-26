"use client";

import { useState } from "react";

type Order = {
  id: string;
  order_no: string;
  product_kind: string | null;
  product_code: string | null;
  amount: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  status: string;
  pay_method: string | null;
  paid_at: string | null;
  created_at: string;
};

const HEADERS = [
  "주문ID",
  "주문번호",
  "상품종류",
  "상품코드",
  "결제금액",
  "구매자명",
  "연락처",
  "상태",
  "결제수단",
  "결제시각",
  "신청시각",
];

function quote(v: unknown): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export function AdminOrdersCsvButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/orders?all=true", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) throw new Error("export_failed");
      const json = (await response.json()) as { orders: Order[] };

      const rows: string[] = [HEADERS.map(quote).join(",")];
      for (const order of json.orders || []) {
        rows.push(
          [
            order.id,
            order.order_no,
            order.product_kind || "",
            order.product_code || "",
            order.amount ?? 0,
            order.buyer_name || "",
            order.buyer_phone || "",
            order.status,
            order.pay_method || "",
            order.paid_at || "",
            order.created_at,
          ]
            .map(quote)
            .join(",")
        );
      }

      const blob = new Blob(["﻿" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clcocloud_orders_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("CSV 내보내기에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-bold text-cream/80 transition hover:border-[#D97757] hover:text-cream disabled:opacity-60"
      >
        {busy ? "내보내는 중..." : "CSV 다운로드"}
      </button>
      {error ? <span className="text-[10px] text-[#F0E2D2]">{error}</span> : null}
    </div>
  );
}
