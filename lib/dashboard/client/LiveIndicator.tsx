'use client';

import React, { useEffect, useState } from 'react';

export function LiveIndicator({ updatedAt, syncing }: { updatedAt: Date | null; syncing?: boolean }) {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    function updateVisibility(): void {
      setVisible(document.visibilityState !== 'hidden');
    }
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const label = syncing
    ? '동기화 중'
    : visible
      ? updatedAt === null ? '30초마다 자동 업데이트' : '최근 업데이트 완료 · 30초 주기'
      : '일시정지';

  return (
    <span className={`aip-live ${visible ? '' : 'aip-live-paused'} ${syncing ? 'aip-live-syncing' : ''}`}>
      <span className="aip-live-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
