"use client";

import React, { useRef, useState } from "react";
import { Image, X, UploadCloud, AlertCircle } from "lucide-react";

interface ImageFile {
  id: string;
  file: File;
  base64: string;
}

interface ImageUploaderProps {
  images: ImageFile[];
  onChange: (images: ImageFile[]) => void;
  maxCount?: number;
}

export function ImageUploader({ images, onChange, maxCount = 4 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const validateAndAddFiles = (files: FileList | File[]) => {
    setErrorMsg("");
    const validFiles: ImageFile[] = [...images];

    if (validFiles.length + files.length > maxCount) {
      setErrorMsg(`최대 ${maxCount}장의 이미지만 등록 가능합니다.`);
      return;
    }

    const maxSizeBytes = 8 * 1024 * 1024; // 8MB
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    Array.from(files).forEach((file) => {
      if (!allowedTypes.includes(file.type)) {
        setErrorMsg("JPG, PNG, WebP 형식의 이미지 파일만 업로드할 수 있습니다.");
        return;
      }
      if (file.size > maxSizeBytes) {
        setErrorMsg("파일 한 장당 최대 크기는 8MB입니다.");
        return;
      }

      // Convert to base64 Data URI
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result && typeof e.target.result === "string") {
          validFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            base64: e.target.result
          });
          onChange([...validFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveImage = (id: string) => {
    const updated = images.filter((img) => img.id !== id);
    onChange(updated);
    setErrorMsg("");
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Thumbnail Previews Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-2 w-full">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative aspect-square rounded-xl border border-[var(--border-subtle)] bg-cream-2 overflow-hidden shadow-sm group animate-scale-in"
            >
              <img
                src={img.base64}
                alt="미리보기"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemoveImage(img.id)}
                className="absolute top-1 right-1 grid h-5.5 w-5.5 place-items-center rounded-full bg-ink/70 text-cream opacity-90 hover:bg-coral transition-colors duration-150 shadow"
                aria-label="이미지 제거"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag & Drop Zone */}
      {images.length < maxCount && (
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={triggerUploadClick}
          className="border-2 border-dashed border-[var(--border-subtle)] bg-white/40 hover:bg-white hover:border-coral/45 rounded-2xl py-3 px-4 flex items-center justify-center gap-3 cursor-pointer transition-all duration-200 select-none shadow-[inset_0_1px_rgba(255,255,255,.5)]"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <UploadCloud className="w-5 h-5 text-coral/80 shrink-0 animate-pulse" />
          <div className="flex flex-col text-left">
            <span className="text-[11.5px] font-bold text-primary">
              이미지 끌어서 놓기 또는 파일 찾기 ({images.length} / {maxCount})
            </span>
            <span className="text-[10px] text-secondary">
              최대 8MB, JPG / PNG / WebP 지원. 클립보드 붙여넣기(Ctrl+V) 지원.
            </span>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-coral-deep bg-coral/8 px-3 py-2 rounded-xl border border-coral/15 animate-shake">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
}
