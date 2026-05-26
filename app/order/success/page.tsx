import Link from "next/link";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";

interface SuccessPageProps {
  searchParams: {
    orderNo?: string;
  };
}

export default async function OrderSuccessPage({ searchParams }: SuccessPageProps) {
  const orderNo = searchParams.orderNo || "";
  let orderData = null;
  let maskedApiKey = "";
  let statusText = "결제 완료 처리 중입니다.";
  let descriptionText = "잠시만 기다려주시면 카카오 알림톡으로 API 키가 전송됩니다.";
  let isPendingKey = false;

  if (orderNo && supabase) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .maybeSingle();
    
    if (data) {
      orderData = data;
      if (data.status === "paid") {
        statusText = "결제가 완료되었습니다.";
        descriptionText = "API 키와 상세 정보가 카카오 알림톡으로 즉시 발송되었습니다.";
        
        // Fetch issued key details securely
        const { data: keyMapping } = await supabase
          .from("issued_api_keys")
          .select("key_id")
          .eq("order_no", orderNo)
          .maybeSingle();
        
        if (keyMapping?.key_id) {
          const { data: inventoryKey } = await supabase
            .from("api_key_inventory")
            .select("key_value")
            .eq("id", keyMapping.key_id)
            .maybeSingle();

          if (inventoryKey?.key_value) {
            // Mask the key securely: first 8 chars + ***
            maskedApiKey = inventoryKey.key_value.slice(0, 8) + "***";
          }
        }
      } else if (data.status === "paid_pending_key") {
        statusText = "결제 완료 (키 발급 대기)";
        descriptionText = "주문 결제는 완료되었으나 일시적인 재고 부족으로 키 발급 대기 중입니다. 운영자가 확인하는 즉시 키를 발급하여 알림톡으로 전송해 드리겠습니다.";
        isPendingKey = true;
      } else if (data.status === "pending") {
        statusText = "결제 승인 처리 중";
        descriptionText = "결제 승인 결과를 반영하고 있습니다. 잠시 후 카카오 알림톡으로 승인 완료 메시지가 전송됩니다.";
      } else if (data.status === "failed") {
        statusText = "결제 실패 또는 취소";
        descriptionText = "결제가 완료되지 않았거나 취소되었습니다. 다시 시도해 주시기 바랍니다.";
      } else if (data.status === "refunded") {
        statusText = "결제 환불 완료";
        descriptionText = "해당 주문건의 결제 금액이 정상적으로 환불 처리되었습니다.";
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#1F1E1D] text-[#F7F1E8] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Micro Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D97757] opacity-5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#1F1E1D] rounded-[24px] border border-[rgba(247,241,232,0.06)] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10">
        
        {/* Pulsing Coral Check Icon */}
        <div className="w-16 h-16 rounded-full bg-[rgba(217,119,87,0.1)] flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 rounded-full border border-[#D97757] opacity-40 animate-ping" />
          <svg className="w-8 h-8 text-[#D97757]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F7F1E8] mb-3">
          {statusText}
        </h1>
        
        <p className="text-[#F0E2D2] text-sm md:text-base opacity-80 leading-relaxed mb-8 max-w-sm">
          {descriptionText}
        </p>

        {/* Order Details Panel */}
        {orderData && (
          <div className="w-full bg-[rgba(247,241,232,0.02)] border border-[rgba(247,241,232,0.04)] rounded-[16px] p-5 mb-8 text-left text-xs md:text-sm font-mono space-y-3">
            <div className="flex justify-between">
              <span className="text-[#F0E2D2] opacity-70">주문번호</span>
              <span className="text-[#F7F1E8] font-semibold">{orderData.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F0E2D2] opacity-70">상품명</span>
              <span className="text-[#F7F1E8] font-semibold truncate max-w-[200px]">
                {orderData.product_code === "STANDARD" ? "스탠다드 플랜 ($200)" :
                 orderData.product_code === "PRO" ? "프로 플랜 ($500)" :
                 orderData.product_code === "ULTRA" ? "울트라 플랜 ($1,000)" : orderData.product_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F0E2D2] opacity-70">결제금액</span>
              <span className="text-[#D97757] font-bold">₩{orderData.amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#F0E2D2] opacity-70">구매자</span>
              <span className="text-[#F7F1E8]">{orderData.buyer_name}</span>
            </div>
            {maskedApiKey && (
              <div className="flex justify-between border-t border-[rgba(247,241,232,0.06)] pt-3 mt-1">
                <span className="text-[#F0E2D2] opacity-70">발급 API 키</span>
                <span className="text-[#F7F1E8] font-semibold">{maskedApiKey}</span>
              </div>
            )}
            <div className="border-t border-[rgba(247,241,232,0.06)] pt-3 mt-1 text-[11px] leading-relaxed text-[#F0E2D2] opacity-60">
              <div className="font-semibold text-[#F7F1E8] mb-1">💡 이용 안내</div>
              {isPendingKey ? (
                "재고가 확보되는 즉시 영업일 기준 10분 내로 카카오 알림톡으로 전송되오니 안심하고 기다려주세요."
              ) : (
                "카카오톡 메시지로 수신된 나의 API 키를 복사하여 대시보드나 클로드코드 연동에 사용하시면 됩니다."
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link 
          href="/dashboard" 
          className="w-full py-4 rounded-[16px] bg-[#D97757] hover:bg-[#c66242] text-white font-bold text-center transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(217,119,87,0.25)]"
        >
          대시보드로 이동
        </Link>

        <Link 
          href="/" 
          className="mt-4 text-xs text-[#F0E2D2] opacity-80 hover:opacity-100 transition-opacity duration-200"
        >
          메인 페이지로 돌아가기
        </Link>
      </div>
    </main>
  );
}
