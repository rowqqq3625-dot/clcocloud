"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface OrderDetail {
  order_no: string;
  product_code: string;
  amount: number;
  buyer_name: string;
  buyer_phone: string;
}

export default function SimulationPage() {
  // Next.js 14 정적 생성 요구사항: useSearchParams는 Suspense 경계 안에 있어야 함
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>로딩 중...</div>}>
      <SimulationPageInner />
    </Suspense>
  );
}

function SimulationPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderNo = searchParams.get("orderNo");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!orderNo) {
      setMessage("주문 번호가 누락되었습니다.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/info?orderNo=${orderNo}`);
        if (!res.ok) {
          throw new Error("주문 정보를 불러올 수 없습니다.");
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setMessage(err.message || "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderNo]);

  const handleSimulatePayment = async (success: boolean) => {
    if (!order) return;
    setProcessing(true);
    setMessage(success ? "결제 완료 시뮬레이션을 전송 중입니다..." : "결제 실패 시뮬레이션을 전송 중입니다...");

    try {
      const mockMulNo = `MOCK_SIM_${success ? "SUCCESS" : "FAIL"}_${Date.now()}`;
      const payState = success ? "4" : "64";

      // Form URL-encoded parameters for PayApp webhook simulation
      const formData = new URLSearchParams();
      formData.append("pay_state", payState);
      formData.append("mul_no", mockMulNo);
      formData.append("linkval", "MOCK_SIGNATURE");
      formData.append("var1", order.order_no);
      formData.append("price", String(order.amount));
      formData.append("recvphone", "01058503625");
      formData.append("state_msg", success ? "" : "테스트 결제 실패 시뮬레이션");

      const res = await fetch("/api/payapp/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      if (res.ok) {
        if (success) {
          if (order.product_code === "ULTRA") {
            setMessage("⚠️ 결제 완료 및 재고 부족 시뮬레이션 성공! 운영자 알림톡(ADMIN_LOW_STOCK)만 발송되었습니다. 3초 후 이동합니다.");
          } else {
            setMessage("🎉 결제 및 키 발급 완료 시뮬레이션 성공! 구매자(PAY_DONE_KEY_DELIVERY) 및 운영자(ADMIN_PAY_DONE) 알림톡이 발송되었습니다. 3초 후 이동합니다.");
          }
        } else {
          setMessage("❌ 결제 실패/취소 시뮬레이션 성공! 알림톡 발송 없이 DB 로그(PAY_FAIL_LOGGED)만 남겼습니다. 3초 후 이동합니다.");
        }
        
        setTimeout(() => {
          if (success) {
            router.push(`/order/success?orderNo=${order.order_no}`);
          } else {
            router.push(`/order/fail?orderNo=${order.order_no}`);
          }
        }, 3000);
      } else {
        setMessage("시뮬레이션 전송 중 웹훅 엔드포인트 응답 오류가 발생했습니다.");
        setProcessing(false);
      }
    } catch (err: any) {
      setMessage(`에러: ${err.message || "네트워크 오류"}`);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F1E8] flex flex-col items-center justify-center p-6 text-[#1F1E1D]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D97757]"></div>
        <p className="mt-4 font-medium text-lg">주문 데이터를 로드하고 있습니다...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F1E8] flex flex-col items-center justify-center p-6 text-[#1F1E1D]">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#F0E2D2] max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-[#D97757] mb-4 font-outfit">Error</h2>
          <p className="text-gray-600 mb-6">{message || "주문을 찾을 수 없습니다."}</p>
          <button 
            onClick={() => router.push("/")}
            className="w-full bg-[#1F1E1D] text-[#F7F1E8] py-3 rounded-xl font-semibold hover:bg-black transition"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F1E8] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-[#F0E2D2] p-8 rounded-2xl shadow-xl border border-[#e5d4c0] max-w-lg w-full text-[#1F1E1D]">
        <div className="text-center mb-8">
          <span className="inline-block bg-[#D97757] text-[#F7F1E8] px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
            Developer Simulator
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight">테스트 결제 시뮬레이션</h1>
          <p className="text-sm text-gray-600 mt-2">김정후 대표님 주문 전용 가상 테스트 환경</p>
        </div>

        <div className="bg-[#F7F1E8] p-5 rounded-xl border border-[#e5d4c0] mb-6 space-y-3.5">
          <h3 className="font-bold text-lg border-b border-[#e5d4c0] pb-2 text-[#D97757]">주문 요약 정보</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">주문 번호</span>
            <span className="font-semibold font-mono">{order.order_no}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">상품명</span>
            <span className="font-semibold">{order.product_code} 플랜</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">결제 금액</span>
            <span className="font-semibold text-lg text-[#D97757]">{order.amount.toLocaleString("ko-KR")}원</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">구매자명</span>
            <span className="font-semibold">{order.buyer_name} (테스터)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">휴대폰 번호</span>
            <span className="font-semibold font-mono">010-5850-3625 (마스킹: {order.buyer_phone})</span>
          </div>
        </div>

        {message && (
          <div className="bg-[#1F1E1D] text-[#F7F1E8] p-4 rounded-xl text-center text-sm font-medium mb-6 animate-pulse">
            {message}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleSimulatePayment(true)}
            disabled={processing}
            className="bg-[#D97757] hover:bg-[#c66242] text-white py-4 rounded-xl font-bold transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            결제 완료 시뮬레이션
          </button>
          <button
            onClick={() => handleSimulatePayment(false)}
            disabled={processing}
            className="bg-[#1F1E1D] hover:bg-black text-[#F7F1E8] py-4 rounded-xl font-bold transition duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-center"
          >
            결제 실패 시뮬레이션
          </button>
        </div>

        <div className="mt-8 bg-[#F7F1E8] p-4 rounded-xl border border-[#e5d4c0] text-xs text-gray-600 space-y-2">
          <p className="font-bold text-[#D97757]">💡 시나리오 팁</p>
          <p>• **성공 케이스**: `STANDARD` 또는 `PRO` 플랜으로 주문 후 결제 완료 시, 구매자(키 발급) 및 운영자(완료 알림) 알림톡이 각각 1건씩 총 2건 발송됩니다.</p>
          <p>• **재고 부족 케이스**: `ULTRA` 플랜으로 주문 후 결제 완료 시, 재고 부족 모드가 작동하여 운영자에게만 저재고 알림(ADMIN_LOW_STOCK)이 1건 발송되고, 구매자는 보류 상태로 대기합니다.</p>
          <p>• **실패 케이스**: 결제 실패 시뮬레이션 클릭 시, 어떠한 알림톡도 발송되지 않으며 `notification_logs` 테이블에 `PAY_FAIL_LOGGED` 타입으로 기록됩니다.</p>
        </div>
      </div>
    </div>
  );
}
