import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";
import { createPayRequest, generateOrderNo } from "@/lib/payapp";
import { AUTH_SESSION_COOKIE, parseSessionToken } from "@/lib/auth-session";
import { cleanPhoneNumber } from "@/lib/bati";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productCode,
      buyerName,
      buyerPhone,
      agreedAt,
      agreedTerms, // Check both for compatibility
      osTargets,
      contactEmail
    } = body;

    // 1. Input Validation
    if (!productCode || typeof productCode !== "string") {
      return NextResponse.json({ error: "상품 코드를 지정해주세요." }, { status: 400 });
    }

    if (!buyerName || typeof buyerName !== "string" || buyerName.trim().length === 0) {
      return NextResponse.json({ error: "구매자 이름을 입력해주세요." }, { status: 400 });
    }

    const phoneClean = cleanPhoneNumber(buyerPhone || "");
    const phoneRegex = /^010\d{8}$/;
    if (!phoneClean || !phoneRegex.test(phoneClean)) {
      return NextResponse.json({ error: "올바른 010 휴대폰 번호를 입력해주세요." }, { status: 400 });
    }

    if (!agreedAt && !agreedTerms) {
      return NextResponse.json({ error: "이용약관 및 정책 동의가 필요합니다." }, { status: 400 });
    }

    // Determine price and product name
    let priceKrw = 0;
    let goodName = "";

    if (productCode === "STANDARD") {
      priceKrw = 98000;
      goodName = "클코클라우드 API 키 스탠다드 플랜 ($200)";
    } else if (productCode === "PRO") {
      priceKrw = 196000;
      goodName = "클코클라우드 API 키 프로 플랜 ($500)";
    } else if (productCode === "ULTRA") {
      priceKrw = 264000;
      goodName = "클코클라우드 API 키 울트라 플랜 ($1,000)";
    } else {
      // Allow general products / bundles if they are in db
      if (supabase) {
        const { data: bundleProduct } = await supabase
          .from("bundle_products")
          .select("*")
          .eq("product_code", productCode)
          .eq("is_active", true)
          .maybeSingle();

        if (bundleProduct && bundleProduct.price_krw) {
          priceKrw = bundleProduct.price_krw;
          goodName = bundleProduct.display_name;
        } else {
          return NextResponse.json({ error: "존재하지 않는 상품 코드입니다." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "존재하지 않는 상품 코드입니다." }, { status: 400 });
      }
    }

    if (!supabase) {
      return NextResponse.json({ error: "데이터베이스 연결에 실패했습니다." }, { status: 500 });
    }

    // Mask phone number for DB storage (replace last 4 digits with ****)
    const maskedPhone = phoneClean.slice(0, phoneClean.length - 4) + "****";

    // Extract user session if available
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
    const session = parseSessionToken(sessionToken);

    // 2. Generate order number
    const orderNo = await generateOrderNo();

    // 3. Insert order into DB (status: 'pending')
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        product_code: productCode,
        amount: priceKrw,
        buyer_name: buyerName.trim(),
        buyer_phone: maskedPhone,
        status: "pending",
        product_kind: "balance", // Default compat
        user_provider: session?.provider || null,
        user_provider_account_id: session?.providerAccountId || null,
        user_email: session?.email || null,
        contact_email: contactEmail || session?.email || null,
        os_targets: osTargets || null
      })
      .select()
      .single();

    if (insertError || !order) {
      console.error(`[Create Order] DB insertion failed: ${insertError?.message}`);
      return NextResponse.json({ error: "주문 정보 등록에 실패했습니다." }, { status: 500 });
    }

    // 4. Pre-reserve API key if this is a stock product (STANDARD, PRO, ULTRA)
    let reservedKeyId: string | null = null;
    const isInventoryProduct = ["STANDARD", "PRO", "ULTRA"].includes(productCode);
    if (isInventoryProduct) {
      const { data: keyId, error: rpcError } = await supabase.rpc("reserve_api_key_v2", {
        p_product_code: productCode,
        p_order_id: order.id
      });

      if (rpcError) {
        console.error(`[Reserve Key] RPC reserve_api_key_v2 failed: ${rpcError.message}`);
      }

      if (!keyId) {
        // Stock empty alert (but don't block order process, PG payment will proceed)
        console.warn(`[Reserve Key] Inventory empty for code: ${productCode}`);
      } else {
        reservedKeyId = keyId;
      }
    }

    // 5. PayApp payment request or simulation redirection
    const payAppRes = await createPayRequest({
      productKind: "balance",
      productCode,
      orderNo,
      goodName,
      price: priceKrw,
      buyerPhone: phoneClean, // Send original clean phone number to PG
      buyerName: buyerName.trim(),
      openPayType: "card"
    });

    if (!payAppRes.success) {
      console.error(`[PayApp Create] creation failed: ${payAppRes.errorMsg}`);

      // Rollback reservation if PG fails
      if (reservedKeyId) {
        await supabase.rpc("release_api_key", { p_order_id: order.id });
      }

      // Mark order as failed
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);

      return NextResponse.json({
        error: payAppRes.errorMsg || "결제 요청 생성 중 오류가 발생했습니다."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderNo: orderNo,
      payurl: payAppRes.payUrl
    });

  } catch (err: any) {
    console.error("[Create Payment API] Unexpected error:", err);
    return NextResponse.json({ error: "서버 처리 오류가 발생했습니다." }, { status: 500 });
  }
}
