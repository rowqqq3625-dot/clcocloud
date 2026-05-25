"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Paperclip, ArrowUp, X } from "lucide-react";
import Image from "next/image";

interface ComposerProps {
  onSend: (text: string, images?: string[]) => void;
  disabled: boolean;
  fileInputRefExternal?: React.RefObject<HTMLInputElement>;
}

const MAX_CHARS = 1500;
const MAX_IMAGES = 4;
const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

export function Composer({ onSend, disabled, fileInputRefExternal }: ComposerProps) {
  const [text, setText] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRefLocal = useRef<HTMLInputElement>(null);
  
  const fileInputRef = fileInputRefExternal || fileInputRefLocal;

  const hasContent = text.trim().length > 0 || images.length > 0;
  const canSend = !disabled && hasContent;

  /* ── Auto-resize textarea ────────────────────────────── */
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
      resizeTextarea();
    }
  };

  /* ── File validation & add (Strict Image Only) ───────── */
  const addImageFiles = useCallback(
    (files: File[]) => {
      const remaining = MAX_IMAGES - images.length;
      const validFiles = files
        .filter((f) => {
          // Strict Image Check
          if (!f.type.startsWith("image/")) return false;
          if (f.size > MAX_IMAGE_SIZE) return false;
          return true;
        })
        .slice(0, remaining);

      validFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          setImages((prev) => {
            if (prev.length >= MAX_IMAGES) return prev;
            return [...prev, dataUrl];
          });
        };
        reader.readAsDataURL(file);
      });
    },
    [images.length]
  );

  /* ── Clipboard paste ─────────────────────────────────── */
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) pastedFiles.push(file);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        addImageFiles(pastedFiles);
      }
    },
    [addImageFiles]
  );

  /* ── File input change ───────────────────────────────── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImageFiles(files);
    e.target.value = "";
  };

  /* ── Remove image ────────────────────────────────────── */
  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Send ─────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(text.trim(), images.length > 0 ? images : undefined);
    setText("");
    setImages([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [canSend, text, images, onSend]);

  /* ── Keyboard: Enter to send, Shift+Enter for newline ── */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    resizeTextarea();
  }, [images, resizeTextarea]);

  return (
    <div className="w-full flex flex-col items-center">
      <div className="floating-composer w-full flex flex-col p-2 gap-2 relative">
        {/* Attached image thumbnails inside composer boundary but above input */}
        {images.length > 0 && (
          <div className="flex gap-2.5 px-3 pt-2 overflow-x-auto select-none border-b border-[var(--border-subtle)] pb-2.5">
            {images.map((src, idx) => (
              <div
                key={idx}
                className="relative h-[60px] w-[60px] rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-cream shrink-0 group animate-fade-up"
              >
                <Image
                  src={src}
                  alt={`첨부 ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="60px"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-ink/70 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer focus-none"
                  aria-label={`이미지 ${idx + 1} 제거`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-3 pl-3 pr-2 py-1">
          {/* File attachment clip icon */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-ink-65 hover:text-ink-100 transition-colors p-1.5 rounded-full hover:bg-cream-2 flex items-center justify-center shrink-0 mb-0.5 focus-none"
            aria-label="이미지 파일 첨부"
            disabled={disabled || images.length >= MAX_IMAGES}
          >
            <Paperclip className="w-[18px] h-[18px]" style={{ strokeWidth: 1.5 }} />
          </button>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Text Input area (Apple capsule style, zero outlines) */}
          <textarea
            ref={textareaRef}
            className="flex-1 max-h-40 overflow-y-auto bg-transparent border-none outline-none resize-none py-1.5 text-[16px] text-ink-100 placeholder-ink-45/80 leading-relaxed font-sans focus-none"
            placeholder="무엇을 도와드릴까요?"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            rows={1}
          />

          {/* SEND Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0 mb-0.5 shadow-sm focus-none
              ${canSend 
                ? "bg-coral text-cream hover:bg-coral-deep hover:scale-[1.04]" 
                : "bg-ink text-cream opacity-25 cursor-not-allowed"}`}
            aria-label="메시지 보내기"
          >
            <ArrowUp className="w-5 h-5" style={{ strokeWidth: 2 }} />
          </button>
        </div>
      </div>
      
      {/* Keyboard Hint removed for clean layout */}
    </div>
  );
}
