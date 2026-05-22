"use client";

import React, { useState, useEffect } from "react";

interface Inquiry {
  id: string;
  inquiry_no: string;
  desired_usd: number;
  amount_krw: number;
  buyer_name: string;
  buyer_phone: string;
  memo: string | null;
  status: "open" | "contacted" | "completed" | "closed";
  created_at: string;
}

export default function InquiryList() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/admin/inquiries");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "문의 목록을 불러오지 못했습니다.");
      }
      setInquiries(data.inquiries || []);
    } catch (err: any) {
      setErrorMsg(err.message || "서버 통신 오류");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "상태 변경 실패");
      }

      // 로컬 상태 업데이트
      setInquiries((prev) =>
        prev.map((inq) => (inq.id === id ? { ...inq, status: newStatus as any } : inq))
      );
    } catch (err: any) {
      alert(err.message || "상태 변경 도중 에러가 발생했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  const maskPhone = (phone: string) => {
    if (!phone) return "";
    const clean = phone.replace(/[^0-9]/g, "");
    if (clean.length === 11) {
      return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
    } else if (clean.length === 10) {
      return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
    }
    return phone;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "open":
        return "border-coral text-coral bg-[rgba(229,148,120,0.04)]";
      case "contacted":
        return "border-amber-400 text-amber-600 bg-amber-50";
      case "completed":
        return "border-emerald-400 text-emerald-600 bg-emerald-50";
      case "closed":
        return "border-gray-300 text-gray-500 bg-gray-50";
      default:
        return "border-gray-200 text-gray-400";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "미처리";
      case "contacted":
        return "연락완료";
      case "completed":
        return "완료";
      case "closed":
        return "종결";
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="text-center py-10 text-xs text-[var(--cream-soft)] font-mono">문의 목록 로딩 중...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-4 border border-[var(--coral)] bg-[rgba(229,148,120,0.05)] text-coral rounded-[12px] text-xs leading-relaxed">
        {errorMsg}
      </div>
    );
  }

  return (
    <div className="bg-white border border-[rgba(15,14,13,0.08)] rounded-[20px] overflow-hidden shadow-sm font-sans">
      <div className="p-6 border-b border-[rgba(15,14,13,0.06)] flex justify-between items-center">
        <div>
          <h3 className="text-base font-bold text-[var(--surface-dark)]">대량 충전 문의 내역</h3>
          <p className="text-xs text-[var(--cream-soft)] mt-1">사용자 슬라이더를 통한 커스텀 문의 건 리스트</p>
        </div>
        <button
          onClick={fetchInquiries}
          className="p-2 border border-[rgba(15,14,13,0.1)] rounded-[10px] text-xs font-semibold text-[var(--surface-dark)] hover:bg-cream transition-all duration-200"
        >
          새로고침
        </button>
      </div>

      {inquiries.length === 0 ? (
        <div className="text-center py-12 text-sm text-[var(--cream-soft)]">접수된 문의 내역이 없습니다.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cream/40 border-b border-[rgba(15,14,13,0.06)] text-[var(--cream-soft)] font-semibold uppercase tracking-wider">
                <th className="p-4">문의번호</th>
                <th className="p-4">문의일자</th>
                <th className="p-4">이름</th>
                <th className="p-4">연락처</th>
                <th className="p-4">희망 금액</th>
                <th className="p-4">예상 결제액</th>
                <th className="p-4">메모</th>
                <th className="p-4">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(15,14,13,0.04)]">
              {inquiries.map((inq) => (
                <tr key={inq.id} className="hover:bg-cream/20 transition-colors">
                  <td className="p-4 font-mono font-bold text-[var(--surface-dark)]">{inq.inquiry_no}</td>
                  <td className="p-4 text-[var(--cream-soft)]">
                    {new Date(inq.created_at).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 font-semibold text-[var(--surface-dark)]">{inq.buyer_name}</td>
                  <td className="p-4 font-mono text-[var(--surface-dark)]">{maskPhone(inq.buyer_phone)}</td>
                  <td className="p-4 font-mono font-bold text-[var(--surface-dark)]">${inq.desired_usd.toLocaleString()}</td>
                  <td className="p-4 font-mono text-[var(--coral)] font-bold">₩{inq.amount_krw.toLocaleString()}원</td>
                  <td className="p-4 text-[var(--cream-soft)] max-w-xs truncate" title={inq.memo || ""}>
                    {inq.memo || "-"}
                  </td>
                  <td className="p-4">
                    <select
                      value={inq.status}
                      disabled={updatingId === inq.id}
                      onChange={(e) => handleStatusChange(inq.id, e.target.value)}
                      className={`px-3 py-1.5 border rounded-full font-bold focus:outline-none transition-all duration-200 cursor-pointer ${getStatusBadgeClass(
                        inq.status
                      )}`}
                    >
                      <option value="open">미처리</option>
                      <option value="contacted">연락완료</option>
                      <option value="completed">완료</option>
                      <option value="closed">종결</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
