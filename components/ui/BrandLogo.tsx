"use client";

import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  type?: "full" | "icon" | "vertical";
  className?: string;
};

export function BrandLogo({ size = 32, type = "full", className = "" }: BrandLogoProps) {
  // 1. Icon-only version (3번 이미지 스타일)
  if (type === "icon") {
    return (
      <Image
        src="/logo-icon.png"
        alt="ClcoCloud Icon"
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }

  // 2. Vertical full version (5번 이미지 스타일)
  if (type === "vertical") {
    const height = Math.round(size * 1.25);
    return (
      <Image
        src="/extra-logo.png"
        alt="ClcoCloud Vertical Logo"
        width={size}
        height={height}
        className={`shrink-0 object-contain ${className}`}
      />
    );
  }
  // 3. Horizontal full version (2번 이미지 스타일 - 기본값)
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/header-logo-icon.png"
        alt="클코클라우드 로고 아이콘"
        width={size}
        height={size}
        className="shrink-0 object-contain"
        priority
      />
      <span
        className="select-none shrink-0"
        style={{
          fontSize: `${Math.round(size * 0.88)}px`,
          lineHeight: 1.1,
          fontFamily: "'Song Myung', serif",
          color: "#D97757",
          letterSpacing: "-0.01em"
        }}
      >
        클코클라우드
      </span>
    </div>
  );
}


