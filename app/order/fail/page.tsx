import Link from "next/link";

interface FailPageProps {
  searchParams: {
    orderNo?: string;
    errorMsg?: string;
  };
}

export default function OrderFailPage({ searchParams }: FailPageProps) {
  const errorMsg = searchParams.errorMsg || "결제 진행 중 오류가 발생했거나 한도가 초과되었습니다.";
  const orderNo = searchParams.orderNo || "";

  // 사용자 친화적인 에러 문구로 순화 (provider 원문 노출 방지)
  let userFriendlyError = "결제가 정상적으로 완료되지 않았습니다.";
  if (errorMsg.includes("한도") || errorMsg.includes("limit")) {
    userFriendlyError = "결제 한도가 초과되었거나 잔액이 부족합니다.";
  } else if (errorMsg.includes("취소") || errorMsg.includes("cancel")) {
    userFriendlyError = "사용자에 의해 결제 요청이 취소되었습니다.";
  } else if (errorMsg.includes("재고") || errorMsg.includes("stock")) {
    userFriendlyError = "죄송합니다. 선택하신 상품의 재고가 일시적으로 부족하여 결제가 취소되었습니다.";
  } else {
    userFriendlyError = "카드 정보 오류 또는 결제 대행사 통신 오류입니다. 카드사 확인 후 다시 시도해 주세요.";
  }

  return (
    <main className="min-h-screen bg-[var(--surface-dark)] text-[var(--cream)] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Micro Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--coral)] opacity-3 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-[var(--surface-dark-2)] rounded-[24px] border border-[rgba(232,224,210,0.06)] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10 animate-fade-in">
        {/* Coral Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-[rgba(229,148,120,0.08)] flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--cream)] mb-3">
          결제에 실패했습니다.
        </h1>
        
        <p className="text-[var(--cream-soft)] text-sm md:text-base leading-relaxed mb-8 max-w-sm">
          {userFriendlyError}
        </p>

        {/* Info Panel */}
        <div className="w-full bg-[rgba(232,224,210,0.02)] border border-[rgba(232,224,210,0.04)] rounded-[16px] p-5 mb-8 text-left text-xs md:text-sm font-mono space-y-3">
          {orderNo && (
            <div className="flex justify-between">
              <span className="text-[var(--cream-soft)]">임시 주문번호</span>
              <span className="text-[var(--cream)]">{orderNo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[var(--cream-soft)]">문의 메일</span>
            <span className="text-[var(--cream)]">support.clcocloud@gmail.com</span>
          </div>
        </div>

        {/* Action Button */}
        <Link 
          href="/" 
          className="w-full py-4 rounded-[16px] bg-[rgba(232,224,210,0.08)] hover:bg-[rgba(232,224,210,0.12)] active:bg-[rgba(232,224,210,0.12)] text-[var(--cream)] border border-[rgba(232,224,210,0.15)] font-bold text-center transition-all duration-300 shadow-md"
        >
          다시 결제하기
        </Link>
      </div>
    </main>
  );
}
