import React from "react";

interface AgreementCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function AgreementCheckbox({ checked, onChange }: AgreementCheckboxProps) {
  return (
    <div className="flex items-start gap-2.5 py-3 select-none">
      <div className="flex items-center h-5">
        <input
          id="terms-agreement"
          name="terms-agreement"
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded border-[rgba(232,224,210,0.15)] bg-[var(--surface-dark-2)] text-[var(--coral)] focus:ring-[var(--coral)] focus:ring-offset-[var(--surface-dark)] cursor-pointer accent-[var(--coral)]"
        />
      </div>
      <label 
        htmlFor="terms-agreement" 
        className="text-[12px] text-[var(--cream-soft)] leading-normal opacity-70 cursor-pointer hover:opacity-90 transition-opacity duration-200"
      >
        (필수) 본 상품의{" "}
        <a 
          href="/terms" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-[var(--coral)] underline underline-offset-4 decoration-[0.5px] hover:text-[var(--coral-soft)] transition-colors"
          onClick={(e) => e.stopPropagation()} // 체크박스 트리거 방지
        >
          이용약관 및 정책 전문
        </a>
        을 모두 확인하였으며, 이에 동의합니다.
      </label>
    </div>
  );
}
