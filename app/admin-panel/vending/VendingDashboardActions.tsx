"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Plan } from "@/lib/vending/types";
import { KeyRegisterModal } from "@/components/admin/vending/KeyRegisterModal";

type Props = {
  plans: Plan[];
  csrfToken: string;
};

export function VendingDashboardActions({ plans, csrfToken }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b]"
      >
        키 등록
      </button>
      <KeyRegisterModal
        open={open}
        plans={plans}
        csrfToken={csrfToken}
        onClose={() => setOpen(false)}
        onSuccess={() => router.refresh()}
      />
    </>
  );
}
