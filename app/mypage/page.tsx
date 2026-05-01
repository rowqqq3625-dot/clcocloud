import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getSessionFromCookies } from "@/lib/auth-session";
import { getSupabaseAdminClient, type BonusStatus, type OrderRecord, type OrderStatus, type ReviewRecord, type ReviewStatus } from "@/lib/supabase-admin";

const providerLabels: Record<string, string> = {
  google: "Google",
  kakao: "Kakao",
  naver: "Naver"
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "확인중",
  paid: "입금확인",
  issued: "발급완료"
};

const statusClassNames: Record<OrderStatus, string> = {
  pending: "bg-coral/10 text-coral",
  paid: "bg-[#5A8A6B]/10 text-[#5A8A6B]",
  issued: "bg-primary text-cream"
};

const reviewStatusLabels: Record<ReviewStatus, string> = {
  pending: "리뷰 확인중",
  approved: "리뷰 승인",
  rejected: "리뷰 반려"
};

const bonusStatusLabels: Record<BonusStatus, string> = {
  none: "보너스 없음",
  pending: "$30 지급 대기",
  paid: "$30 지급완료"
};

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function MyPage() {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent("/mypage")}`);

  const supabase = getSupabaseAdminClient();
  let orders: OrderRecord[] = [];
  let reviews: Pick<ReviewRecord, "id" | "order_id" | "status" | "bonus_status" | "created_at">[] = [];
  let configError = false;

  if (!supabase) {
    configError = true;
  } else {
    const { data } = await supabase
      .from("orders")
      .select("id,user_provider,user_provider_account_id,user_email,contact_email,plan_id,plan_name,balance_usd,price_krw,os_targets,status,created_at")
      .eq("user_provider", session.provider)
      .eq("user_provider_account_id", session.providerAccountId)
      .order("created_at", { ascending: false })
      .limit(20);
    orders = (data || []) as OrderRecord[];

    if (orders.length > 0) {
      const { data: reviewData } = await supabase
        .from("reviews")
        .select("id,order_id,status,bonus_status,created_at")
        .eq("user_provider", session.provider)
        .eq("user_provider_account_id", session.providerAccountId)
        .in("order_id", orders.map((order) => order.id));
      reviews = (reviewData || []) as Pick<ReviewRecord, "id" | "order_id" | "status" | "bonus_status" | "created_at">[];
    }
  }

  const displayEmail = session.email || "연동 이메일 없음";
  const provider = providerLabels[session.provider] || session.provider;
  const latestOrder = orders[0];
  const reviewsByOrderId = new Map(reviews.map((review) => [review.order_id, review]));

  return (
    <main className="dashboard-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />

      <SiteHeader variant="floating" />
      <section className="container-cinematic relative z-[1]">
        <section className="grid gap-6 py-10 lg:grid-cols-[minmax(0,.84fr)_minmax(0,1.16fr)] lg:py-14">
          <aside className="relative overflow-hidden rounded-[34px] border border-cream/10 bg-dark p-7 text-cream shadow-[0_32px_100px_rgba(31,30,29,.22)] sm:p-9">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-coral/35 blur-[90px]" />
            <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-full bg-[linear-gradient(0deg,rgba(217,119,87,.30),transparent)]" />
            <div className="relative z-[1]">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral-hi">My Console</p>
              <h1 className="mt-5 max-w-[520px] break-keep text-[clamp(42px,7vw,78px)] font-[680] leading-[1.02] tracking-[-0.055em]">
                주문과 API 키를 한 곳에서 관리하세요.
              </h1>
              <p className="mt-6 max-w-md break-keep text-[16px] leading-7 text-cream/62">
                결제 진행 상태, 발급 안내, API 키 상태 조회로 이어지는 개인 관리 페이지입니다.
              </p>

              <div className="mt-9 grid gap-3">
                <InfoTile label="연동 계정" value={displayEmail} />
                <InfoTile label="시작 방식" value={provider} />
                <InfoTile label="최근 주문" value={latestOrder ? `${latestOrder.plan_name} · ${statusLabels[latestOrder.status]}` : "주문 없음"} />
              </div>
            </div>
          </aside>

          <div className="grid gap-6">
            <section className="rounded-[32px] border border-[var(--border-subtle)] bg-cream/84 p-5 shadow-[0_24px_80px_rgba(31,30,29,.10)] backdrop-blur-xl sm:p-7">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">Orders</p>
                  <h2 className="mt-2 text-[clamp(28px,4vw,42px)] font-[680] leading-tight tracking-[-0.035em]">내 주문</h2>
                </div>
                <a href="/checkout?plan=standard" className="rounded-full border border-coral/25 bg-coral/10 px-4 py-2 text-sm font-bold text-coral transition hover:bg-coral hover:text-cream">
                  새 결제
                </a>
              </div>

              {configError ? (
                <p className="mt-6 rounded-2xl border border-coral/25 bg-coral/10 px-5 py-4 text-sm font-semibold text-coral">
                  주문 저장소 설정이 필요합니다. Supabase 환경변수를 설정하면 주문내역이 표시됩니다.
                </p>
              ) : orders.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {orders.map((order) => (
                    <article key={order.id} className="rounded-3xl border border-[var(--border-subtle)] bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-coral/35 hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-bold tracking-[-0.02em]">{order.plan_name} · ${order.balance_usd}</p>
                          <p className="mt-1 text-sm text-secondary">{formatDate(order.created_at)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClassNames[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <OrderMeta label="가격" value={`₩${formatKrw(order.price_krw)}`} />
                        <OrderMeta label="이메일" value={order.contact_email} />
                        <OrderMeta label="OS" value={order.os_targets.join(", ")} />
                      </div>
                      <ReviewOrderAction order={order} review={reviewsByOrderId.get(order.id)} />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-[var(--border-subtle)] bg-white/55 px-5 py-10 text-center">
                  <p className="text-lg font-bold">아직 주문내역이 없습니다.</p>
                  <p className="mt-2 text-sm leading-6 text-secondary">필요한 잔액을 선택하면 이곳에서 결제와 발급 상태를 확인할 수 있습니다.</p>
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <section className="relative overflow-hidden rounded-[32px] border border-[var(--border-subtle)] bg-cream/84 p-6 shadow-[0_24px_80px_rgba(31,30,29,.08)]">
                <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-coral/10 blur-[70px]" />
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">API Key</p>
                <h2 className="mt-3 text-3xl font-[680] tracking-[-0.035em]">API 키 관리</h2>
                <p className="mt-4 break-keep text-sm leading-7 text-secondary">발급받은 API 키의 잔액과 사용량을 대시보드에서 실시간으로 확인하세요.</p>
                <a href="/dashboard" className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-cream transition hover:-translate-y-0.5 hover:bg-coral">
                  API 키 상태 조회
                </a>
              </section>

              <section className="rounded-[32px] border border-[var(--border-subtle)] bg-cream/84 p-6 shadow-[0_24px_80px_rgba(31,30,29,.08)]">
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">Account</p>
                <h2 className="mt-3 text-3xl font-[680] tracking-[-0.035em]">계정 정보</h2>
                <div className="mt-5 grid gap-3 text-sm">
                  <AccountRow label="이메일" value={displayEmail} />
                  <AccountRow label="연동" value={provider} />
                  <AccountRow label="결제 안내" value="주문별 입력 이메일로 발급 안내가 전달됩니다." />
                </div>
              </section>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cream/10 bg-cream/[.065] px-4 py-3 shadow-[inset_0_1px_rgba(255,255,255,.08)]">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-cream/42">{label}</p>
      <p className="mt-1 break-all text-sm font-semibold text-cream/82">{value}</p>
    </div>
  );
}

function OrderMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-cream-2/70 px-4 py-3">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/70">{label}</p>
      <p className="mt-1 break-all font-semibold text-primary">{value}</p>
    </div>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-[var(--border-subtle)] bg-white/60 px-4 py-3">
      <span className="w-20 shrink-0 font-semibold text-secondary">{label}</span>
      <span className="min-w-0 break-all font-semibold text-primary">{value}</span>
    </div>
  );
}


function ReviewOrderAction({
  order,
  review
}: {
  order: OrderRecord;
  review?: Pick<ReviewRecord, "id" | "order_id" | "status" | "bonus_status" | "created_at">;
}) {
  if (order.status !== "issued") {
    return (
      <div className="mt-5 rounded-2xl border border-[var(--border-subtle)] bg-cream-2/60 px-4 py-3 text-sm font-semibold text-secondary">
        API 키 발급 완료 후 리뷰 작성 보너스가 열립니다.
      </div>
    );
  }

  if (review) {
    return (
      <div className="mt-5 grid gap-3 rounded-2xl border border-coral/20 bg-coral/10 px-4 py-3 text-sm sm:grid-cols-2">
        <OrderMeta label="리뷰" value={reviewStatusLabels[review.status]} />
        <OrderMeta label="보너스" value={bonusStatusLabels[review.bonus_status]} />
      </div>
    );
  }

  return (
    <a href={`/reviews/${order.id}`} className="mt-5 inline-flex min-h-12 items-center rounded-2xl bg-coral px-5 text-sm font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi">
      리뷰 작성하고 $30 받기
    </a>
  );
}
