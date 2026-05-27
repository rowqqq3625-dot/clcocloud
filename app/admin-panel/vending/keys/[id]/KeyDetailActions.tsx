"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VendingKeyStatus } from "@/lib/vending/types";
import { KeyDetailModal } from "@/components/admin/vending/KeyDetailModal";
import { RevokeConfirmDialog } from "@/components/admin/vending/RevokeConfirmDialog";
import { ReissueConfirmDialog } from "@/components/admin/vending/ReissueConfirmDialog";

type Props = {
  keyId: string;
  keyPreview: string | null;
  status: VendingKeyStatus;
  issuedOrderNo: string | null;
  csrfToken: string;
};

export function KeyDetailActions({ keyId, keyPreview, status, issuedOrderNo, csrfToken }: Props) {
  const router = useRouter();
  const [revealOpen, setRevealOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reissueOpen, setReissueOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 px-4 py-3">
      <button onClick={() => setRevealOpen(true)} className="rounded-full border border-cream/15 px-3 py-1.5 text-xs font-bold text-cream/80 hover:border-cream/40">
        원문 보기
      </button>
      {status === "issued" ? (
        <button onClick={() => setReissueOpen(true)} className="rounded-full bg-[#D97757]/20 px-3 py-1.5 text-xs font-bold text-[#F0E2D2] hover:bg-[#D97757]/30">
          재발급
        </button>
      ) : null}
      {(status === "available" || status === "issued") ? (
        <button onClick={() => setRevokeOpen(true)} className="rounded-full border border-[#D97757]/40 px-3 py-1.5 text-xs font-bold text-[#D97757] hover:bg-[#D97757]/10">
          폐기
        </button>
      ) : null}

      <KeyDetailModal open={revealOpen} keyId={keyId} csrfToken={csrfToken} onClose={() => setRevealOpen(false)} />
      <RevokeConfirmDialog
        open={revokeOpen}
        keyId={keyId}
        keyPreview={keyPreview}
        csrfToken={csrfToken}
        onClose={() => setRevokeOpen(false)}
        onSuccess={() => router.refresh()}
      />
      <ReissueConfirmDialog
        open={reissueOpen}
        keyId={keyId}
        keyPreview={keyPreview}
        orderNo={issuedOrderNo}
        csrfToken={csrfToken}
        onClose={() => setReissueOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
