import type { AuthProvider, AuthMode } from "@/lib/auth-providers";
import Image from "next/image";

type SocialAuthButtonProps = {
  provider: AuthProvider;
  mode: AuthMode;
  variant?: "wide" | "icon";
  featured?: boolean;
  tone?: "premium" | "default";
  returnTo?: string;
};

const providerMeta = {
  google: {
    label: "구글",
    icon: "/auth-icons/google.svg",
    className: "border-[var(--border-subtle)] bg-cream text-primary hover:border-coral/50"
  },
  naver: {
    label: "네이버",
    icon: "/auth-icons/naver.svg",
    className: "border-[var(--border-subtle)] bg-cream text-primary hover:border-[#03C75A]/60"
  },
  kakao: {
    label: "카카오",
    icon: "/auth-icons/kakao.png",
    className: "border-[var(--border-subtle)] bg-cream text-primary hover:border-[#FEE500]"
  }
} as const;

export function SocialAuthButton({ provider, mode, variant = "wide", featured = false, tone = "default", returnTo }: SocialAuthButtonProps) {
  const meta = providerMeta[provider];
  const href = `/api/auth/${provider}?mode=${mode}${returnTo ? `&returnTo=${encodeURIComponent(returnTo)}` : ""}`;
  const action = "시작";

  if (variant === "icon") {
    const iconSizeClass = provider === "kakao" ? "h-[62px] w-[62px]" : "h-14 w-14";

    return (
      <a
        href={href}
        aria-label={`${meta.label}로 ${action}`}
        className={`group grid h-16 w-16 place-items-center overflow-hidden rounded-full border shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg ${meta.className}`}
      >
        <Image src={meta.icon} alt="" width={60} height={60} className={`${iconSizeClass} rounded-full object-contain transition duration-300 group-hover:scale-[1.02]`} />
      </a>
    );
  }

  const premiumClass = provider === "kakao"
    ? "border-[#FEE500] bg-[#FEE500] text-[#2B1715] shadow-[0_18px_50px_rgba(254,229,0,.24)] hover:shadow-[0_22px_74px_rgba(254,229,0,.32)]"
    : provider === "naver"
      ? "border-[#03C75A] bg-[#03C75A] text-white shadow-[0_18px_50px_rgba(3,199,90,.20)] hover:shadow-[0_22px_74px_rgba(3,199,90,.28)]"
      : "border-[rgba(31,30,29,.12)] bg-white text-primary shadow-[0_18px_50px_rgba(31,30,29,.10)] hover:border-[#4285F4]/45 hover:shadow-[0_22px_74px_rgba(66,133,244,.16)]";
  const arrowClass = provider === "kakao"
    ? "bg-[#2B1715]/10 text-[#2B1715]/70 group-hover:bg-[#2B1715] group-hover:text-[#FEE500]"
    : provider === "naver"
      ? "bg-white/18 text-white/82 group-hover:bg-white group-hover:text-[#03C75A]"
      : "bg-primary/8 text-primary/70 group-hover:bg-white group-hover:text-[#4285F4] group-hover:shadow-[0_0_0_1px_rgba(66,133,244,.18)]";

  return (
    <a
      href={href}
      className={`group relative flex min-h-[64px] w-full items-center justify-between gap-4 overflow-hidden rounded-[18px] border px-5 text-[16px] font-bold transition duration-300 hover:-translate-y-0.5 active:scale-[.985] ${tone === "premium" ? premiumClass : featured ? "bg-[#FEE500] text-[#2B1715] hover:border-[#FEE500]" : meta.className}`}
    >
      <span className="relative flex items-center gap-3">
        <span className={`${provider === "kakao" ? "h-11 w-11 overflow-hidden" : "h-10 w-10"} grid place-items-center rounded-full bg-cream/90 shadow-[inset_0_1px_rgba(255,255,255,.78),0_8px_22px_rgba(31,30,29,.08)]`}>
          <Image src={meta.icon} alt="" width={provider === "kakao" ? 44 : 32} height={provider === "kakao" ? 44 : 32} className={`${provider === "kakao" ? "h-11 w-11 scale-[1.12]" : "h-8 w-8"} rounded-full object-contain`} />
        </span>
        <span>{meta.label}로 {action}하기</span>
      </span>
      <span aria-hidden="true" className={`relative grid h-8 w-8 scale-90 place-items-center rounded-full font-mono text-sm opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:scale-100 group-hover:opacity-100 ${arrowClass}`}>→</span>
    </a>
  );
}
