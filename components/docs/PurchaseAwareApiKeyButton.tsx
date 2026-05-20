"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";

type SessionState = {
  authenticated?: boolean;
  hasHistory?: boolean;
};

export function PurchaseAwareApiKeyButton() {
  const [session, setSession] = useState<SessionState | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => {
        if (active) setSession(data as SessionState);
      })
      .catch(() => {
        if (active) setSession({ authenticated: false, hasHistory: false });
      });
    return () => {
      active = false;
    };
  }, []);

  const href = session?.hasHistory ? "/mypage#api-key-history" : "/checkout?plan=standard";
  const label = session === null ? "구매 내역 확인 중" : session.hasHistory ? "API 키 구매내역 보기" : "플랜 선택하고 키 구매하기";
  const detail =
    session?.hasHistory
      ? "이미 구매한 키는 마이페이지의 API 키 구매내역에서 확인합니다."
      : "구매 내역이 없으면 플랜 선택 화면에서 먼저 키를 구매합니다.";

  return (
    <a className="docs-action-card docs-action-card-primary" href={href} aria-busy={session === null}>
      <KeyRound size={20} aria-hidden="true" />
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <ArrowRight size={18} aria-hidden="true" />
    </a>
  );
}
