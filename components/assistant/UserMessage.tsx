"use client";

import React from "react";
import Image from "next/image";

interface UserMessageProps {
  content: string;
  images?: string[];
}

export function UserMessage({ content, images }: UserMessageProps) {
  return (
    <div className="w-full flex justify-end animate-fade-up">
      <div className="flex flex-col items-end gap-2 max-w-[85%] md:max-w-[520px]">
        {/* Render attached images first if any */}
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end mb-1 select-none">
            {images.map((src, idx) => (
              <div 
                key={idx} 
                className="relative h-40 w-40 rounded-xl overflow-hidden border border-[var(--border-subtle)] shadow-sm bg-cream"
              >
                <Image 
                  src={src} 
                  alt="사용자 첨부 이미지" 
                  fill 
                  className="object-cover"
                  sizes="160px"
                  unoptimized
                />
              </div>
            ))}
          </div>
        )}

        {/* User Message Text Bubble */}
        <div 
          className="bg-[#F0E2D2] text-ink-100 px-[18px] py-[14px] text-[16px] font-sans leading-relaxed shadow-sm break-all break-anywhere"
          style={{
            borderRadius: "18px 6px 18px 18px"
          }}
        >
          <p className="whitespace-pre-wrap break-all break-anywhere">{content}</p>
        </div>
      </div>
    </div>
  );
}
