import { formatKstDateTime } from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type InventoryRow = {
  id: string;
  product_code: string | null;
  fp16: string | null;
  last4: string | null;
  status: string;
  initial_balance: number | string | null;
  reserved_at: string | null;
  issued_at: string | null;
  issued_order_no: string | null;
  created_at: string;
};

type Stats = Record<string, { available: number; reserved: number; issued: number; revoked: number }>;

const STATUS_TONE: Record<string, string> = {
  available: "bg-emerald-500/15 text-emerald-300",
  reserved: "bg-amber-500/15 text-amber-300",
  issued: "bg-[#D97757]/15 text-[#F0E2D2]",
  revoked: "bg-cream/10 text-cream/60",
};

function StatusBadge({ status }: { status: string }) {
  const tone = STATUS_TONE[status] || "bg-cream/10 text-cream/70";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${tone}`}>
      {status}
    </span>
  );
}

/**
 * Renders a masked key fingerprint. The raw key is NEVER fetched or shown —
 * we display only the persistent fingerprint prefix + last 4 characters,
 * matching the `sk-***...ABCD` convention used elsewhere.
 */
function MaskedFingerprint({ fp16, last4 }: { fp16: string | null; last4: string | null }) {
  const prefix = fp16 ? fp16.slice(0, 4) : "????";
  const tail = last4 || "????";
  return <span className="font-mono text-[11px]">sk-{prefix}***...{tail}</span>;
}

async function loadInventory() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  // Note: raw_key_encrypted is intentionally excluded from this select.
  const { data, error } = await supabase
    .from("api_key_inventory")
    .select("id,product_code,fp16,last4,status,initial_balance,reserved_at,issued_at,issued_order_no,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return { items: [] as InventoryRow[], stats: {} as Stats };

  const items = (data || []) as InventoryRow[];
  const stats: Stats = {};
  const seedPlans = ["STANDARD", "PRO", "ULTRA"];
  seedPlans.forEach((plan) => {
    stats[plan] = { available: 0, reserved: 0, issued: 0, revoked: 0 };
  });
  for (const item of items) {
    const code = item.product_code || "UNKNOWN";
    if (!stats[code]) stats[code] = { available: 0, reserved: 0, issued: 0, revoked: 0 };
    if (item.status === "available") stats[code].available++;
    else if (item.status === "reserved") stats[code].reserved++;
    else if (item.status === "issued") stats[code].issued++;
    else if (item.status === "revoked") stats[code].revoked++;
  }
  return { items, stats };
}

export default async function AdminApiKeysPage() {
  const result = await loadInventory();

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">API KEYS</p>
        <h1 className="mt-1 text-xl font-bold">API 키 인벤토리 (조회 전용)</h1>
        <p className="mt-1 text-[10px] text-cream/40">
          * 키 원문은 어떤 경우에도 표시되지 않습니다. 화면에는 fingerprint 일부와 last4만 노출됩니다.
          <br />
          * 운영 정책상 콘솔에서는 키 등록·재발급·삭제·잔액조정 등 키 제어 액션을 제공하지 않습니다. 키 관리는 별도 운영 절차로만 수행됩니다.
        </p>
      </header>

      {!result ? (
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(result.stats).map(([code, s]) => (
              <div key={code} className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">{code}</p>
                <div className="mt-3 grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-emerald-300">{s.available}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cream/40">avail</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-300">{s.reserved}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cream/40">resv</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-[#F0E2D2]">{s.issued}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cream/40">iss</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-cream/50">{s.revoked}</p>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-cream/40">rvk</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="mb-2 text-sm font-bold text-cream/80">최근 등록된 키 (200개)</h2>
            <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
              <table className="w-full table-fixed text-left text-xs">
                <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
                  <tr>
                    <th className="w-[20%] px-3 py-2 font-mono">키</th>
                    <th className="w-[12%] px-3 py-2 font-mono">상품</th>
                    <th className="w-[10%] px-3 py-2 font-mono">상태</th>
                    <th className="w-[14%] px-3 py-2 font-mono text-right">초기잔액</th>
                    <th className="w-[14%] px-3 py-2 font-mono">예약</th>
                    <th className="w-[14%] px-3 py-2 font-mono">발급</th>
                    <th className="w-[16%] px-3 py-2 font-mono">주문번호</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream/5 text-cream/85">
                  {result.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-10 text-center text-cream/40">
                        등록된 키가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    result.items.map((row) => (
                      <tr key={row.id}>
                        <td className="px-3 py-2">
                          <MaskedFingerprint fp16={row.fp16} last4={row.last4} />
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px]">{row.product_code || "—"}</td>
                        <td className="px-3 py-2"><StatusBadge status={row.status} /></td>
                        <td className="px-3 py-2 font-mono tabular-nums text-right">
                          {row.initial_balance ? `$${row.initial_balance}` : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                          {formatKstDateTime(row.reserved_at)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                          {formatKstDateTime(row.issued_at)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70 truncate">
                          {row.issued_order_no || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
