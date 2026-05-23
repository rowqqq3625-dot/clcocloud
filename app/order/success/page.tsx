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
  let issuedKeyData = null;
  let statusText = "결제 완료 처리 중입니다.";
  let descriptionText = "잠시만 기다려주시면 카카오 알림톡으로 API 키가 전송됩니다.";
  let isPendingKey = false;

  if (orderNo) {
    if (supabase) {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_no", orderNo)
        .single();
      
      if (data) {
        orderData = data;
        if (data.status === "paid") {
          statusText = "결제가 완료되었습니다.";
          if (data.product_kind === "balance") {
            descriptionText = "API 키와 상세 정보가 카카오 알림톡으로 발송되었습니다.";
            
            // 발급된 키 조회
            const { data: keyData } = await supabase
              .from("issued_api_keys")
              .select("fp16, last4")
              .eq("order_id", data.id)
              .maybeSingle();
            
            if (keyData) {
              issuedKeyData = keyData;
            }
          } else {
            descriptionText = "패키지 가입이 접수되었습니다. 운영자 확인 후 알림톡으로 연동 안내를 드리겠습니다.";
          }
        } else if (data.status === "paid_pending_key") {
          statusText = "결제 완료 (키 발급 대기)";
          descriptionText = "주문은 완료되었으나 일시적인 재고 부족으로 키 발급 대기 중입니다. 운영자가 확인 즉시 키를 발급하여 알림톡으로 보내드리겠습니다.";
          isPendingKey = true;
        } else if (data.status === "pending") {
          statusText = "결제 승인 처리 중";
          descriptionText = "결제 승인 결과를 반영하고 있습니다. 잠시 후 카카오 알림톡으로 결과를 전송해 드립니다.";
        } else {
          statusText = "결제 상태 확인 불가";
          descriptionText = "상세 주문 내역은 고객센터나 가입하신 대시보드에서 조회하실 수 있습니다.";
        }
      }
    }
  }

  return (
    <main className="min-h-screen bg-[var(--surface-dark)] text-[var(--cream)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Micro Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--coral)] opacity-5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-[var(--surface-dark-2)] rounded-[24px] border border-[rgba(232,224,210,0.06)] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10 animate-fade-in">
        {/* Pulsing Coral Check Icon */}
        <div className="w-16 h-16 rounded-full bg-[rgba(229,148,120,0.1)] flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 rounded-full border border-[var(--coral)] opacity-40 animate-ping" />
          <svg className="w-8 h-8 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--cream)] mb-3">
          {statusText}
        </h1>
        
        <p className="text-[var(--cream-soft)] text-sm md:text-base leading-relaxed mb-8 max-w-sm">
          {descriptionText}
        </p>

        {/* Order Details Panel */}
        {orderData && (
          <div className="w-full bg-[rgba(232,224,210,0.02)] border border-[rgba(232,224,210,0.04)] rounded-[16px] p-5 mb-8 text-left text-xs md:text-sm font-mono space-y-3">
            <div className="flex justify-between">
              <span className="text-[var(--cream-soft)]">주문번호</span>
              <span className="text-[var(--cream)] font-semibold">{orderData.order_no}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--cream-soft)]">상품명</span>
              <span className="text-[var(--cream)] font-semibold truncate max-w-[200px]">
                {orderData.product_code === "STANDARD" ? "스탠다드 플랜 ($200)" :
                 orderData.product_code === "PRO" ? "프로 플랜 ($500)" :
                 orderData.product_code === "ULTRA" ? "울트라 플랜 ($1,000)" : orderData.product_code}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--cream-soft)]">결제금액</span>
              <span className="text-[var(--coral)] font-bold">₩{orderData.amount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--cream-soft)]">구매자</span>
              <span className="text-[var(--cream)]">{orderData.buyer_name}</span>
            </div>
            {issuedKeyData && (
              <div className="flex justify-between border-t border-[rgba(232,224,210,0.06)] pt-3 mt-1">
                <span className="text-[var(--cream-soft)]">발급 API 키</span>
                <span className="text-[var(--cream)] font-semibold">{issuedKeyData.fp16}...{issuedKeyData.last4}</span>
              </div>
            )}
            <div className="border-t border-[rgba(232,224,210,0.06)] pt-3 mt-1 text-[11px] leading-relaxed text-[var(--cream-soft)]/70">
              <div className="font-semibold text-[var(--cream)] mb-1">💡 다음 단계 안내</div>
              {orderData.product_kind === "balance" ? (
                isPendingKey ? (
                  "재고가 확보되는 즉시 알림톡으로 전송되오니 조금만 기다려주시기 바랍니다."
                ) : (
                  "알림톡으로 즉시 전송된 공식 API 키를 환경변수에 등록하여 사용해 주세요."
                )
              ) : (
                "번들 구독 처리는 최대 24시간 내에 관리자가 확인하여 가이드와 함께 개별 연락드립니다."
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link 
          href="/dashboard" 
          className="w-full py-4 rounded-[16px] bg-[var(--coral)] hover:bg-[var(--coral-deep)] active:bg-[var(--coral-deep)] text-[var(--surface-dark)] font-bold text-center transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(229,148,120,0.25)]"
        >
          대시보드로 이동
        </Link>

        <Link 
          href="/" 
          className="mt-4 text-xs text-[var(--cream-soft)] hover:text-[var(--cream)] transition-colors duration-200"
        >
          메인 페이지로 돌아가기
        </Link>
      </div>
    </main>
  );
}
