import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminTabPanel from "@/components/admin/AdminTabPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { ReviewRecord, getSupabaseAdminClient } from "@/lib/supabase-admin";

export default async function AdminOrdersPage() {
  const session = getSessionFromCookies(cookies());
  if (!isAdminSession(session)) redirect(`/start?returnTo=${encodeURIComponent("/admin/orders")}`);

  const supabase = getSupabaseAdminClient();
  let reviews: ReviewRecord[] = [];
  let configError = false;

  if (!supabase) {
    configError = true;
  } else {
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("id,order_id,user_provider,user_provider_account_id,rating,body,display_name,masked_name,status,bonus_status,created_at,reviewed_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (reviewError) {
      console.error("Failed to fetch reviews:", reviewError.message);
    } else {
      reviews = (reviewData || []) as ReviewRecord[];
    }
  }

  return (
    <main className="dashboard-page-shell noise relative min-h-screen bg-cream py-10 text-primary">
      <section className="container-cinematic relative z-[1]">
        <header className="flex items-center justify-between gap-4 py-4">
          <a href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <BrandLogo size={20} type="full" />
            <span className="font-mono text-xs font-semibold uppercase tracking-[0.16em] text-coral bg-coral/10 px-2 py-0.5 rounded">Admin</span>
          </a>
          <a href="/dashboard" className="rounded-full border border-[var(--border-subtle)] bg-cream px-4 py-2 text-sm font-bold text-secondary transition hover:border-coral/50 hover:text-coral">Dashboard</a>
        </header>
        <div className="py-10">
          <p className="text-sm font-semibold text-coral">Admin Console</p>
          <h1 className="mt-4 text-[clamp(42px,6vw,76px)] font-[680] leading-[1.05] tracking-[-0.04em] mb-10">주문 · 리뷰 · 잔액충전 관리</h1>
          {configError ? (
            <p className="mt-8 rounded-2xl border border-coral/25 bg-coral/10 px-5 py-4 text-sm font-semibold text-coral">Supabase 서버 환경변수 설정이 필요합니다.</p>
          ) : (
            <AdminTabPanel initialReviews={reviews} />
          )}
        </div>
      </section>
    </main>
  );
}

