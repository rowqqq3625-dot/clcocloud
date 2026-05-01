import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminBalanceRequestsTable } from "@/components/admin/AdminBalanceRequestsTable";
import { AdminOrdersTable } from "@/components/admin/AdminOrdersTable";
import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { BalanceRequestRecord, OrderRecord, ReviewRecord, getSupabaseAdminClient } from "@/lib/supabase-admin";

export default async function AdminOrdersPage() {
  const session = getSessionFromCookies(cookies());
  if (!isAdminSession(session)) redirect(`/start?returnTo=${encodeURIComponent("/admin/orders")}`);

  const supabase = getSupabaseAdminClient();
  let orders: OrderRecord[] = [];
  let reviews: ReviewRecord[] = [];
  let balanceRequests: BalanceRequestRecord[] = [];
  let configError = false;

  if (!supabase) {
    configError = true;
  } else {
    const [{ data: orderData }, { data: reviewData }, { data: requestData }] = await Promise.all([
      supabase
        .from("orders")
        .select("id,user_provider,user_provider_account_id,user_email,contact_email,plan_id,plan_name,balance_usd,price_krw,os_targets,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("reviews")
        .select("id,order_id,user_provider,user_provider_account_id,rating,body,display_name,masked_name,status,bonus_status,created_at,reviewed_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("balance_requests")
        .select("id,user_provider,user_provider_account_id,contact_email,request_amount,message,status,admin_note,created_at,updated_at")
        .order("created_at", { ascending: false })
        .limit(100)
    ]);

    orders = (orderData || []) as OrderRecord[];
    reviews = (reviewData || []) as ReviewRecord[];
    balanceRequests = (requestData || []) as BalanceRequestRecord[];
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
          <p className="text-sm font-semibold text-coral">Admin Console</p>
          <h1 className="mt-4 text-[clamp(42px,6vw,76px)] font-[680] leading-[1.05] tracking-[-0.04em]">주문 · 리뷰 · 잔액충전 관리</h1>
          {configError ? (
            <p className="mt-8 rounded-2xl border border-coral/25 bg-coral/10 px-5 py-4 text-sm font-semibold text-coral">Supabase 서버 환경변수 설정이 필요합니다.</p>
          ) : (
            <div className="mt-10 grid gap-10">
              <AdminSection eyebrow="Orders" title="주문내역">
                <AdminOrdersTable orders={orders} />
              </AdminSection>
              <AdminSection eyebrow="Reviews" title="리뷰 승인 · $30 보너스 지급">
                <AdminReviewsTable reviews={reviews} />
              </AdminSection>
              <AdminSection eyebrow="Balance" title="잔액충전 문의">
                <AdminBalanceRequestsTable requests={balanceRequests} />
              </AdminSection>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function AdminSection({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section>
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">{eyebrow}</p>
      <h2 className="mt-2 text-[clamp(30px,4vw,48px)] font-[680] tracking-[-0.04em]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}
