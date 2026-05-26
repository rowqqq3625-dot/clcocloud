import { BundleProductsManager, type BundleProduct } from "@/components/admin/BundleProductsManager";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadBundles(): Promise<BundleProduct[] | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("bundle_products")
    .select(
      "id,product_code,display_name,ai_partner,description,period_months,included_balance,price_krw,original_price_krw,is_featured,is_active,sort_order"
    )
    .order("sort_order", { ascending: true });
  return (data || []) as BundleProduct[];
}

export default async function AdminBundlesPage() {
  const products = await loadBundles();

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">BUNDLES</p>
        <h1 className="mt-1 text-xl font-bold">번들 상품 관리</h1>
      </header>

      {products === null ? (
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      ) : (
        <BundleProductsManager initial={products} />
      )}
    </div>
  );
}
