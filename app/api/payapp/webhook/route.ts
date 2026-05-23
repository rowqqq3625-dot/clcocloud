import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";
import { verifyPayAppWebhook } from "@/lib/payapp";
import { sendAlimtalk } from "@/lib/alimtalk";
import { decryptKey } from "@/lib/keyEncryption";
import { saveDashboardKeyRecord } from "@/lib/dashboard-key-records";

export async function POST(req: NextRequest) {
  try {
    // 1. 요청 IP 추출
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "127.0.0.1";

    // 2. URLSearchParams 파싱 (페이앱은 application/x-www-form-urlencoded 로 피드백 전송)
    const text = await req.text();
    const params = new URLSearchParams(text);
    const body = Object.fromEntries(params.entries());

    console.log(`[PayApp Webhook] Received from ${clientIp}:`, JSON.stringify(body, null, 2));

    // 3. 웹훅 무결성 검증 (IP 화이트리스트 및 userid/linkval 매칭)
    const verification = verifyPayAppWebhook(body, clientIp);
    if (!verification.isValid) {
      console.warn("[PayApp Webhook] Verification failed:", verification.reason);
      return new NextResponse("UNAUTHORIZED", { status: 401 });
    }

    const {
      pay_state, // 4: 결제완료, 64: 취소/실패, 등
      mul_no,    // 페이앱 고유 거래번호
      pay_type,  // 결제 수단
      var1: orderNo,
      price: priceStr
    } = body;

    if (!orderNo) {
      console.warn("[PayApp Webhook] Missing order number (var1)");
      return new NextResponse("MISSING_ORDER_NO", { status: 400 });
    }

    if (!supabase) {
      console.error("[PayApp Webhook] Supabase admin client not initialized.");
      return new NextResponse("DB_ERROR", { status: 500 });
    }

    // 4. 기존 주문 조회
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single();

    if (orderError || !order) {
      console.warn(`[PayApp Webhook] Order not found: ${orderNo}`);
      return new NextResponse("ORDER_NOT_FOUND", { status: 400 });
    }

    // 멱등성 처리: 이미 처리된 결제(성공/키대기/실패)이거나 동일 mul_no가 등록되어 있다면 SUCCESS 응답
    if (
      order.status === "paid" || 
      order.status === "paid_pending_key" || 
      order.status === "failed" ||
      (order.payapp_mul_no && order.payapp_mul_no === mul_no)
    ) {
      console.log(`[PayApp Webhook] Order ${orderNo} is already processed with status: ${order.status}`);
      return new NextResponse("SUCCESS", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    }

    const price = Number(priceStr);

    // 결제수단 코드 한글명 변환
    let payMethodStr = "기타결제";
    const payTypeNum = Number(pay_type);
    switch (payTypeNum) {
      case 1: payMethodStr = "신용카드"; break;
      case 2: payMethodStr = "휴대전화"; break;
      case 4: payMethodStr = "대면결제"; break;
      case 6: payMethodStr = "계좌이체"; break;
      case 7: payMethodStr = "가상계좌"; break;
      case 15: payMethodStr = "카카오페이"; break;
      case 16: payMethodStr = "네이버페이"; break;
      case 17: payMethodStr = "등록결제"; break;
      case 21: payMethodStr = "스마일페이"; break;
      case 22: payMethodStr = "위챗페이"; break;
      case 23: payMethodStr = "애플페이"; break;
      case 24: payMethodStr = "내통장결제"; break;
      case 25: payMethodStr = "토스페이"; break;
      case 26: payMethodStr = "나나결제"; break;
      default: payMethodStr = pay_type || "기타결제";
    }

    // 5. 상태 분기 처리
    if (pay_state === "4") {
      // 결제 완료 (성공)
      // 금액 검증
      if (order.amount !== price) {
        console.warn(`[PayApp Webhook] Price mismatch for ${orderNo}. DB: ${order.amount}, Recv: ${price}`);
        return new NextResponse("PRICE_MISMATCH", { status: 400 });
      }

      // 5-1. 주문 결제 처리 업데이트 (성공 시 일단 paid로 표시하되 키 없으면 아래서 paid_pending_key로 재업데이트)
      const nowStr = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "paid",
          payapp_mul_no: mul_no,
          pay_method: payMethodStr,
          paid_at: nowStr
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(`[PayApp Webhook] Order status update failed: ${updateError.message}`);
        return new NextResponse("UPDATE_FAILED", { status: 500 });
      }

      // 5-2. 상품별 추가 비즈니스 로직
      if (order.product_kind === "balance") {
        // 잔액형 API 키인 경우 예약했던 키 발급 확정
        const { data: issuedResult, error: issueError } = await supabase.rpc("issue_api_key", {
          p_order_id: order.id
        });

        if (issueError) {
          console.error(`[PayApp Webhook] issue_api_key RPC failed: ${issueError.message}`);
        }

        const issuedKey = (issuedResult && issuedResult.length > 0) ? issuedResult[0] : null;

        if (!issuedKey) {
          // 키 예약을 해두었으나 모종의 이유로 발급되지 못한 상태이거나 최초 재고 부족 결제 상황
          console.error(`[PayApp Webhook] Key reservation lost or not issued for order ${orderNo}`);
          
          // 주문 상태를 paid_pending_key 로 전환하여 수동 대기 처리
          await supabase
            .from("orders")
            .update({ status: "paid_pending_key" })
            .eq("id", order.id);

          // 운영자에게 즉시 재고 부족 알림톡 발송
          const sysNow = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
          await sendAlimtalk({
            templateCode: process.env.BARTI_TEMPLATE_ADMIN_STOCK_LOW || "ADMIN_STOCK_LOW",
            phone: "01058503625", // 운영자 연락처 지정
            variables: {
              상품명: order.product_code,
              현재재고: "0",
              주문번호: orderNo,
              구매자명: order.buyer_name,
              발생시각: sysNow
            },
            orderId: order.id,
            recipient: "operator"
          });

          // 구매자에게 일단 결제 완료 안내 알림톡 전송 (키는 지연 발급됨을 고지)
          await sendAlimtalk({
            templateCode: process.env.BARTI_TEMPLATE_PAY_DONE || "PAY_DONE",
            phone: order.buyer_phone,
            variables: {
              주문번호: orderNo,
              상품명: order.product_code,
              결제금액: String(order.amount)
            },
            orderId: order.id,
            recipient: "buyer"
          });

        } else {
          // 정상적으로 키 발급 완료
          // 암호화된 raw key 조회
          const { data: keyInventory, error: inventoryError } = await supabase
            .from("api_key_inventory")
            .select("raw_key_encrypted")
            .eq("id", issuedKey.inventory_id)
            .single();

          if (inventoryError || !keyInventory) {
            console.error(`[PayApp Webhook] Failed to fetch encrypted raw key: ${inventoryError?.message}`);
            return new NextResponse("DECRYPT_ERROR", { status: 500 });
          }

          // 키 복호화
          let plainKey = "";
          try {
            plainKey = decryptKey(keyInventory.raw_key_encrypted);
          } catch (decryptErr: any) {
            console.error("[PayApp Webhook] Decryption failure:", decryptErr.message);
            return new NextResponse("DECRYPT_FAILED", { status: 500 });
          }

          // 로그인 세션 바인딩을 위한 가상 세션 생성 및 저장 (마이페이지 역호환성)
          if (order.user_provider && order.user_provider_account_id) {
            const fakeSession = {
              provider: order.user_provider,
              providerAccountId: order.user_provider_account_id,
            } as any;
            
            // 대시보드 데이터 자동 저장
            await saveDashboardKeyRecord(fakeSession, plainKey, {
              valid: true,
              prefix: plainKey.slice(0, 8),
              status: "active",
              allowedModels: [],
              balanceUsd: Number(issuedKey.initial_balance),
              monthlySpendCapUsd: null,
              rateLimitRpm: 0
            });
          }

          // 1) 구매자 알림톡: 결제 완료
          await sendAlimtalk({
            templateCode: process.env.BARTI_TEMPLATE_PAY_DONE || "PAY_DONE",
            phone: order.buyer_phone,
            variables: {
              주문번호: orderNo,
              상품명: order.product_code,
              결제금액: String(order.amount)
            },
            orderId: order.id,
            recipient: "buyer"
          });

          // 2) 구매자 알림톡: API 키 발급 알림
          await sendAlimtalk({
            templateCode: process.env.BARTI_TEMPLATE_KEY_ISSUED || "KEY_ISSUED",
            phone: order.buyer_phone,
            variables: {
              주문번호: orderNo,
              API키: plainKey,
              잔액: String(issuedKey.initial_balance)
            },
            orderId: order.id,
            recipient: "buyer"
          });

          // 3) 운영자 알림톡: 신규 주문 접수
          const sysNow = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
          await sendAlimtalk({
            templateCode: process.env.BARTI_TEMPLATE_ADMIN_NEW_ORDER || "ADMIN_NEW_ORDER",
            phone: "01058503625", // 운영자 연락처 지정
            variables: {
              주문번호: orderNo,
              상품명: order.product_code,
              결제금액: String(order.amount),
              구매자명: order.buyer_name,
              구매자연락처: order.buyer_phone,
              결제수단: payMethodStr,
              접수시각: sysNow
            },
            orderId: order.id,
            recipient: "operator"
          });
        }

      } else if (order.product_kind === "bundle") {
        // 번들 패키지 상품 처리
        // 1) 구매자 알림톡: 결제 완료
        await sendAlimtalk({
          templateCode: process.env.BARTI_TEMPLATE_PAY_DONE || "PAY_DONE",
          phone: order.buyer_phone,
          variables: {
            주문번호: orderNo,
            상품명: order.product_code,
            결제금액: String(order.amount)
          },
          orderId: order.id,
          recipient: "buyer"
        });

        // 2) 운영자 알림톡: AI플랜 패키지 주문 접수 (수동 작업용)
        await sendAlimtalk({
          templateCode: process.env.BARTI_TEMPLATE_ADMIN_BUNDLE_ORDER || "ADMIN_BUNDLE_ORDER",
          phone: "01058503625", // 운영자 연락처 지정
          variables: {
            주문번호: orderNo,
            패키지명: order.product_code,
            결제금액: String(order.amount),
            구매자명: order.buyer_name,
            구매자연락처: order.buyer_phone
          },
          orderId: order.id,
          recipient: "operator"
        });
      }

    } else if (pay_state === "64") {
      // 결제 취소 또는 실패
      await supabase
        .from("orders")
        .update({ status: "failed" }) // cancelled 대신 failed로 통일
        .eq("id", order.id);

      // 예약되어 있던 키 풀기
      if (order.product_kind === "balance") {
        await supabase.rpc("release_api_key", { p_order_id: order.id });
      }

      // 구매자 알림톡: 결제 실패
      await sendAlimtalk({
        templateCode: process.env.BARTI_TEMPLATE_PAY_FAIL || "PAY_FAIL",
        phone: order.buyer_phone,
        variables: {
          주문번호: orderNo,
          상품명: order.product_code,
          실패사유: body.state_msg || "고객 결제 취소 또는 잔액/한도 초과"
        },
        orderId: order.id,
        recipient: "buyer"
      });
    }

    // 페이앱 성공 응답 반환
    return new NextResponse("SUCCESS", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });

  } catch (err: any) {
    console.error("[PayApp Webhook API] Unexpected error:", err);
    return new NextResponse("INTERNAL_SERVER_ERROR", { status: 500 });
  }
}
