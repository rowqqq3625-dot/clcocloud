import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { OrderRecord, getSupabaseAdminClient } from "@/lib/supabase-admin";

export default async function AdminOrdersPage() {
  const session = getSessionFromCookies(cookies());
  if (!isAdminSession(session)) redirect(`/start?returnTo=${encodeURIComponent("/admin/orders")}`);

  const supabase = getSupabaseAdminClient();
  let orders: OrderRecord[] = [];
  let configError = false;

  if (!supabase) {
    configError = true;
  } else {
    const { data } = await supabase
      .from("orders")
      .select("id,user_provider,user_provider_account_id,user_email,contact_email,plan_id,plan_name,balance_usd,price_krw,os_targets,status,created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    orders = (data || []) as OrderRecord[];
  }

  return (
    <main className="dashboard-page-shell noise relative min-h-screen bg-cream py-10 text-primary">
      <section className="container-cinematic relative z-[1]">
        <header className="flex items-center justify-between gap-4 py-4">
          <a href="/" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em]">
            <BrandLogo size={34} />
            클코클라우드 관리자
          </a>
          <a href="/dashboard" className="rounded-full border border-[var(--border-subtle)] bg-cream px-4 py-2 text-sm font-bold text-secondary transition hover:border-coral/50 hover:text-coral">Dashboard</a>
        </header>
        <div className="py-10">
          <p className="text-sm font-semibold text-coral">Admin Orders</p>
          <h1 className="mt-4 text-[clamp(42px,6vw,76px)] font-[680] leading-[1.05] tracking-[-0.04em]">입금 확인 대기 주문</h1>
          {configError ? (
            <p className="mt-8 rounded-2xl border border-coral/25 bg-coral/10 px-5 py-4 text-sm font-semibold text-coral">Supabase 서버 환경변수 설정이 필요합니다.</p>
          ) : (
            <div className="mt-10"><AdminOrdersTable orders={orders} /></div>
          )}
        </div>
      </section>
    </main>
  );
}
