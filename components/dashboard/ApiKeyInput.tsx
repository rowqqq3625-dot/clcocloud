"use client";

import React, { useState } from "react";

export function ApiKeyInput({ onKeySubmit }: { onKeySubmit: (key: string) => void }) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setError("API 키를 입력해주세요.");
      return;
    }
    // Remove strict startsWith("rm_") to allow ClkoCloud's "sk-clco-" prefix as well.
    if (apiKey.trim().length < 10) {
      setError("올바른 API 키 형식이 아닙니다.");
      return;
    }
    setError(null);
    onKeySubmit(apiKey.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-12 p-8 bg-white/60 backdrop-blur-xl rounded-[32px] border border-neutral-200/60 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)]">
      <h2 className="text-2xl font-bold text-neutral-800 mb-2">대시보드 접속</h2>
      <p className="text-sm text-neutral-500 mb-6">발급받으신 API 키를 입력하여 잔액과 사용량을 실시간으로 확인하세요.</p>
      
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="apiKey" className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
            API KEY
          </label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-clco-..."
            className="w-full px-4 py-3 bg-white border border-neutral-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-coral/20 focus:border-coral transition-all"
            autoComplete="off"
            spellCheck="false"
          />
          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </div>
        <button
          type="submit"
          className="w-full py-3 px-4 bg-coral hover:bg-coral-hi text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          대시보드 조회
        </button>
      </form>
    </div>
  );
}
