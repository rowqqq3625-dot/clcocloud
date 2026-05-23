"use client";
/* eslint-disable @next/next/no-img-element */


import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productKind: "balance" | "bundle";
  productCode: string;
  price: number;
  productName: string;
}

// Deep Coral Custom Circular Checkbox matching the Anthropic style
const CoralCircularCheck = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`w-5 h-5 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${checked ? "bg-[#D95F3B] shadow-[0_2px_8px_rgba(217,119,87,0.35)] scale-105" : "bg-white border-2 border-[#EAE5DB] hover:border-[#D95F3B]/50"}`}
  >
    <svg 
      width="9" 
      height="7" 
      viewBox="0 0 10 8" 
      fill="none" 
      stroke="white" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      className={`transition-transform duration-250 ${checked ? "scale-100" : "scale-0"}`}
    >
      <path d="M1 4L3.5 6L9 1" />
    </svg>
  </div>
);

export default function CheckoutModal({
  isOpen,
  onClose,
  productKind,
  productCode,
  price,
  productName,
}: CheckoutModalProps) {
  const [step, setStep] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [agreedTerms1, setAgreedTerms1] = useState(false);
  const [agreedTerms2, setAgreedTerms2] = useState(false);
  const [agreedTerms3, setAgreedTerms3] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>(""); // default empty
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const agreedAll = agreedTerms1 && agreedTerms2 && agreedTerms3;

  // Prevent background scrolling and interaction when modal is open (with Lenis freeze support)
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.height = "100vh";
      document.body.style.touchAction = "none";
      document.documentElement.style.touchAction = "none";
      document.body.style.pointerEvents = "none";

      // Force-block scrolling and touch events on window level
      window.addEventListener("wheel", preventDefault, { passive: false });
      window.addEventListener("touchmove", preventDefault, { passive: false });
      window.addEventListener("mousewheel", preventDefault, { passive: false });
      window.addEventListener("DOMMouseScroll", preventDefault, { passive: false });

      // Freeze Lenis smooth scroll globally
      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.stop();
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
      document.body.style.pointerEvents = "";

      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("mousewheel", preventDefault);
      window.removeEventListener("DOMMouseScroll", preventDefault);

      // Reactivate Lenis smooth scroll
      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.start();
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
      document.body.style.touchAction = "";
      document.documentElement.style.touchAction = "";
      document.body.style.pointerEvents = "";

      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);
      window.removeEventListener("mousewheel", preventDefault);
      window.removeEventListener("DOMMouseScroll", preventDefault);

      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.start();
      }
    };
  }, [isOpen]);

  // Reset states on open/close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setDirection(1);
      setBuyerName("");
      setBuyerPhone("");
      setAgreedTerms1(false);
      setAgreedTerms2(false);
      setAgreedTerms3(false);
      setSelectedMethod("");
      setErrorMsg("");
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Retrieve pricing USD amount dynamically
  const getBalanceUSD = () => {
    const code = productCode.toUpperCase();
    if (code.includes("STANDARD")) return "$200";
    if (code.includes("PRO")) return "$500";
    if (code.includes("ULTRA")) return "$1,000";
    const calculated = Math.round(price / 490);
    return `$${calculated.toLocaleString()}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.replace(/[^0-9]/g, "");
    if (clean.length <= 3) {
      setBuyerPhone(clean);
    } else if (clean.length <= 7) {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3)}`);
    } else {
      setBuyerPhone(`${clean.slice(0, 3)}-${clean.slice(3, 7)}-${clean.slice(7, 11)}`);
    }
  };

  // Step transitions
  const goToNextStep = (next: number) => {
    setDirection(1);
    setStep(next);
  };

  const goToPrevStep = (prev: number) => {
    setDirection(-1);
    setStep(prev);
  };

  const handleStep1Submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    if (!buyerName.trim()) {
      setErrorMsg("이름을 입력해주세요.");
      return;
    }

    const phoneClean = buyerPhone.replace(/[^0-9]/g, "");
    if (!phoneClean || phoneClean.length < 10 || phoneClean.length > 11) {
      setErrorMsg("올바른 휴대폰 번호를 입력해주세요.");
      return;
    }

    if (!agreedTerms1 || !agreedTerms2 || !agreedTerms3) {
      setErrorMsg("이용약관 및 정책에 동의해야 결제를 진행할 수 있습니다.");
      return;
    }

    goToNextStep(2);
  };

  const handleFinalSubmit = async () => {
    setErrorMsg("");
    const phoneClean = buyerPhone.replace(/[^0-9]/g, "");
    setIsLoading(true);

    try {
      const response = await fetch("/api/payapp/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productKind,
          productCode,
          buyerName: buyerName.trim(),
          buyerPhone: phoneClean,
          agreedTerms: true,
          paymentMethod: selectedMethod,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "결제 처리 중 서버 오류가 발생했습니다.");
      }

      if (data.success && data.payUrl && data.orderNo) {
        const payWindow = window.open(
          data.payUrl,
          "payapp",
          "width=650,height=800,status=yes,scrollbars=yes,resizable=yes"
        );

        if (!payWindow || payWindow.closed || typeof payWindow.closed === "undefined") {
          throw new Error("팝업 차단이 활성화되어 결제창을 열 수 없습니다. 브라우저 설정에서 팝업 차단을 해제한 뒤 다시 시도해주세요.");
        }

        const orderNo = data.orderNo;
        let pollCount = 0;
        const maxPolls = 450; // 15분

        const checkOrderStatus = async () => {
          try {
            const statusRes = await fetch(`/api/orders?orderNo=${orderNo}`);
            if (statusRes.ok) {
              const statusData = await statusRes.json();
              return statusData.status;
            }
          } catch (e) {
            console.error("Order status check failed:", e);
          }
          return "pending";
        };

        const intervalId = setInterval(async () => {
          pollCount++;
          const status = await checkOrderStatus();

          if (status === "paid" || status === "paid_pending_key") {
            clearInterval(intervalId);
            try { payWindow.close(); } catch (e) {}
            window.location.href = `/order/success?orderNo=${orderNo}`;
            return;
          }

          if (status === "failed") {
            clearInterval(intervalId);
            try { payWindow.close(); } catch (e) {}
            window.location.href = `/order/fail?orderNo=${orderNo}&errorMsg=결제가 승인되지 않았거나 취소되었습니다.`;
            return;
          }

          if (payWindow.closed) {
            clearInterval(intervalId);
            const finalStatus = await checkOrderStatus();
            if (finalStatus === "paid" || finalStatus === "paid_pending_key") {
              window.location.href = `/order/success?orderNo=${orderNo}`;
            } else {
              window.location.href = `/order/fail?orderNo=${orderNo}&errorMsg=결제창이 종료되었습니다.`;
            }
            return;
          }

          if (pollCount >= maxPolls) {
            clearInterval(intervalId);
            try { payWindow.close(); } catch (e) {}
            window.location.href = `/order/fail?orderNo=${orderNo}&errorMsg=결제 가능 시간이 초과되었습니다. 다시 시도해 주세요.`;
            return;
          }
        }, 2000);

      } else {
        throw new Error("결제 페이지 생성에 실패했습니다.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "결제 연동 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  // Animation configuration
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 250 : -250,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 250 : -250,
      opacity: 0,
    }),
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#1A1816]/75 backdrop-blur-md p-4 overflow-hidden pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: "auto" }}
      data-lenis-prevent // Prevents scroll leaks
    >
      {/* Luxury Wizard Card */}
      <div 
        className="w-full max-w-[390px] min-h-[580px] max-h-[92vh] bg-gradient-to-br from-[#FCFBF9] to-[#FAF8F5] border border-[#EBE7DF] rounded-[32px] shadow-[0_32px_80px_rgba(27,25,23,0.14)] relative flex flex-col p-6 overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right Step Indicators (Anthropic Coral Themed) */}
        <div className="absolute top-7 right-14 flex items-center gap-1.5 z-20">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 1 ? "bg-[#D95F3B]" : "bg-[#EAE5DB]"}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 2 ? "bg-[#D95F3B]" : "bg-[#EAE5DB]"}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 3 ? "bg-[#D95F3B]" : "bg-[#EAE5DB]"}`} />
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-[#1F1E1D]/40 hover:text-[#1F1E1D] transition-colors p-2 rounded-full hover:bg-black/5 z-20"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        {/* Space clearing the top indicators */}
        <div className="h-6 w-full shrink-0" />

        {/* Wizard step transition area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            
            {/* ==================== STEP 1 ==================== */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Section Title */}
                  <div className="text-[11px] text-[#8C8881] font-bold uppercase tracking-wider mb-2.5">주문 상품 정보</div>
                  
                  {/* Product block (Character next to price) */}
                  <div className="flex justify-between items-start bg-gradient-to-r from-[#FFFDFB] to-[#FDFBF7] border border-[#F2ECE1] rounded-2xl p-4 shadow-sm">
                    <div>
                      <h3 className="text-[16px] font-bold text-[#1F1E1D] leading-tight font-sans tracking-tight">{productName}</h3>
                      <div className="text-[23px] font-extrabold text-[#D95F3B] mt-2 font-mono">₩{price.toLocaleString()}</div>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src="/character.png" 
                      alt="character" 
                      className="w-12 h-12 object-contain select-none shrink-0 drop-shadow-sm animate-subtle-bob" 
                    />
                  </div>

                  {/* Seller Table */}
                  <div className="space-y-2 mt-4 text-[12px] text-[#8C8881] border-b border-[#EAE5DB]/60 pb-3">
                    <div className="flex justify-between">
                      <span>상품 구분</span>
                      <span className="text-[#1F1E1D] font-bold">클로드 API KEY</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span>구매 후 잔액</span>
                      <span className="bg-[#FFF8EE] border border-[#F6E1C7] text-[#D95F3B] font-bold text-[11px] px-2.5 py-0.5 rounded-lg">{getBalanceUSD()} 충전</span>
                    </div>
                  </div>

                  {/* Buyer Inputs (Slightly narrowed/compacted) */}
                  <div className="mt-4 space-y-2 px-1">
                    <div className="text-[11px] text-[#8C8881] font-bold uppercase tracking-wider pl-0.5">구매자 정보</div>
                    <input
                      type="text"
                      placeholder="이름"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-white border border-[#EAE5DB] rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#1F1E1D] placeholder-[#8C8881]/50 focus:outline-none focus:border-[#D95F3B] focus:ring-1 focus:ring-[#D95F3B] transition-all duration-300 shadow-sm font-medium"
                    />
                    <input
                      type="tel"
                      placeholder="휴대폰 번호"
                      value={buyerPhone}
                      onChange={handlePhoneChange}
                      className="w-full bg-white border border-[#EAE5DB] rounded-lg px-2.5 py-1.5 text-[12.5px] text-[#1F1E1D] placeholder-[#8C8881]/50 focus:outline-none focus:border-[#D95F3B] focus:ring-1 focus:ring-[#D95F3B] transition-all duration-300 shadow-sm font-medium"
                    />
                  </div>
                </div>

                {/* Footer terms & button */}
                <div className="mt-4">
                  {/* Reconstructed Terms Agreement checklist (Unobtrusive, interactive lighting, (필수) at front) */}
                  <div className="border-t border-[#EAE5DB]/60 pt-3 select-none space-y-2.5">
                    <div className="text-[10px] text-[#8C8881] font-bold uppercase tracking-wider pl-0.5">결제 약관 동의</div>
                    
                    {/* 전체 동의 행 */}
                    <div className="flex items-center gap-2.5 pb-2 border-b border-[#EAE5DB]/40 mb-1.5 pl-0.5">
                      <CoralCircularCheck 
                        checked={agreedAll} 
                        onChange={(val) => {
                          setAgreedTerms1(val);
                          setAgreedTerms2(val);
                          setAgreedTerms3(val);
                        }} 
                      />
                      <span className={`text-[11px] transition-all duration-300 ease-in-out ${agreedAll ? "text-[#1F1E1D] font-bold" : "text-[#8C8881]/50 font-semibold"}`}>
                        결제 약관 전체 동의
                      </span>
                    </div>

                    {/* Row 1: 전자금융거래 */}
                    <div className="flex items-center gap-2.5 pl-0.5">
                      <CoralCircularCheck checked={agreedTerms1} onChange={setAgreedTerms1} />
                      <span className={`text-[10.5px] font-normal leading-none transition-all duration-300 ease-in-out ${agreedTerms1 ? "text-[#1F1E1D] font-medium" : "text-[#8C8881]/40"}`}>
                        (필수) 1. 전자금융거래 이용약관 동의
                      </span>
                    </div>

                    {/* Row 2: 개인정보처리방침 */}
                    <div className="flex items-center gap-2.5 pl-0.5">
                      <CoralCircularCheck checked={agreedTerms2} onChange={setAgreedTerms2} />
                      <span className={`text-[10.5px] font-normal leading-none transition-all duration-300 ease-in-out ${agreedTerms2 ? "text-[#1F1E1D] font-medium" : "text-[#8C8881]/40"}`}>
                        (필수) 2. 개인정보처리방침 이용약관 동의
                      </span>
                    </div>

                    {/* Row 3: 본 상품 약관 (Clickable link with lower weight font-normal to match surrounding) */}
                    <div className="flex items-center gap-2.5 pl-0.5">
                      <CoralCircularCheck checked={agreedTerms3} onChange={setAgreedTerms3} />
                      <span className={`text-[10.5px] font-normal leading-normal transition-all duration-300 ease-in-out ${agreedTerms3 ? "text-[#1F1E1D] font-medium" : "text-[#8C8881]/40"}`}>
                        (필수) 3. 본 상품의{" "}
                        <a 
                          href="/docs/terms" 
                          target="_blank" 
                          className={`underline font-normal transition-all duration-300 ease-in-out ${agreedTerms3 ? "text-[#1F1E1D] font-medium hover:text-[#D95F3B]" : "text-[#8C8881]/40 hover:text-[#D95F3B]/70"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          이용약관 및 정책
                        </a>
                        에 동의합니다.
                      </span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3 text-center font-bold">
                      {errorMsg}
                    </div>
                  )}

                  {/* Clean Full-width Button */}
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => handleStep1Submit()}
                      disabled={!agreedTerms1 || !agreedTerms2 || !agreedTerms3 || !buyerName.trim() || !buyerPhone}
                      className={`w-full py-3.5 text-white font-bold text-[14px] rounded-2xl transition-all shadow-[0_4px_12px_rgba(217,119,87,0.15)] active:scale-[0.98] flex items-center justify-center gap-1.5 ${(!agreedTerms1 || !agreedTerms2 || !agreedTerms3 || !buyerName.trim() || !buyerPhone) ? "bg-[#8C8881] cursor-not-allowed opacity-50 shadow-none" : "bg-[#191919] hover:bg-black"}`}
                    >
                      <span>결제수단 선택</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 2 ==================== */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Navigation with Back Arrow */}
                  <div className="flex items-center mb-4 w-full select-none">
                    <button 
                      onClick={() => goToPrevStep(1)}
                      className="text-[#1F1E1D]/60 hover:text-[#1F1E1D] transition-colors p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>

                  <div className="text-[16px] font-extrabold text-[#1F1E1D] font-sans">결제 방법 선택</div>
                  <div className="text-[12px] text-[#8C8881] mt-0.5 mb-4">원하시는 결제 수단을 선택해주세요.</div>

                  {/* Payment Grid (3x3 matching user list with coral highlights) */}
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* 신용카드 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("card"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "card" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_card.png" 
                        alt="신용카드" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">신용카드</span>
                    </button>

                    {/* 토스페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("tosspay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "tosspay" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_tosspay.jpg" 
                        alt="토스페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">토스페이</span>
                    </button>

                    {/* 네이버페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("naverpay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "naverpay" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_naverpay.jpg" 
                        alt="네이버페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">네이버페이</span>
                    </button>

                    {/* 카카오페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("kakaopay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "kakaopay" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_kakaopay.jpg" 
                        alt="카카오페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">카카오페이</span>
                    </button>

                    {/* 애플페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("applepay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "applepay" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_applepay.png" 
                        alt="애플페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">애플페이</span>
                    </button>

                    {/* 페이코 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("payco"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "payco" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_payco.png" 
                        alt="페이코" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">페이코</span>
                    </button>

                    {/* 스마일페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("smilepay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "smilepay" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_smilepay.png" 
                        alt="스마일페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">스마일페이</span>
                    </button>

                    {/* 가상계좌 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("vbank"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "vbank" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_vbank.jpg" 
                        alt="가상계좌" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">가상계좌</span>
                    </button>

                    {/* 계좌이체 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("bank"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "bank" ? "border-[#D95F3B] bg-[#FFF8EE] text-[#D95F3B] font-bold shadow-[0_0_12px_rgba(217,119,87,0.12)]" : "border-[#EAE5DB] bg-white text-[#1F1E1D] hover:border-[#D95F3B]/50 hover:bg-[#FFFDFB]"}`}
                    >
                      <img 
                        src="/images/pay_bank.jpg" 
                        alt="계좌이체" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#EAE5DB]/40 shadow-sm"
                      />
                      <span className="text-[11px] font-medium">계좌이체</span>
                    </button>

                  </div>
                </div>

                {/* Back Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => goToPrevStep(1)}
                    className="w-full py-3.5 bg-[#EFECE5] hover:bg-[#EBE6DC] text-[#1F1E1D] rounded-xl font-bold text-[13px] transition-colors border border-[#EAE5DB]"
                  >
                    이전 단계로
                  </button>
                </div>
              </motion.div>
            )}

            {/* ==================== STEP 3 ==================== */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Navigation with Back Arrow */}
                  <div className="flex items-center mb-4 w-full select-none">
                    <button 
                      onClick={() => goToPrevStep(2)}
                      className="text-[#1F1E1D]/60 hover:text-[#1F1E1D] transition-colors p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>

                  {/* Dynamic sub-method panels */}
                  {selectedMethod === "card" && (
                    <div>
                      <div className="text-[15px] font-extrabold text-[#1F1E1D] font-sans">신용카드 결제 진행</div>
                      <div className="text-[12px] text-[#8C8881] mt-0.5">국내 모든 신용 및 체크카드로 안전하게 결제합니다.</div>

                      <div className="bg-white border border-[#EAE5DB] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                          <img 
                            src="/images/pay_card.png" 
                            alt="신용카드" 
                            className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                          />
                          <span className="text-[14px] font-bold text-[#1F1E1D]">일반 신용카드 결제</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8C8881] text-center mt-5 font-medium">
                        결제하기 버튼을 누르시면 안전한 결제 승인을 위한 인증창으로 바로 연결됩니다.
                      </p>
                    </div>
                  )}

                  {selectedMethod === "vbank" && (
                    <div>
                      <div className="text-[15px] font-extrabold text-[#1F1E1D] font-sans">가상계좌 발급</div>
                      <div className="text-[12px] text-[#8C8881] mt-0.5">고객님만의 1회성 결제 고유 계좌번호를 발급해 드립니다.</div>

                      <div className="bg-white border border-[#EAE5DB] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                          <img 
                            src="/images/pay_vbank.jpg" 
                            alt="가상계좌" 
                            className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                          />
                          <span className="text-[14px] font-bold text-[#1F1E1D]">고유 가상계좌 발급</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8C8881] text-center mt-5 font-medium">
                        결제하기를 진행하시면 결제창 내에서 고유 가상계좌 번호가 발급되며 입금 즉시 처리됩니다.
                      </p>
                    </div>
                  )}

                  {/* 계좌이체 */}
                  {selectedMethod === "bank" && (
                    <div>
                      <div className="text-[15px] font-extrabold text-[#1F1E1D] font-sans">실시간 계좌이체</div>
                      <div className="text-[12px] text-[#8C8881] mt-0.5">고객님의 은행 계좌에서 직접 이체하여 결제합니다.</div>

                      <div className="bg-white border border-[#EAE5DB] rounded-2xl p-5 mt-6 flex flex-col items-center justify-center shadow-sm gap-4">
                        <img 
                          src="/images/pay_bank.jpg" 
                          alt="실시간 계좌이체" 
                          className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                        />
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-[#1f1e1d]">안전한 계좌이체 결제</div>
                          <p className="text-[11px] text-[#8C8881] mt-1.5 leading-relaxed font-medium">
                            결제하기 진행 시 은행 선택 및 이체 인증창이 열리며, 간단한 본인 확인 완료 후 즉시 안전하게 이체 처리됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Easy Pay (Naver, Kakao, Toss, Apple, Payco) */}
                  {!["card", "vbank", "bank"].includes(selectedMethod) && (
                    <div>
                      <div className="text-[15px] font-extrabold text-[#1F1E1D] font-sans">간편결제 진행</div>
                      <div className="text-[12px] text-[#8C8881] mt-0.5">선택하신 간편결제 서비스로 안전한 보안 결제를 시작합니다.</div>

                      <div className="bg-white border border-[#EAE5DB] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        {selectedMethod === "naverpay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_naverpay.jpg" 
                              alt="네이버페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">네이버페이</span>
                          </div>
                        )}
                        {selectedMethod === "kakaopay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_kakaopay.jpg" 
                              alt="카카오페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">카카오페이</span>
                          </div>
                        )}
                        {selectedMethod === "tosspay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_tosspay.jpg" 
                              alt="토스페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">토스페이</span>
                          </div>
                        )}
                        {selectedMethod === "applepay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_applepay.png" 
                              alt="애플페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">애플페이</span>
                          </div>
                        )}
                        {selectedMethod === "payco" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_payco.png" 
                              alt="페이코" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">페이코</span>
                          </div>
                        )}
                        {selectedMethod === "smilepay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_smilepay.png" 
                              alt="스마일페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#EAE5DB]/40 shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#1F1E1D]">스마일페이</span>
                          </div>
                        )}
                        {selectedMethod === "phone" && (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-[#D95F3B]/10 flex items-center justify-center border border-[#D95F3B]/20">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D95F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                              </svg>
                            </div>
                            <span className="text-[14px] font-bold text-[#1F1E1D]">휴대폰 소액결제</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-[#8C8881] text-center mt-5 font-medium">
                        결제하기 버튼을 누르시면 해당 간편결제 인증을 위한 팝업창으로 안전하게 연결됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit & Go back buttons */}
                <div className="mt-6">
                  {errorMsg && (
                    <div className="text-[11px] text-red-500 bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3 text-center font-bold">
                      {errorMsg}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => goToPrevStep(2)}
                      className="w-1/3 py-3.5 bg-[#EFECE5] hover:bg-[#EBE6DC] text-[#1F1E1D] rounded-xl font-bold text-[13px] transition-colors border border-[#EAE5DB]"
                    >
                      이전
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isLoading}
                      className={`w-2/3 py-3.5 text-white font-bold text-[14px] rounded-xl transition-all shadow-[0_4px_14px_rgba(217,119,87,0.2)] active:scale-[0.98] ${isLoading ? "bg-[#8C8881] cursor-not-allowed opacity-50 shadow-none" : "bg-[#191919] hover:bg-black"}`}
                    >
                      {isLoading ? "처리 중..." : "결제하기"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
