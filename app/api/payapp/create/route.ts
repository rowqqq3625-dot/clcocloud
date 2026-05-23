import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";
import { createPayAppPayment } from "@/lib/payapp";
import { sendAlimtalk } from "@/lib/alimtalk";
import { generateOrderNo } from "@/lib/orderNumber";
import { AUTH_SESSION_COOKIE, parseSessionToken } from "@/lib/auth-session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      productKind,
      productCode,
      buyerName,
      buyerPhone,
      agreedTerms,
      osTargets,
      contactEmail,
      paymentMethod
    } = body;

    // 1. 입력 검증
    if (!buyerName || typeof buyerName !== "string" || buyerName.trim().length === 0) {
      return NextResponse.json({ error: "구매자 이름을 입력해주세요." }, { status: 400 });
    }

    const phoneClean = buyerPhone ? buyerPhone.replace(/[^0-9]/g, "") : "";
    const phoneRegex = /^(010|011|016|017|018|019)[0-9]{7,8}$/;
    if (!phoneClean || !phoneRegex.test(phoneClean)) {
      return NextResponse.json({ error: "올바른 휴대폰 번호를 입력해주세요." }, { status: 400 });
    }

    if (!agreedTerms) {
      return NextResponse.json({ error: "이용약관 및 정책 동의가 필요합니다." }, { status: 400 });
    }

    if (productKind !== "balance" && productKind !== "bundle") {
      return NextResponse.json({ error: "올바르지 않은 상품 종류입니다." }, { status: 400 });
    }

    // 쿠키를 통한 로그인 세션 정보 획득
    const cookieStore = cookies();
    const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
    const session = parseSessionToken(sessionToken);

    if (!supabase) {
      return NextResponse.json({ error: "데이터베이스 연결에 실패했습니다. (Admin Client 누락)" }, { status: 500 });
    }

    // 2. 상품 정보 판별 및 단가 매핑
    let priceKrw = 0;
    let goodName = "";

    if (productKind === "balance") {
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
        return NextResponse.json({ error: "존재하지 않는 상품 코드입니다." }, { status: 400 });
      }
    } else {
      // bundle 상품 데이터베이스 조회
      const { data: bundleProduct, error: queryError } = await supabase
        .from("bundle_products")
        .select("*")
        .eq("product_code", productCode)
        .eq("is_active", true)
        .single();

      if (queryError || !bundleProduct) {
        return NextResponse.json({ error: "판매 중인 패키지 상품을 찾을 수 없습니다." }, { status: 400 });
      }

      if (bundleProduct.price_krw === null || bundleProduct.price_krw === undefined) {
        return NextResponse.json({ error: "현재 준비 중인 패키지 상품입니다." }, { status: 400 });
      }

      priceKrw = bundleProduct.price_krw;
      goodName = bundleProduct.display_name;
    }

    // 3. 주문번호 생성
    const orderNo = await generateOrderNo();

    // 4. 주문 레코드 생성 (pending 상태)
    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert({
        order_no: orderNo,
        product_kind: productKind,
        product_code: productCode,
        amount: priceKrw,
        buyer_name: buyerName.trim(),
        buyer_phone: phoneClean,
        status: "pending",
        user_provider: session?.provider || null,
        user_provider_account_id: session?.providerAccountId || null,
        user_email: session?.email || null,
        contact_email: contactEmail || session?.email || null,
        os_targets: osTargets || null
      })
      .select()
      .single();

    if (insertError || !order) {
      console.error("[Create Order] DB insert error:", insertError?.message);
      return NextResponse.json({ error: "주문 정보 생성에 실패했습니다." }, { status: 500 });
    }

    // 5. 잔액형 API 키인 경우 키 선점 예약 처리
    let reservedKeyId: string | null = null;
    if (productKind === "balance") {
      // reserve_api_key_v2 RPC 함수 호출
      const { data: keyId, error: rpcError } = await supabase.rpc("reserve_api_key_v2", {
        p_product_code: productCode,
        p_order_id: order.id
      });

      if (rpcError) {
        console.error("[Reserve Key] RPC error:", rpcError.message);
      }

      if (!keyId) {
        // 재고 부족 상태 (결제를 차단하지 않고 그대로 pending으로 계속 진행하되 운영자 알림톡 전송)
        const nowStr = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
        await sendAlimtalk({
          templateCode: process.env.BARTI_TEMPLATE_ADMIN_STOCK_LOW || "ADMIN_STOCK_LOW",
          phone: "01058503625", // 운영자 연락처 직접 명시
          variables: {
            상품명: productCode,
            현재재고: "0",
            주문번호: orderNo,
            구매자명: buyerName.trim(),
            발생시각: nowStr
          },
          orderId: order.id,
          recipient: "operator"
        });
      } else {
        reservedKeyId = keyId;
      }
    }

    // 6. PayApp 결제창 링크 생성 요청
    const payAppRes = await createPayAppPayment({
      productKind,
      productCode,
      orderNo,
      goodName,
      price: priceKrw,
      buyerPhone: phoneClean,
      buyerName: buyerName.trim(),
      openPayType: paymentMethod
    });

    if (!payAppRes.success) {
      console.error("[PayApp Create] Request failed:", payAppRes.errorMsg);
      
      // 결제창 생성 실패 시 예약된 키 원복
      if (productKind === "balance" && reservedKeyId) {
        await supabase.rpc("release_api_key", { p_order_id: order.id });
      }

      // 주문 상태 failed 전환
      await supabase
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);

      return NextResponse.json({
        error: payAppRes.errorMsg || "결제 연동 처리 중 오류가 발생했습니다."
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      payUrl: payAppRes.payUrl,
      orderNo: orderNo
    });

  } catch (err: any) {
    console.error("[Create API] Unexpected error:", err);
    return NextResponse.json({ error: "서버 내부 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
