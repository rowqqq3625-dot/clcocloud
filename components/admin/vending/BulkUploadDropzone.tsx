"use client";

import { useRef, useState } from "react";

type Props = {
  onFile: (file: File) => void | Promise<void>;
  busy?: boolean;
  accept?: string;
};

export function BulkUploadDropzone({ onFile, busy, accept = ".csv,text/csv" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const handle = (f: File | undefined) => {
    if (!f) return;
    setName(f.name);
    onFile(f);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files?.[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={[
        "grid cursor-pointer place-items-center gap-2 rounded-2xl border-2 border-dashed bg-black/30 p-8 text-center text-xs transition",
        over ? "border-[#D97757] text-[#F0E2D2]" : "border-cream/15 text-cream/60 hover:border-cream/30",
        busy ? "pointer-events-none opacity-60" : "",
      ].join(" ")}
    >
      <p className="font-mono uppercase tracking-[0.16em]">CSV 업로드</p>
      <p>헤더: plan_code, api_key, memo (최대 500행, 5MB)</p>
      <p className="text-[10px] text-cream/40">{name ? `선택됨: ${name}` : "파일을 드래그하거나 클릭해서 선택"}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0] ?? undefined)}
      />
    </div>
  );
}
