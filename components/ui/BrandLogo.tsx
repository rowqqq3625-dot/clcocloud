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
  // 사용자의 요청으로 텍스트는 이제 사용하지 않고 이미지 로고만 단독으로 꽉차고 크게 사용합니다.
  const logoSize = Math.round(size * 1.5);
  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src="/header-logo-icon.png"
        alt="클코클라우드 로고"
        width={logoSize}
        height={logoSize}
        className="shrink-0 object-contain max-h-[38px] w-auto"
        priority
      />
    </div>
  );
}


