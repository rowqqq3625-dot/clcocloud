"use client";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 32, className = "" }: BrandLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
    >
      {/* Orange circle with right-side gap */}
      <path
        d="M 36.85 24 A 16 16 0 1 0 36.85 40"
        stroke="#D97757"
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Orange inner connector and dot */}
      <line
        x1="21"
        y1="32"
        x2="35"
        y2="32"
        stroke="#D97757"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle
        cx="35"
        cy="32"
        r="4.5"
        fill="#D97757"
      />
      {/* Cloud shape outline */}
      <path
        d="M 34 40 L 49 40 A 8 8 0 0 0 49 24 A 9.5 9.5 0 0 0 34 24 A 8 8 0 0 0 34 40 Z"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

