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

  // User-friendly error message resolution
  let userFriendlyError = "결제가 정상적으로 완료되지 않았습니다.";
  if (errorMsg.includes("한도") || errorMsg.includes("limit")) {
    userFriendlyError = "결제 한도가 초과되었거나 카드 한도 부족입니다.";
  } else if (errorMsg.includes("취소") || errorMsg.includes("cancel")) {
    userFriendlyError = "사용자 취소로 인해 결제가 중단되었습니다.";
  } else if (errorMsg.includes("재고") || errorMsg.includes("stock")) {
    userFriendlyError = "선택하신 상품의 재고가 부족합니다. 고객센터 또는 카카오 채널로 문의해 주시기 바랍니다.";
  } else {
    userFriendlyError = "결제 승인 처리 중 일시적인 네트워크 오류 또는 한도/잔액 초과가 발생했습니다. 다시 시도해 주세요.";
  }

  return (
    <main className="min-h-screen bg-[#1F1E1D] text-[#F7F1E8] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Micro Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#D97757] opacity-3 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full bg-[#1F1E1D] rounded-[24px] border border-[rgba(247,241,232,0.06)] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center relative z-10 animate-fade-in">
        {/* Coral Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-[rgba(217,119,87,0.08)] flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-[#D97757]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F7F1E8] mb-3">
          결제에 실패했습니다.
        </h1>
        
        <p className="text-[#F0E2D2] text-sm md:text-base opacity-80 leading-relaxed mb-8 max-w-sm">
          {userFriendlyError}
        </p>

        {/* Info Panel */}
        <div className="w-full bg-[rgba(247,241,232,0.02)] border border-[rgba(247,241,232,0.04)] rounded-[16px] p-5 mb-8 text-left text-xs md:text-sm font-mono space-y-3">
          {orderNo && (
            <div className="flex justify-between">
              <span className="text-[#F0E2D2] opacity-70">주문번호</span>
              <span className="text-[#F7F1E8]">{orderNo}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-[#F0E2D2] opacity-70">문의 채널</span>
            <span className="text-[#F7F1E8]">카카오톡 @클코클라우드 채널</span>
          </div>
        </div>

        {/* Action Button */}
        <Link 
          href="/#pricing" 
          className="w-full py-4 rounded-[16px] bg-[rgba(247,241,232,0.08)] hover:bg-[rgba(247,241,232,0.12)] active:bg-[rgba(247,241,232,0.12)] text-[#F7F1E8] border border-[rgba(247,241,232,0.15)] font-bold text-center transition-all duration-300 shadow-md"
        >
          다시 결제하기
        </Link>
      </div>
    </main>
  );
}
