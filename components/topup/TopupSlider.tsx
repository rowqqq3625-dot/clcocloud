"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

interface TopupSliderProps {
  min: number;
  max: number;
  step: number;
  value: number; // USD
  onChange: (val: number) => void;
  onDragEnd?: (val: number) => void;
}

export default function TopupSlider({
  min = 1000,
  max = 5000,
  step = 100,
  value,
  onChange,
  onDragEnd,
}: TopupSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPulse, setIsPulse] = useState(false);
  const [isSnapActive, setIsSnapActive] = useState(false);
  
  // lerp 및 애니메이션을 위한 ref
  const valueRef = useRef(value);
  const targetValueRef = useRef(value);
  const requestRef = useRef<number | null>(null);

  // prefers-reduced-motion 감지
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // 외부에서 value가 변경되면 targetValue도 동기화
  useEffect(() => {
    targetValueRef.current = value;
    if (prefersReducedMotion || !isDragging) {
      valueRef.current = value;
    }
  }, [value, prefersReducedMotion, isDragging]);

  // Lerp 보간 루프
  const animate = useCallback(() => {
    if (prefersReducedMotion) {
      if (valueRef.current !== targetValueRef.current) {
        valueRef.current = targetValueRef.current;
        onChange(targetValueRef.current);
      }
      return;
    }

    const current = valueRef.current;
    const target = targetValueRef.current;
    const diff = target - current;

    if (Math.abs(diff) > 0.1) {
      // Lerp 보간 계수 0.18 적용
      let next = current + diff * 0.18;

      // step 자석 스냅 처리
      // 현재 값 부근의 가장 가까운 step 값을 구함
      const nearestStep = Math.round(next / step) * step;
      const distanceToStep = Math.abs(next - nearestStep);
      
      // step 간격의 30% 이내에 들어왔을 때 자석처럼 스냅
      const snapThreshold = step * 0.3;
      if (distanceToStep < snapThreshold) {
        // 스냅 시 미세 틱 피드백을 위해 상태 변경 (트랙 0.5px 두꺼워짐 효과)
        if (!isSnapActive && isDragging) {
          setIsSnapActive(true);
          // 모바일 진동 피드백
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(8);
          }
          setTimeout(() => setIsSnapActive(false), 80);
        }
        next = nearestStep;
      }

      valueRef.current = next;
      onChange(Math.round(next));
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (valueRef.current !== target) {
        valueRef.current = target;
        onChange(target);
      }
      requestRef.current = null;
    }
  }, [onChange, step, isSnapActive, isDragging, prefersReducedMotion]);

  useEffect(() => {
    if (isDragging && !prefersReducedMotion) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isDragging, animate, prefersReducedMotion]);

  // 마우스/터치 위치로 값 계산
  const getValueFromCoordinate = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width;
    const offsetX = Math.max(0, Math.min(clientX - rect.left, width));
    const percentage = offsetX / width;
    
    // 계산된 raw 값
    const rawVal = min + percentage * (max - min);
    // 가장 가까운 step 값
    const steppedVal = Math.round(rawVal / step) * step;
    return Math.max(min, Math.min(steppedVal, max));
  }, [min, max, step, value]);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const val = getValueFromCoordinate(e.clientX);
    targetValueRef.current = val;
    if (prefersReducedMotion) {
      valueRef.current = val;
      onChange(val);
    }
    
    // pointer capture 설정으로 영역 밖 드래그 유연하게 처리
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const val = getValueFromCoordinate(e.clientX);
    targetValueRef.current = val;
    if (prefersReducedMotion) {
      valueRef.current = val;
      onChange(val);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    // 드래그 종료 후 최종 step으로 120ms 안착 보증 및 펄스 이펙트
    const finalVal = Math.round(targetValueRef.current / step) * step;
    targetValueRef.current = finalVal;
    valueRef.current = finalVal;
    onChange(finalVal);

    if (onDragEnd) {
      onDragEnd(finalVal);
    }

    if (!prefersReducedMotion) {
      setIsPulse(true);
      setTimeout(() => setIsPulse(false), 240);
    }
  };

  // 키보드 조작 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    let nextVal = value;
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowDown":
        nextVal = Math.max(min, value - step);
        break;
      case "ArrowRight":
      case "ArrowUp":
        nextVal = Math.min(max, value + step);
        break;
      case "PageDown":
        nextVal = Math.max(min, value - step * 5); // Shift + Arrow 느낌
        break;
      case "PageUp":
        nextVal = Math.min(max, value + step * 5);
        break;
      case "Home":
        nextVal = min;
        break;
      case "End":
        nextVal = max;
        break;
      default:
        return;
    }
    e.preventDefault();
    targetValueRef.current = nextVal;
    valueRef.current = nextVal;
    onChange(nextVal);
    if (onDragEnd) {
      onDragEnd(nextVal);
    }

    if (!prefersReducedMotion) {
      setIsPulse(true);
      setTimeout(() => setIsPulse(false), 240);
    }
  };

  // 비율 계산
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full py-6 select-none">
      <div 
        ref={trackRef}
        className={`relative w-full h-[6px] rounded-full bg-[rgba(232,224,210,0.12)] cursor-pointer transition-[height] duration-100 ${
          isSnapActive ? "h-[7px]" : "h-[6px]"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Active Track with Gradient and Glow */}
        <div 
          className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#E59478] to-[#D97757] transition-[height] duration-100"
          style={{ 
            width: `${percentage}%`,
            boxShadow: `0 0 12px rgba(217, 119, 87, ${isDragging ? 0.4 : 0.2})`,
          }}
        />

        {/* Thumb */}
        <div 
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#D97757] border-[1.5px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.4)] cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#E59478]/50 transition-transform duration-200 ${
            isDragging ? "scale-110" : ""
          } ${
            isPulse ? "animate-thumb-pulse" : ""
          }`}
          style={{ 
            left: `${percentage}%`,
          }}
          aria-label="잔액 충전 문의 슬라이더"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        />
      </div>

      <style jsx global>{`
        @keyframes thumb-pulse {
          0% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0px rgba(229, 148, 192, 0.4);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.08);
            box-shadow: 0 2px 12px rgba(0,0,0,0.5), 0 0 0 6px rgba(217, 119, 87, 0.2);
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            box-shadow: 0 2px 8px rgba(0,0,0,0.4), 0 0 0 0px rgba(217, 119, 87, 0);
          }
        }
        .animate-thumb-pulse {
          animation: thumb-pulse 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}
