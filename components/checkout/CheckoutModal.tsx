"use client";
/* eslint-disable @next/next/no-img-element */


import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  productKind: "balance" | "bundle";
  productCode: string;
  price: number;
  productName: string;
}

// Premium Soft Copper Custom Circular Checkbox matching the reference (toned down brightness)
const CoralCircularCheck = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
  <div 
    onClick={() => onChange(!checked)}
    className={`w-[18px] h-[18px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 shrink-0 ${checked ? "bg-[#CC6A4E] shadow-[0_2px_5px_rgba(204,106,78,0.2)] scale-105" : "bg-[#13100F] border border-[#2A2623] hover:border-[#D97757]/40"}`}
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
  const [selectedMethod, setSelectedMethod] = useState<string>(""); // default empty
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeCoupon, setActiveCoupon] = useState<{ id: string; name: string; value: number; type?: string; text: string; condition?: string } | null>(null);
  const [showCoupons, setShowCoupons] = useState(false);

  const agreedAll = agreedTerms1 && agreedTerms2;

  // Prevent background scrolling and interaction when modal is open (with Lenis freeze support)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Freeze Lenis smooth scroll globally
      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.stop();
      }
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

      // Reactivate Lenis smooth scroll
      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.start();
      }
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";

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
      setSelectedMethod("");
      setErrorMsg("");
      setIsLoading(false);
      setActiveCoupon(null);
      setShowCoupons(false);
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

  const getOfficialPriceKRW = () => {
    const code = productCode.toUpperCase();
    if (code.includes("STANDARD")) return 280000;
    if (code.includes("PRO")) return 700000;
    if (code.includes("ULTRA")) return 1400000;
    return Math.round(price * 1.43 / 1000) * 1000;
  };

  const officialKRW = getOfficialPriceKRW();

  const finalPrice = activeCoupon 
    ? (activeCoupon.type === "flat" 
        ? Math.max(0, price - activeCoupon.value) 
        : Math.max(0, Math.round(price * (1 - activeCoupon.value / 100) / 100) * 100))
    : price;

  const totalDiscountRate = Math.round(((officialKRW - finalPrice) / officialKRW) * 100);

  const getDiscountAmount = (cp: { value: number; type?: string }) => {
    if (!cp.value) return 0;
    if (cp.type === "flat") return cp.value;
    if (cp.type === "percent") return Math.round(price * (cp.value / 100));
    return 0;
  };

  const availableCoupons: { id: string; name: string; desc: string; value: number; type: string; text: string; condition?: string }[] = [];

  const sortedActive = [...availableCoupons].sort((a, b) => getDiscountAmount(b) - getDiscountAmount(a));

  const finalCoupons = [
    { id: "none", name: "선택 안 함", desc: "쿠폰 미사용", value: 0, text: "선택 안 함", condition: undefined },
    ...sortedActive
  ];


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

    if (!agreedTerms1 || !agreedTerms2) {
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
          couponId: activeCoupon ? activeCoupon.id : null,
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0C0B0A]/85 backdrop-blur-md p-4 overflow-hidden pointer-events-auto"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{ pointerEvents: "auto" }}
      data-lenis-prevent // Prevents scroll leaks
    >
      <div 
        className="w-full max-w-[426px] h-[550px] max-h-[95vh] bg-gradient-to-br from-[#1A1614] to-[#120F0E] border border-[rgba(217,119,87,0.05)] rounded-[34px] shadow-[0_32px_80px_rgba(10,9,8,0.65)] relative flex flex-col p-6 sm:p-[26px] overflow-hidden select-none text-[#D5D0C6]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-right Step Indicators (Premium Claude Coral) */}
        <div className="absolute top-7 right-14 flex items-center gap-1.5 z-20">
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 1 ? "bg-[#D97757]" : "bg-[#332A26]"}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 2 ? "bg-[#D97757]" : "bg-[#332A26]"}`} />
          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${step === 3 ? "bg-[#D97757]" : "bg-[#332A26]"}`} />
        </div>

        {/* Close Button - Premium 'X' Icon matching reference top right */}
        <button 
          onClick={onClose}
          className="absolute top-[26px] right-[24px] text-[#8C857B] hover:text-[#FAF7F0] transition-colors p-1 rounded-full hover:bg-white/[0.04] z-30"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

            {/* Wizard step transition area */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1.5 flex flex-col relative [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D97757]/20 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                  {/* Section Title (Spectral Serif Anthropic Style, Soft Warm Gray) */}
                  <div 
                    className="text-[20px] font-medium text-[#8C857B] tracking-tight mb-3 pl-0.5"
                    style={{ fontFamily: "'Spectral', 'Georgia', serif" }}
                  >
                    주문하기
                  </div>
                  
                  {/* Product block (Perfectly aligned grid card matching reference image) */}
                  <div className="bg-[#1B1513] border border-[rgba(217,119,87,0.06)] rounded-[20px] p-3.5 shadow-inner mb-3">
                    <div className="space-y-3">
                      {/* Row 1: 선택한 상품 (Left aligned stacked) */}
                      <div>
                        <div className="text-[10.5px] text-[#8E867E] font-medium mb-1 uppercase tracking-wider">선택한 플랜</div>
                        <div 
                          className="text-[16px] font-bold text-[#DEDAD0] tracking-tight"
                          style={{ fontFamily: "'Spectral', 'Georgia', serif" }}
                        >
                          {productName}
                        </div>
                      </div>
                      
                      {/* Row 2: 최종 결제 금액 (Horizontal spaced, divider above) */}
                      <div className="flex justify-between items-center pt-2.5 border-t border-[#261F1C]">
                        <span className="text-[11.5px] text-[#8E867E] font-medium">최종 결제 금액</span>
                        <div className="flex flex-col items-end gap-0.5">
                          {/* Official Price Cross-out */}
                          <span className="text-[11px] text-[#8E867E]/70 line-through decoration-[#8E867E]/50 font-medium tracking-tight">
                            ₩{officialKRW.toLocaleString()}원
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="text-[19px] font-bold text-[#D97757] tracking-tight"
                              style={{ fontFamily: "'Spectral', 'Georgia', serif" }}
                            >
                              ₩{finalPrice.toLocaleString()}원
                            </span>
                            {/* Discount Bubble Tag */}
                            <span className="bg-[#E05C3E] text-[#FAF7F0] text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 flex items-center justify-center shadow-[0_2px_8px_rgba(224,92,62,0.25)] tracking-tighter">
                              {totalDiscountRate}% OFF
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
  
                  {/* Buyer Inputs & Coupon Card Container */}
                  <div className="mt-3 flex gap-2.5 w-full items-end relative">
                    {/* Left Column: Buyer Inputs */}
                    <div className="flex-1 space-y-2.5 text-left pl-0.5">
                      {/* 구매자 성함 */}
                      <div className="flex flex-col">
                        <label className="block text-[11.5px] font-bold text-[#C4BEB5] mb-1 pl-0.5">구매자 성함</label>
                        <input
                          type="text"
                          placeholder="이름"
                          value={buyerName}
                          onChange={(e) => setBuyerName(e.target.value)}
                          className="w-full max-w-[210px] bg-[#12100F] border border-[#2E2A27] rounded-[14px] px-3.5 py-2 text-[12px] text-[#E8E4DB] font-semibold placeholder-[#5A544D] outline-none focus:outline-none focus:ring-0 focus:border-[#D97757] focus-visible:ring-0 focus-visible:[outline:none_!important] transition-all duration-300 shadow-inner"
                        />
                      </div>
                      {/* 휴대폰 번호 */}
                      <div className="flex flex-col">
                        <label className="block text-[11.5px] font-bold text-[#C4BEB5] mb-1 pl-0.5">휴대폰 번호</label>
                        <input
                          type="tel"
                          placeholder="010-1234-5678"
                          value={buyerPhone}
                          onChange={handlePhoneChange}
                          className="w-full max-w-[210px] bg-[#12100F] border border-[#2E2A27] rounded-[14px] px-3.5 py-2 text-[12px] text-[#E8E4DB] font-semibold placeholder-[#5A544D] outline-none focus:outline-none focus:ring-0 focus:border-[#D97757] focus-visible:ring-0 focus-visible:[outline:none_!important] transition-all duration-300 shadow-inner"
                        />
                      </div>
                    </div>

                    {/* Right Column: Coupon Ticket Card */}
                    {(() => {
                      const getCouponDisplayTexts = () => {
                        if (!activeCoupon || activeCoupon.id === "none") {
                          return { line1: "쿠폰", line2: "선택" };
                        }
                        if (activeCoupon.type === "percent") {
                          return { line1: `${activeCoupon.value}%`, line2: "할인" };
                        }
                        return { line1: activeCoupon.text, line2: "할인" };
                      };
                      const displayText = getCouponDisplayTexts();
                      const isNoneSelected = !activeCoupon || activeCoupon.id === "none";

                      return (
                        <div className="w-[134px] shrink-0 relative flex flex-col items-center">
                          <div 
                            onClick={() => setShowCoupons(!showCoupons)}
                            className="w-[130px] h-[130px] rounded-[20px] flex flex-col justify-between shadow-[0_12px_32px_rgba(217,119,87,0.18),inset_0_1px_1px_rgba(255,255,255,0.1)] relative cursor-pointer group active:scale-[0.97] transition-all duration-200 overflow-hidden border border-[rgba(255,255,255,0.06)] z-10"
                          >
                            {/* Upper Part: Coral Gradient */}
                            <div className="h-[81px] w-full bg-gradient-to-b from-[#E59478] via-[#D97757] to-[#B85A3E] flex flex-col items-center justify-center px-2 relative shrink-0">
                              <div 
                                className="flex flex-col items-center justify-center text-center select-none"
                                style={{ fontFamily: "'Spectral', 'Georgia', serif" }}
                              >
                                <span 
                                  className={`font-black text-[#FAF7F0] tracking-tighter leading-none ${
                                    isNoneSelected ? "text-[23px] tracking-tight" : "text-[32px]"
                                  }`}
                                  style={{ textShadow: "0 2px 8px rgba(0,0,0,0.35)" }}
                                >
                                  {displayText.line1}
                                </span>
                                <span 
                                  className={`text-[#FAF7F0] leading-none mt-1.5 ${
                                    isNoneSelected 
                                      ? "text-[23px] font-black tracking-tight" 
                                      : "text-[11px] font-bold tracking-[0.25em] uppercase opacity-95"
                                  }`}
                                  style={{ textShadow: "0 1.5px 5px rgba(0,0,0,0.25)" }}
                                >
                                  {displayText.line2}
                                </span>
                              </div>
                            </div>

                            {/* Left & Right Circular Ticket Notches (Matches reference image) */}
                            <div className="absolute left-0 top-[81px] w-[14px] h-[14px] rounded-full bg-[#120F0E] -translate-x-1/2 -translate-y-1/2 z-20" />
                            <div className="absolute right-0 top-[81px] w-[14px] h-[14px] rounded-full bg-[#120F0E] translate-x-1/2 -translate-y-1/2 z-20" />

                            {/* Ticket Dashed Division Line */}
                            <div className="absolute left-[6px] right-[6px] top-[81px] border-t-[1.5px] border-dashed border-[#FAF7F0]/50 -translate-y-1/2 z-20" />

                            {/* Lower Part: Warm Darker Beige Area */}
                            <div className="h-[49px] w-full bg-[#BCAE9F] flex items-center justify-center px-2 pb-1.5 shrink-0 z-10">
                              <div 
                                className="bg-[#FAF7F0] w-full py-1.5 px-1 rounded-full shadow-[0_2px_6px_rgba(0,0,0,0.15)] flex items-center justify-center transition-all select-none hover:bg-white/95"
                                style={{ fontFamily: "'Spectral', 'Georgia', serif" }}
                              >
                                <span className={`font-bold tracking-tight leading-none text-center w-full truncate text-[#1F1A17] ${
                                  !activeCoupon ? "text-[11px]" : activeCoupon.id === "none" ? "text-[11px]" : activeCoupon.condition ? "text-[9px]" : "text-[11px]"
                                }`}>
                                  {!activeCoupon 
                                    ? "쿠폰 선택하기" 
                                    : activeCoupon.id === "none" 
                                      ? "쿠폰 미사용" 
                                      : activeCoupon.condition 
                                        ? activeCoupon.condition 
                                        : "쿠폰 적용완료"}
                                </span>
                              </div>
                            </div>
                          </div>
 
                          {/* Floating Coupon Dropdown Select - Beautiful 210x190 Square Version to prevent clipping */}
                          <AnimatePresence>
                            {showCoupons && (
                              <motion.div 
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                className="absolute right-0 bottom-[125px] bg-[#181311]/98 backdrop-blur-xl border border-[rgba(217,119,87,0.22)] rounded-[24px] p-3 z-[999] shadow-[0_24px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.03)] flex flex-col gap-1.5 w-[210px] h-[190px] overflow-hidden"
                              >
                                <div className="text-[10px] text-[#9E958A] font-bold uppercase tracking-wider px-1 py-1 border-b border-[#2A2320]/60 pb-1.5 mb-1 flex justify-between items-center shrink-0">
                                  <span style={{ fontFamily: "'Spectral', 'Georgia', serif" }} className="text-[11px] font-serif font-semibold text-[#E8E4DB] tracking-wide">사용 가능한 쿠폰</span>
                                  <span className="bg-[#D97757]/15 text-[#E59478] text-[8px] px-1.5 py-0.5 rounded-full font-black border border-[#D97757]/20">
                                    {availableCoupons.length}개 보유
                                  </span>
                                </div>
                                
                                {/* Scrollable Container covering exactly 3 options at a time */}
                                <div className="h-[122px] overflow-y-auto flex flex-col gap-1.5 pr-0.5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#D97757]/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                                  {finalCoupons.map((cp) => {
                                    const isSelected = (!activeCoupon && cp.id === "none") || (activeCoupon?.id === cp.id);
                                    return (
                                      <button
                                        key={cp.id}
                                        type="button"
                                        onClick={() => {
                                          setActiveCoupon(cp);
                                          setShowCoupons(false);
                                        }}
                                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-250 border shrink-0 active:scale-[0.98] ${
                                          isSelected
                                            ? "bg-gradient-to-br from-[#E59478] via-[#D97757] to-[#B85A3E] border-transparent text-[#FAF7F0] shadow-[0_8px_20px_rgba(217,119,87,0.25),inset_0_1px_1px_rgba(255,255,255,0.15)] scale-[1.01]"
                                            : "bg-[#14100E] border-[#29221F] text-[#D5D0C6] hover:bg-[#1E1815] hover:border-[#D97757]/45"
                                        }`}
                                      >
                                        <div className="flex flex-col flex-1 pr-2 select-none">
                                          <span className={`text-[11px] font-bold tracking-tight leading-snug ${isSelected ? "text-[#FAF7F0]" : "text-[#DEDAD0]"}`}>
                                            {cp.name}
                                          </span>
                                          <span className={`text-[8px] mt-0.5 font-medium tracking-tight ${isSelected ? "text-[#FAF7F0]/80" : "text-[#8E867E]"}`}>
                                            {cp.desc}
                                          </span>
                                        </div>
 
                                        {/* Right Part: Value Pill Badge */}
                                        <div className={`shrink-0 px-1.5 py-0.5 rounded-lg text-[8.5px] font-black tracking-wider uppercase flex items-center justify-center shadow-sm select-none ${
                                          isSelected
                                            ? "bg-[#FAF7F0] text-[#1F1A17]"
                                            : cp.id === "none"
                                              ? "bg-[#29221F] text-[#8E867E]"
                                              : "bg-[#D97757]/15 text-[#E59478] border border-[#D97757]/20"
                                        }`}>
                                          {cp.text}
                                        </div>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Footer terms & button */}
                <div className="mt-2.5">
                  <div className="border-t border-[rgba(234,229,219,0.06)] pt-2 select-none space-y-1">
                    <div className="text-[10.5px] text-[#8C857B] font-bold uppercase tracking-wider pl-0.5">구매자 약관 동의</div>
                    
                    <div className="flex items-center gap-2 pb-1 border-b border-[rgba(234,229,219,0.04)] mb-0 pl-0.5">
                      <CoralCircularCheck 
                        checked={agreedAll} 
                        onChange={(val) => {
                          setAgreedTerms1(val);
                          setAgreedTerms2(val);
                        }} 
                      />
                      <span className={`text-[11.5px] transition-all duration-300 ease-in-out ${agreedAll ? "text-[#D2CDBF] font-bold" : "text-[#8C857B]/50 font-semibold"}`}>
                        전체 동의하기
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pl-0.5 w-full">
                      <CoralCircularCheck checked={agreedTerms1} onChange={setAgreedTerms1} />
                      <span className={`text-[9.8px] tracking-tighter leading-normal whitespace-nowrap transition-all duration-300 ease-in-out ${agreedTerms1 ? "text-[#C4BEB5] font-medium" : "text-[#8C857B]/50"}`}>
                        <span className="font-semibold text-[#8C857B] mr-0.5">(필수)</span> 본 상품의 전자금융거래 및 개인정보 처리방침에 동의합니다.
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pl-0.5 w-full">
                      <CoralCircularCheck checked={agreedTerms2} onChange={setAgreedTerms2} />
                      <span className={`text-[9.8px] tracking-tighter leading-normal whitespace-nowrap transition-all duration-300 ease-in-out ${agreedTerms2 ? "text-[#C4BEB5] font-medium" : "text-[#8C857B]/50"}`}>
                        <span className="font-semibold text-[#8C857B] mr-0.5">(필수)</span> 서비스{" "}
                        <a 
                           href="/docs/terms" 
                           target="_blank" 
                           className={`underline font-bold text-[10px] transition-all duration-300 ${agreedTerms2 ? "text-[#C4BEB5]" : "text-[#8C857B]/60 hover:text-[#D97757]"}`}
                           onClick={(e) => e.stopPropagation()}
                           >
                          이용약관 및 정책
                        </a>{" "}
                        전문을 모두 확인하였으며, 이에 동의합니다.
                      </span>
                    </div>
                  </div>
                </div>

                  {errorMsg && (
                    <div className="text-[11px] text-[#E87565] bg-[#2C1D1A] border border-[#52251D] rounded-xl p-2.5 mt-3 text-center font-bold">
                      {errorMsg}
                    </div>
                  )}

                  <div className="mt-3.5">
                    <button
                      type="button"
                      onClick={() => handleStep1Submit()}
                      disabled={!agreedTerms1 || !agreedTerms2 || !buyerName.trim() || !buyerPhone}
                      className={`w-full py-3 text-[#FAF7F0] font-bold text-[13.5px] tracking-wide rounded-[18px] transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-1.5 ${
                        (!agreedTerms1 || !agreedTerms2 || !buyerName.trim() || !buyerPhone) 
                          ? "bg-[#24201D] border border-[#2E2825] text-[#8C857B]/35 cursor-not-allowed shadow-none" 
                          : "bg-gradient-to-r from-[#DF6D53] to-[#D97757] border border-[rgba(255,255,255,0.06)] shadow-[0_8px_25px_rgba(217,119,87,0.22)] hover:from-[#E37960] hover:to-[#DC8267] hover:shadow-[0_12px_32px_rgba(217,119,87,0.38)] hover:scale-[1.01]"
                      }`}
                    >
                      <span>결제수단 선택</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 5l7 7-7 7" /></svg>
                    </button>
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
                      className="text-[#F5F2EB]/60 hover:text-[#F5F2EB] transition-colors p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>

                  <div className="text-[17px] font-extrabold text-[#F5F2EB] font-sans">결제 방법 선택</div>
                  <div className="text-[12px] text-[#8C857B] mt-1 mb-5">원하시는 결제 수단을 선택해주세요.</div>

                  {/* Payment Grid (3x3 matching user list with coral highlights - Dark Mode Styling) */}
                  <div className="grid grid-cols-3 gap-2">
                    
                    {/* 신용카드 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("card"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "card" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_card.png" 
                        alt="신용카드" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">신용카드</span>
                    </button>

                    {/* 토스페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("tosspay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "tosspay" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_tosspay.jpg" 
                        alt="토스페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">토스페이</span>
                    </button>

                    {/* 네이버페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("naverpay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "naverpay" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_naverpay.jpg" 
                        alt="네이버페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">네이버페이</span>
                    </button>

                    {/* 카카오페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("kakaopay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "kakaopay" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_kakaopay.jpg" 
                        alt="카카오페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">카카오페이</span>
                    </button>

                    {/* 애플페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("applepay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "applepay" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_applepay.png" 
                        alt="애플페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">애플페이</span>
                    </button>

                    {/* 페이코 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("payco"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "payco" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_payco.png" 
                        alt="페이코" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">페이코</span>
                    </button>

                    {/* 스마일페이 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("smilepay"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "smilepay" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_smilepay.png" 
                        alt="스마일페이" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">스마일페이</span>
                    </button>

                    {/* 가상계좌 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("vbank"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "vbank" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_vbank.jpg" 
                        alt="가상계좌" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
                      />
                      <span className="text-[11px] font-medium">가상계좌</span>
                    </button>

                    {/* 계좌이체 */}
                    <button
                      type="button"
                      onClick={() => { setSelectedMethod("bank"); goToNextStep(3); }}
                      className={`flex flex-col items-center justify-center p-3 border rounded-2xl gap-2 transition-all duration-200 ${selectedMethod === "bank" ? "border-[#D97757] bg-[#221A17] text-[#D97757] font-bold shadow-[0_0_12px_rgba(217,119,87,0.15)]" : "border-[#2A2421] bg-[#181412] text-[#D4CFC7] hover:border-[#D97757]/50 hover:bg-[#221A17]/50"}`}
                    >
                      <img 
                        src="/images/pay_bank.jpg" 
                        alt="계좌이체" 
                        className="w-9 h-9 object-contain rounded-xl shrink-0 select-none border border-[#2E2A27] shadow-sm"
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
                    className="w-full py-3.5 bg-[#24211F] hover:bg-[#2C2724] text-[#F5F2EB] rounded-xl font-bold text-[13px] transition-colors border border-[#2F2B28]"
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
                      className="text-[#F5F2EB]/60 hover:text-[#F5F2EB] transition-colors p-1"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" /></svg>
                    </button>
                  </div>

                  {/* Dynamic sub-method panels */}
                  {selectedMethod === "card" && (
                    <div>
                      <div className="text-[16px] font-extrabold text-[#F5F2EB] font-sans">신용카드 결제 진행</div>
                      <div className="text-[12px] text-[#8C857B] mt-1">국내 모든 신용 및 체크카드로 안전하게 결제합니다.</div>

                      <div className="bg-[#24211F] border border-[#2F2B28] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                          <img 
                            src="/images/pay_card.png" 
                            alt="신용카드" 
                            className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                          />
                          <span className="text-[14px] font-bold text-[#F5F2EB]">일반 신용카드 결제</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8C857B] text-center mt-5 font-medium leading-relaxed">
                        결제하기 버튼을 누르시면 안전한 결제 승인을 위한 인증창으로 바로 연결됩니다.
                      </p>
                    </div>
                  )}

                  {selectedMethod === "vbank" && (
                    <div>
                      <div className="text-[16px] font-extrabold text-[#F5F2EB] font-sans">가상계좌 발급</div>
                      <div className="text-[12px] text-[#8C857B] mt-1">고객님만의 1회성 결제 고유 계좌번호를 발급해 드립니다.</div>

                      <div className="bg-[#24211F] border border-[#2F2B28] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        <div className="flex flex-col items-center gap-3">
                          <img 
                            src="/images/pay_vbank.jpg" 
                            alt="가상계좌" 
                            className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                          />
                          <span className="text-[14px] font-bold text-[#F5F2EB]">고유 가상계좌 발급</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-[#8C857B] text-center mt-5 font-medium leading-relaxed">
                        결제하기를 진행하시면 결제창 내에서 고유 가상계좌 번호가 발급되며 입금 즉시 처리됩니다.
                      </p>
                    </div>
                  )}

                  {/* 계좌이체 */}
                  {selectedMethod === "bank" && (
                    <div>
                      <div className="text-[16px] font-extrabold text-[#F5F2EB] font-sans">실시간 계좌이체</div>
                      <div className="text-[12px] text-[#8C857B] mt-1">고객님의 은행 계좌에서 직접 이체하여 결제합니다.</div>

                      <div className="bg-[#24211F] border border-[#2F2B28] rounded-2xl p-5 mt-6 flex flex-col items-center justify-center shadow-sm gap-4">
                        <img 
                          src="/images/pay_bank.jpg" 
                          alt="실시간 계좌이체" 
                          className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                        />
                        <div className="text-center">
                          <div className="text-[13px] font-bold text-[#F5F2EB]">안전한 계좌이체 결제</div>
                          <p className="text-[11px] text-[#8C857B] mt-1.5 leading-relaxed font-medium">
                            결제하기 진행 시 은행 선택 및 이체 인증창이 열리며, 간단한 본인 확인 완료 후 즉시 안전하게 이체 처리됩니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Easy Pay (Naver, Kakao, Toss, Apple, Payco) */}
                  {!["card", "vbank", "bank"].includes(selectedMethod) && (
                    <div>
                      <div className="text-[16px] font-extrabold text-[#F5F2EB] font-sans">간편결제 진행</div>
                      <div className="text-[12px] text-[#8C857B] mt-1">선택하신 간편결제 서비스로 안전한 보안 결제를 시작합니다.</div>

                      <div className="bg-[#24211F] border border-[#2F2B28] rounded-2xl p-6 mt-6 flex flex-col items-center justify-center shadow-sm">
                        {selectedMethod === "naverpay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_naverpay.jpg" 
                              alt="네이버페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">네이버페이</span>
                          </div>
                        )}
                        {selectedMethod === "kakaopay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_kakaopay.jpg" 
                              alt="카카오페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">카카오페이</span>
                          </div>
                        )}
                        {selectedMethod === "tosspay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_tosspay.jpg" 
                              alt="토스페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">토스페이</span>
                          </div>
                        )}
                        {selectedMethod === "applepay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_applepay.png" 
                              alt="애플페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">애플페이</span>
                          </div>
                        )}
                        {selectedMethod === "payco" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_payco.png" 
                              alt="페이코" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">페이코</span>
                          </div>
                        )}
                        {selectedMethod === "smilepay" && (
                          <div className="flex flex-col items-center gap-3">
                            <img 
                              src="/images/pay_smilepay.png" 
                              alt="스마일페이" 
                              className="w-14 h-14 object-contain rounded-2xl border border-[#2E2A27] shadow-sm"
                            />
                            <span className="text-[14px] font-bold text-[#F5F2EB]">스마일페이</span>
                          </div>
                        )}
                        {selectedMethod === "phone" && (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-[#D97757]/10 flex items-center justify-center border border-[#D97757]/20">
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="5" y="2" width="14" height="20" rx="2" />
                                <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="3" />
                              </svg>
                            </div>
                            <span className="text-[14px] font-bold text-[#DEDAD0]">휴대폰 소액결제</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-[#8C857B] text-center mt-5 font-medium leading-relaxed">
                        결제하기 버튼을 누르시면 해당 간편결제 인증을 위한 팝업창으로 안전하게 연결됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* Submit & Go back buttons */}
                <div className="mt-6">
                  {errorMsg && (
                    <div className="text-[11px] text-[#E87565] bg-[#2C1D1A] border border-[#52251D] rounded-xl p-2.5 mb-3 text-center font-bold">
                      {errorMsg}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => goToPrevStep(2)}
                      className="w-1/3 py-3.5 bg-[#24211F] hover:bg-[#2C2724] text-[#D4CFC7] rounded-xl font-bold text-[13px] transition-colors border border-[#2F2B28]"
                    >
                      이전
                    </button>
                    <button
                      onClick={handleFinalSubmit}
                      disabled={isLoading}
                      className={`w-2/3 py-3.5 text-[#FAF7F0] font-bold text-[14px] rounded-[16px] transition-all active:scale-[0.98] ${
                        isLoading 
                          ? "bg-[#24201D] border border-[#2E2825] text-[#8C857B]/35 cursor-not-allowed opacity-50 shadow-none" 
                          : "bg-gradient-to-r from-[#DF6D53] to-[#D97757] border border-[rgba(255,255,255,0.06)] shadow-[0_6px_20px_rgba(217,119,87,0.2)] hover:from-[#E37960] hover:to-[#DC8267] hover:shadow-[0_8px_25px_rgba(217,119,87,0.32)]"
                      }`}
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
