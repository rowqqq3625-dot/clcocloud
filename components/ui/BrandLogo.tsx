"use client";

import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 32, className = "" }: BrandLogoProps) {
  return (
    <Image
      src="/clcocloud-logo.png"
      alt="클코클라우드 로고"
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      priority={size >= 32}
    />
  );
}
