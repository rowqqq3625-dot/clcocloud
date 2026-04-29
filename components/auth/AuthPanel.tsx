import { BrandLogo } from "@/components/ui/BrandLogo";
import { SocialAuthButton } from "@/components/auth/SocialAuthButton";
import type { AuthMode } from "@/lib/auth-providers";

type AuthPanelProps = {
  mode: AuthMode;
  error?: string;
  returnTo?: string;
};

const errorMessages: Record<string, string> = {
  provider_not_configured: "소셜 시작하기 환경변수가 아직 설정되지 않았습니다.",
  invalid_state: "인증 상태가 만료되었습니다. 다시 시도하세요.",
  oauth_failed: "소셜 인증을 완료하지 못했습니다.",
  unknown_provider: "지원하지 않는 시작 방식입니다."
};

function renderLines(text: string) {
  return text.split("\n").map((line) => (
    <span key={line} className="block sm:whitespace-nowrap">
      {line}
    </span>
  ));
}

export function AuthPanel({ mode, error, returnTo }: AuthPanelProps) {
  const sideHeadline = "더 저렴하게 쓰고,\n더 오래 관리하세요.";
  const headline = "불안한 구독 대신,\n내 API 키로 시작하세요.";
  const subcopy = "더 투명하게, 더 편하게 관리하세요.";

  return (
    <main className="auth-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-12">
      <div className="pointer-events-none absolute -right-36 top-20 h-[560px] w-[560px] rounded-full bg-coral/20 blur-[180px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />
      <div className="pointer-events-none absolute left-1/2 top-10 h-px w-[min(760px,80vw)] -translate-x-1/2 bg-[linear-gradient(90deg,transparent,var(--coral),transparent)] opacity-50" />

      <section className="container-cinematic relative z-[1] grid min-h-[calc(100vh-64px)] place-items-center">
        <div className="auth-stage-grid w-full max-w-[1120px] overflow-hidden rounded-[34px] border border-[var(--border-subtle)] bg-cream shadow-[0_32px_120px_rgba(31,30,29,.16)]">
          <aside className="relative hidden min-h-[680px] overflow-hidden bg-dark p-10 text-cream lg:block">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-coral/35 blur-[90px]" />
            <div className="absolute bottom-0 left-0 h-52 w-full bg-[linear-gradient(0deg,rgba(217,119,87,.32),transparent)]" />
            <div className="relative z-[1] flex items-center gap-3 text-lg font-bold">
              <BrandLogo size={42} className="drop-shadow-[0_18px_40px_rgba(245,239,230,.20)]" />
              클코클라우드
            </div>

            <div className="relative z-[1] mt-20">
              <p className="text-sm font-semibold text-coral-hi">개인 API 키 전용 콘솔</p>
              <h2 className="mt-5 max-w-[430px] break-keep text-[clamp(36px,4.2vw,56px)] font-[680] leading-[1.12] tracking-[-0.038em]">
                {renderLines(sideHeadline)}
              </h2>
            </div>

            <div className="auth-card-scene absolute left-1/2 top-[368px] z-[1] h-[220px] w-[390px] -translate-x-1/2">
              <div className="auth-3d-card">
                <div className="auth-3d-card__glare" />
                <div className="relative z-[2] flex items-start justify-between">
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-coral-hi/90">Balance Console</p>
                    <p className="mt-2 text-[14px] font-semibold text-cream/62">API 키 잔액</p>
                  </div>
                  <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cream/10 bg-cream/10 shadow-[inset_0_1px_rgba(255,255,255,.12)]">
                    <BrandLogo size={28} />
                  </div>
                </div>
                <div className="relative z-[2] mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-[42px] font-[720] leading-none tracking-[-0.05em] text-cream">$1000</span>
                    <span className="pb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/42">available</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-cream/10">
                    <div className="auth-3d-card__meter h-full w-[72%] rounded-full" />
                  </div>
                </div>
                <div className="relative z-[2] mt-4 grid grid-cols-3 gap-2">
                  {["잔액", "상태", "기록"].map((item) => (
                    <div key={item} className="rounded-2xl border border-cream/10 bg-cream/[.075] px-3 py-2 text-center shadow-[inset_0_1px_rgba(255,255,255,.08)]">
                      <span className="block text-[11px] font-semibold text-cream/72">{item}</span>
                      <span className="mx-auto mt-1.5 block h-1.5 w-1.5 rounded-full bg-coral-hi shadow-[0_0_20px_rgba(232,144,114,.8)]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="relative bg-[radial-gradient(circle_at_80%_8%,rgba(217,119,87,.13),transparent_32%),linear-gradient(180deg,var(--bg-cream),var(--bg-cream-2))] p-6 sm:p-10 lg:p-12">
            <div className="flex items-center justify-between gap-4">
              <a href="/" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em] lg:hidden">
                <BrandLogo size={34} />
                클코클라우드
              </a>
              <div className="hidden text-sm font-semibold text-secondary/70 lg:block">비밀번호 없이 빠르게 시작</div>
              <a href="/" className="grid h-11 w-11 place-items-center rounded-full border border-[var(--border-subtle)] bg-cream text-2xl font-light leading-none text-secondary shadow-sm transition hover:border-coral/50 hover:text-coral" aria-label="닫기">
                ×
              </a>
            </div>

            <div className="mt-12">
              <p className="text-sm font-semibold text-coral">시작은 간단하게</p>
              <h1 className="mt-4 max-w-[680px] break-keep text-[clamp(34px,4.2vw,52px)] font-[680] leading-[1.14] tracking-[-0.036em] text-primary">
                {renderLines(headline)}
              </h1>
              <p className="mt-6 max-w-[540px] break-keep text-[17px] leading-[1.68] tracking-[-0.01em] text-secondary">
                {subcopy}
              </p>
            </div>

            <div className="mt-8 grid gap-3 rounded-[24px] border border-[var(--border-subtle)] bg-cream/76 p-3 shadow-[inset_0_1px_rgba(255,255,255,.55),0_18px_50px_rgba(31,30,29,.08)] backdrop-blur-xl sm:p-4">
              <SocialAuthButton provider="google" mode={mode} returnTo={returnTo} tone="premium" />
              <SocialAuthButton provider="kakao" mode={mode} returnTo={returnTo} tone="premium" />
              <SocialAuthButton provider="naver" mode={mode} returnTo={returnTo} tone="premium" />
            </div>

            {error ? (
              <p className="mt-5 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-medium text-coral">
                {errorMessages[error] || "인증 요청을 처리하지 못했습니다."}
              </p>
            ) : null}

          </div>
        </div>
      </section>
    </main>
  );
}
