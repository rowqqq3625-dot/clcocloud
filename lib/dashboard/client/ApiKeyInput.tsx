'use client';

import React, { FormEvent } from 'react';

interface ApiKeyInputProps {
  value: string;
  loading: boolean;
  syncing: boolean;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onGuideOpen: () => void;
}

export function ApiKeyInput({
  value,
  loading,
  syncing,
  onValueChange,
  onSubmit,
  onGuideOpen,
}: ApiKeyInputProps) {
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form className="aip-panel aip-key-form" onSubmit={submit}>
      <label className="aip-label" htmlFor="aip-api-key">
        API 키 조회
      </label>
      <div className="aip-input-row">
        <input
          id="aip-api-key"
          className="aip-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          autoCapitalize="none"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="클로드 API키를 입력하세요."
        />
        <button className="aip-button aip-button-primary" type="submit" disabled={loading || value.trim() === ''}>
          조회
        </button>
      </div>
      <button className="aip-button aip-button-secondary aip-guide-trigger" type="button" onClick={onGuideOpen} disabled={value.trim() === ''}>
        사용법
      </button>
      {syncing && (
        <div className="aip-sync-line" aria-live="polite">
          <span className="aip-sync-dot" aria-hidden="true" />
          동기화 중
        </div>
      )}
    </form>
  );
}
