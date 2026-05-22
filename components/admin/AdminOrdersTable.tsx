"use client";

import React, { useState, useEffect } from "react";

interface Order {
  id: string;
  order_no: string;
  product_kind: "balance" | "bundle" | "topup_custom";
  product_code: string;
  amount: number;
  buyer_name: string;
  buyer_phone: string;
  status: "pending" | "paid" | "paid_pending_key" | "failed" | "cancelled" | "refunded";
  pay_method: string | null;
  payapp_mul_no: string | null;
  paid_at: string | null;
  created_at: string;
}

interface IssuedKey {
  id: string;
  fp16: string;
  last4: string;
  initial_balance: number;
  issued_at: string;
}

interface AlimtalkLog {
  id: string;
  template_code: string;
  recipient: string;
  phone: string;
  result: string;
  sent_at: string;
}

export function AdminOrdersTable({ initialOrders = [] }: { initialOrders?: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  
  // 상세 정보 팝업
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<{
    order: Order;
    issuedKeys: IssuedKey[];
    alimtalkLogs: AlimtalkLog[];
  } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrders = async (status: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${status}`);
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(statusFilter);
  }, [statusFilter]);

  const loadOrderDetail = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?orderId=${orderId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setOrderDetail(data);
      }
    } catch (err) {
      console.error("Failed to load order details", err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrderId(null);
    setOrderDetail(null);
  };

  const handleCsvExport = async () => {
    try {
      const res = await fetch("/api/admin/orders?all=true");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "데이터 호출 실패");

      const headers = [
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
      const csvRows = [headers.join(",")];

      json.orders.forEach((o: Order) => {
        const row = [
          o.id,
          o.order_no || "",
          o.product_kind || "",
          o.product_code || "",
          o.amount,
          o.buyer_name || "",
          o.buyer_phone || "",
          o.status,
          o.pay_method || "",
          o.paid_at || "",
          o.created_at,
        ].map((val) => `"${String(val).replace(/"/g, '""')}"`);
        csvRows.push(row.join(","));
      });

      const blob = new Blob(["\ufeff" + csvRows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `clcocloud_orders_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert("CSV 내보내기 에러: " + err.message);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "결제 대기";
      case "paid":
        return "결제 완료";
      case "paid_pending_key":
        return "키 대기";
      case "failed":
        return "실패";
      case "cancelled":
        return "취소";
      case "refunded":
        return "환불";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "paid":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "paid_pending_key":
        return "bg-[rgba(229,148,120,0.1)] text-[var(--coral)] border-[var(--coral)]/20 animate-pulse";
      case "failed":
      case "cancelled":
        return "bg-gray-100 text-gray-600 border-gray-200";
      case "refunded":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="font-sans">
      {/* 필터 및 CSV 내보내기 툴바 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex gap-2 flex-wrap">
          {["all", "pending", "paid", "paid_pending_key", "failed", "cancelled"].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                statusFilter === filter
                  ? "bg-[var(--coral)] text-white border-[var(--coral)]"
                  : "bg-white text-[var(--surface-dark)] border-[rgba(15,14,13,0.1)] hover:bg-cream"
              }`}
            >
              {filter === "all" ? "전체 보기" : getStatusLabel(filter)}
            </button>
          ))}
        </div>
        
        <button
          onClick={handleCsvExport}
          className="px-4 py-2 border border-[rgba(15,14,13,0.15)] rounded-[10px] text-xs font-bold text-[var(--surface-dark)] bg-white hover:bg-cream transition-all duration-200 flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-[var(--cream-soft)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          주문 내역 CSV 다운로드
        </button>
      </div>

      {/* 테이블 쉘 */}
      <div className="overflow-hidden rounded-[24px] border border-[rgba(15,14,13,0.08)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream/40 border-b border-[rgba(15,14,13,0.06)] text-[var(--cream-soft)] font-semibold uppercase tracking-wider">
                <th className="p-4">주문번호</th>
                <th className="p-4">상품 정보</th>
                <th className="p-4">결제금액</th>
                <th className="p-4">구매자명</th>
                <th className="p-4">연락처</th>
                <th className="p-4">상태</th>
                <th className="p-4">생성시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,14,13,0.04)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[var(--cream-soft)] font-mono">로딩 중...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-[var(--cream-soft)]">해당 주문 내역이 없습니다.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => loadOrderDetail(order.id)}
                    className="hover:bg-cream/20 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono font-bold text-[var(--surface-dark)]">{order.order_no}</td>
                    <td className="p-4">
                      <span className="font-semibold text-[var(--surface-dark)]">{order.product_code}</span>
                      <span className="text-[10px] text-[var(--cream-soft)] block uppercase mt-0.5">
                        {order.product_kind === "balance" ? "API 키 충전" : "구독 패키지"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-[var(--surface-dark)]">₩{order.amount.toLocaleString()}원</td>
                    <td className="p-4 font-semibold text-[var(--surface-dark)]">{order.buyer_name}</td>
                    <td className="p-4 font-mono text-[var(--cream-soft)]">
                      {order.buyer_phone.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 border text-[10px] font-bold rounded-full ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="p-4 text-[var(--cream-soft)]">
                      {new Date(order.created_at).toLocaleString("ko-KR", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주문 상세 패널 모달 */}
      {selectedOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={handleCloseDetail}>
          <div
            className="w-full max-w-lg bg-white rounded-[24px] shadow-2xl p-6 md:p-8 relative overflow-hidden flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 닫기 버튼 */}
            <button
              onClick={handleCloseDetail}
              className="absolute top-4 right-4 text-[var(--cream-soft)] hover:text-[var(--surface-dark)] p-1 rounded-full hover:bg-cream transition"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {detailLoading ? (
              <div className="py-20 text-center text-xs text-[var(--cream-soft)] font-mono">주문 정보를 불러오고 있습니다...</div>
            ) : orderDetail ? (
              <div className="space-y-6 overflow-y-auto pr-1">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-[var(--coral)] uppercase block mb-1">· ORDER DETAILS</span>
                  <h3 className="text-lg font-bold text-[var(--surface-dark)]">주문 상세 내역</h3>
                </div>

                {/* 주문 기본정보 */}
                <div className="bg-cream/30 border border-[rgba(15,14,13,0.05)] rounded-[16px] p-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">주문번호</span>
                    <span className="text-xs font-mono font-bold text-[var(--surface-dark)]">{orderDetail.order.order_no}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">상품명 / 코드</span>
                    <span className="text-xs font-semibold text-[var(--surface-dark)]">{orderDetail.order.product_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">결제 금액</span>
                    <span className="text-xs font-mono font-bold text-[var(--coral)]">₩{orderDetail.order.amount.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">구매자 성함</span>
                    <span className="text-xs font-semibold text-[var(--surface-dark)]">{orderDetail.order.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">연락처</span>
                    <span className="text-xs font-mono text-[var(--surface-dark)]">{orderDetail.order.buyer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">결제 수단</span>
                    <span className="text-xs text-[var(--surface-dark)]">{orderDetail.order.pay_method || "미확인"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[11px] text-[var(--cream-soft)]">상태</span>
                    <span className={`px-2 py-0.5 border text-[10px] font-bold rounded-full ${getStatusColor(orderDetail.order.status)}`}>
                      {getStatusLabel(orderDetail.order.status)}
                    </span>
                  </div>
                  {orderDetail.order.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-[11px] text-[var(--cream-soft)]">결제 시각</span>
                      <span className="text-xs text-[var(--surface-dark)]">{new Date(orderDetail.order.paid_at).toLocaleString("ko-KR")}</span>
                    </div>
                  )}
                </div>

                {/* 발급된 API 키 */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--surface-dark)] mb-2.5">발급된 API 키</h4>
                  {orderDetail.issuedKeys.length === 0 ? (
                    <div className="text-[11px] text-[var(--cream-soft)] py-2">발급된 API 키가 없습니다. (결제 전이거나 대기 중)</div>
                  ) : (
                    <div className="space-y-2">
                      {orderDetail.issuedKeys.map((key) => (
                        <div key={key.id} className="p-3 border border-[rgba(15,14,13,0.06)] rounded-[12px] flex justify-between items-center text-xs font-mono">
                          <div>
                            <span className="text-[11px] text-[var(--surface-dark)] font-bold">{key.fp16}...{key.last4}</span>
                            <span className="text-[9px] text-[var(--cream-soft)] block mt-0.5">초기 잔액: ${key.initial_balance.toLocaleString()}</span>
                          </div>
                          <span className="text-[10px] text-[var(--cream-soft)]">
                            {new Date(key.issued_at).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 알림톡 발송 로그 */}
                <div>
                  <h4 className="text-xs font-bold text-[var(--surface-dark)] mb-2.5">카카오 알림톡 발송 이력</h4>
                  {orderDetail.alimtalkLogs.length === 0 ? (
                    <div className="text-[11px] text-[var(--cream-soft)] py-2">발송 이력이 없습니다.</div>
                  ) : (
                    <div className="space-y-2">
                      {orderDetail.alimtalkLogs.map((log) => (
                        <div key={log.id} className="p-3 border border-[rgba(15,14,13,0.06)] bg-cream/10 rounded-[12px] flex justify-between items-start text-xs font-sans">
                          <div>
                            <div className="font-bold text-[var(--surface-dark)]">
                              {log.template_code}
                              <span className="text-[9px] text-[var(--cream-soft)] font-normal ml-2">({log.recipient === "buyer" ? "구매자" : "운영자"})</span>
                            </div>
                            <div className="text-[10px] text-[var(--cream-soft)] font-mono mt-1">{log.phone}</div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-0.5 text-[9px] font-bold border rounded-full ${
                              log.result === "success" 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                                : "bg-red-50 text-red-600 border-red-100"
                            }`}>
                              {log.result === "success" ? "성공" : "실패"}
                            </span>
                            <span className="text-[9px] text-[var(--cream-soft)] font-mono block mt-1">
                              {new Date(log.sent_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-xs text-red-500">주문 상세 정보를 가져오는데 실패했습니다.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
