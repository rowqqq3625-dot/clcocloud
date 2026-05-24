"use client";

import React from "react";
import { ShieldCheck } from "lucide-react";

interface QuotaBadgeProps {
  used: number;
  limit: number;
}

export function QuotaBadge({ used, limit }: QuotaBadgeProps) {
  const percentage = Math.min(100, (used / limit) * 100);
  
  return (
    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-coral/20 bg-coral/8 text-coral shadow-sm select-none">
      <ShieldCheck className="w-3.5 h-3.5 text-coral shrink-0" />
      <span className="text-[11.5px] font-bold font-mono tracking-wide">
        사용량 {used} / {limit}
      </span>
      {/* Tiny progress dot */}
      <span className={`w-1.5 h-1.5 rounded-full ${percentage >= 80 ? "bg-coral-deep animate-ping" : "bg-coral"}`} />
    </div>
  );
}
