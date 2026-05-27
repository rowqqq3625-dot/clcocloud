"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Step = "password" | "date-code";

type Props = {
  initialStep: Step;
  csrfToken: string | null;
};

const DENY_MESSAGE = "접근할 수 없습니다.";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

export function AdminGateForm({ initialStep, csrfToken }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(initialStep);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  // MMDD — placeholder only; the actual rule is documented in the server lib.
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [step]);

  const submit = async (path: string, body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      // Prefer live cookie over the SSR-rendered prop: /api/session rotates
      // the CSRF cookie on every poll, so the prop captured at render time
      // becomes stale within seconds. Reading the cookie at submit time keeps
      // the header value in sync with what the server currently expects.
      const csrf = readCookie("clco-admin-csrf") || csrfToken;
      const response = await fetch(path, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          ...(csrf ? { "X-Admin-CSRF": csrf } : {}),
        },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        return (await response.json().catch(() => ({}))) as { next?: string };
      }
      setError(DENY_MESSAGE);
      return null;
    } catch {
      setError(DENY_MESSAGE);
      return null;
    } finally {
      setBusy(false);
    }
  };

  const onPasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submit("/api/admin/auth/password", { loginId, password });
    if (result) {
      setPassword("");
      setStep("date-code");
    }
  };

  const onDateCodeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = await submit("/api/admin/auth/date-code", { code });
    if (result?.next) {
      router.replace(result.next);
    }
  };

  return (
    <section className="w-full" aria-label="관리자 인증">
      <header className="mb-8 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">
          CLCOCLOUD · ADMIN
        </p>
        <h1 className="mt-3 text-lg font-bold text-cream">관리자 인증</h1>
      </header>

      {step === "password" ? (
        <form onSubmit={onPasswordSubmit} className="grid gap-3" autoComplete="off">
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>아이디</span>
            <input
              type="text"
              required
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-3 text-sm text-cream outline-none transition focus:border-[#D97757]"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>비밀번호</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="off"
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-3 text-sm text-cream outline-none transition focus:border-[#D97757]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="mt-2 rounded-full bg-[#D97757] px-5 py-3 text-sm font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
          >
            확인
          </button>
        </form>
      ) : (
        <form onSubmit={onDateCodeSubmit} className="grid gap-3" autoComplete="off">
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>암호</span>
            <input
              type="password"
              required
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
              autoComplete="off"
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-3 text-center font-mono text-base tracking-[0.4em] text-cream outline-none transition focus:border-[#D97757]"
            />
          </label>
          <button
            type="submit"
            disabled={busy || code.length !== 4}
            className="mt-2 rounded-full bg-[#D97757] px-5 py-3 text-sm font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
          >
            확인
          </button>
        </form>
      )}

      <p
        aria-live="polite"
        className="mt-5 min-h-[1.25rem] text-center text-xs text-cream/60"
      >
        {error || ""}
      </p>
    </section>
  );
}
