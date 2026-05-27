"use client";

import { AdminConfirmDialog } from "../AdminConfirmDialog";

type Props = {
  open: boolean;
  keyId: string;
  keyPreview: string | null;
  csrfToken: string;
  onClose: () => void;
  onSuccess?: () => void;
};

// 키 폐기 확인 다이얼로그.
// AdminConfirmDialog 베이스 — 정확 문구 "REVOKE" + 사유 4자 이상 필수.
export function RevokeConfirmDialog({ open, keyId, keyPreview, csrfToken, onClose, onSuccess }: Props) {
  const handleConfirm = async (reason: string) => {
    const res = await fetch(`/api/admin/vending/keys/${keyId}/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "revoke_failed");
    }
    onSuccess?.();
  };

  return (
    <AdminConfirmDialog
      open={open}
      title="API 키 폐기"
      message={`${keyPreview || keyId} 키를 폐기합니다. 이 키는 이후 결제에 사용되지 않습니다.`}
      confirmPhrase="REVOKE"
      onConfirm={handleConfirm}
      onClose={onClose}
    />
  );
}
