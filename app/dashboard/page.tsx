"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { KeyInputCard, type SavedDashboardKey } from "@/components/dashboard/KeyInputCard";
import { AdminDashboardView } from "@/components/dashboard/AdminDashboardView";
import { wipeReveal } from "@/lib/motion";
import { AipProvider } from "@/lib/dashboard/client/context/AipContext";

export default function DashboardPage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<SavedDashboardKey[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [keyErrorModal, setKeyErrorModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Load from localStorage strictly on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const active = localStorage.getItem("clcocloud_active_key");
      const saved = localStorage.getItem("clcocloud_saved_keys");
      
      if (active === "admin") {
        setIsAdmin(true);
        setActiveKey("admin");
      } else if (active) {
        setActiveKey(active);
      }

      if (saved) {
        try {
          setSavedKeys(JSON.parse(saved));
        } catch (e) {
          setSavedKeys([]);
        }
      }
    }
  }, []);

  const handleKeySubmit = async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) return;

    if (trimmed === "pgdk4983") {
      setIsValidating(true);
      try {
        const response = await fetch("/api/dashboard/aip/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: "pgdk4983" }),
        });
        const data = await response.json();
        if (response.ok && data.ok) {
          localStorage.setItem("clcocloud_active_key", "admin");
          setIsAdmin(true);
          setActiveKey("admin");
        } else {
          alert("관리자 비밀번호가 올바르지 않습니다.");
        }
      } catch (err) {
        alert("관리자 로그인 중 오류가 발생했습니다.");
      } finally {
        setIsValidating(false);
      }
      return;
    }

    // Instant client-side format check to isolate obviously non-existent keys
    const API_KEY_PATTERN = /^sk-(?:ant-api\d{2}-)?[A-Za-z0-9._-]{8,512}$/;
    if (!API_KEY_PATTERN.test(trimmed)) {
      setKeyErrorModal(true);
      return;
    }

    // Normal API Key validation via lookup/summary pre-fetch
    setIsValidating(true);
    try {
      const response = await fetch("/api/dashboard/aip/lookup/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: trimmed, range: "7d" }),
      });
      if (!response.ok) {
        setKeyErrorModal(true);
        return;
      }
      const data = await response.json();
      if (!data.credit) {
        setKeyErrorModal(true);
        return;
      }

      // Valid API key, update localStorage
      localStorage.setItem("clcocloud_last_key", trimmed);
      const masked = trimmed.slice(0, 8) + "••••••••" + trimmed.slice(-4);
      const newRecord: SavedDashboardKey = {
        id: trimmed,
        masked_api_key: masked,
        apiKey: trimmed,
        last_status: data.credit.status,
        last_balance: data.credit.remainingUsd,
        last_spend_cap: data.credit.limitUsd,
        last_rpm: 1000,
        last_checked_at: new Date().toISOString(),
      };

      setSavedKeys((prev) => {
        const filtered = prev.filter((k) => k.apiKey !== trimmed);
        const updated = [newRecord, ...filtered].slice(0, 5);
        localStorage.setItem("clcocloud_saved_keys", JSON.stringify(updated));
        return updated;
      });

      localStorage.setItem("clcocloud_active_key", trimmed);
      setActiveKey(trimmed);
    } catch (err) {
      setKeyErrorModal(true);
    } finally {
      setIsValidating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("clcocloud_active_key");
    setActiveKey(null);
    setIsAdmin(false);
  };

  const handleDeleteKey = (keyId: string) => {
    setSavedKeys((prev) => {
      const updated = prev.filter((k) => k.id !== keyId);
      localStorage.setItem("clcocloud_saved_keys", JSON.stringify(updated));
      return updated;
    });
    if (typeof window !== "undefined" && localStorage.getItem("clcocloud_last_key") === keyId) {
      localStorage.removeItem("clcocloud_last_key");
    }
  };

  return (
    <AipProvider basePath="/api/dashboard/aip">
      <main className="dashboard-page-shell noise relative overflow-hidden py-16 sm:py-24">
        {/* Validation Overlay */}
        {isValidating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-cream/60 backdrop-blur-[2px]">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
              <p className="font-mono text-xs text-secondary">API 키 유효성 검증 중...</p>
            </div>
          </div>
        )}

        {/* Invalid Key Error Modal */}
        <AnimatePresence>
          {keyErrorModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div 
                className="absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity cursor-pointer" 
                onClick={() => setKeyErrorModal(false)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-coral/20 bg-cream p-8 shadow-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-coral/10 text-coral">
                    <AlertCircle className="h-8 w-8" />
                  </div>
                  
                  <h3 className="mt-5 text-xl font-bold tracking-[-0.015em] text-primary">조회 실패</h3>
                  <p className="mt-3 text-sm leading-[1.6] text-secondary">
                    해당 API 키는 존재하지 않습니다.
                  </p>
                  <p className="mt-2 text-xs leading-[1.6] text-secondary/70">
                    입력하신 API 키가 올바른지 다시 한번 확인해 주세요. 혹은 신규 발급된 키의 경우 동기화에 몇 분 정도 소요될 수 있습니다.
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => setKeyErrorModal(false)}
                    className="mt-6 w-full rounded-xl bg-coral py-3 text-sm font-semibold text-cream shadow-md transition hover:bg-coral-hi"
                  >
                    확인
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="container-cinematic relative z-[1]">
          <section className="mb-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[760px] border-l border-coral pl-5">
              <SplitHeading
                as="h1"
                className="mt-4 max-w-[720px] text-[clamp(38px,6vw,76px)] font-[680] leading-[1.15] tracking-[-0.025em] text-primary"
                lines={isAdmin ? ["관리자 제어반"] : ["클로드 API 키 사용량조회"]}
              />
              {isAdmin && (
                <p className="mt-5 max-w-[620px] text-[clamp(16px,1.4vw,18px)] leading-[1.65] tracking-[-0.01em] text-secondary">
                  잔액 부족으로 등록 차단 처리된 전체 활성 키 목록을 확인 및 관리합니다.
                </p>
              )}
              <motion.span
                className="mt-6 block h-[1.5px] w-10 bg-coral"
                initial="hidden"
                animate="visible"
                variants={wipeReveal}
              />
            </div>

            {activeKey ? (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={handleLogout} className="font-mono text-[13px] font-semibold text-coral underline decoration-coral/30 underline-offset-4 transition hover:decoration-coral">
                  ← 다른 키 조회하기
                </button>
                <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border-subtle)] px-4 text-sm font-semibold text-primary transition hover:border-coral/50 hover:text-coral">
                  홈으로 돌아가기
                </a>
              </div>
            ) : null}
          </section>

          <AnimatePresence mode="wait">
            {!activeKey ? (
              <motion.section
                key="input"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                  exit: { opacity: 0, y: -24, transition: { duration: 0.3 } }
                }}
              >
                <KeyInputCard onKeySubmit={handleKeySubmit} savedKeys={savedKeys} onDeleteKey={handleDeleteKey} />
              </motion.section>
            ) : isAdmin ? (
              <motion.section
                key="admin"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0, y: 32 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                  exit: { opacity: 0, y: -18, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <AdminDashboardView onLogout={handleLogout} />
              </motion.section>
            ) : (
              <motion.section
                key="result"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={{
                  hidden: { opacity: 0, y: 32 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
                  exit: { opacity: 0, y: -18, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <DashboardView apiKey={activeKey} />
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </main>
    </AipProvider>
  );
}
