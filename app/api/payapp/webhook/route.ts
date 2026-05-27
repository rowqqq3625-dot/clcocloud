import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";
import { verifyLinkval } from "@/lib/payapp";
import { sendBuyerPayDone, sendAdminPayDone, sendAdminLowStock } from "@/lib/bati";

export async function POST(req: NextRequest) {
  let orderNo = "N/A";
  let mulNo = "N/A";
  
  try {
    // 1. Extract request IP
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                     req.headers.get("x-real-ip") || 
                     "127.0.0.1";

    // 2. Parse URL-encoded form data (PayApp feedback is application/x-www-form-urlencoded)
    const text = await req.text();
    const params = new URLSearchParams(text);
    const body = Object.fromEntries(params.entries());

    console.log(`[PayApp Webhook] Received request from ${clientIp}:`, JSON.stringify(body, null, 2));

    const {
      pay_state,    // 4: Completed, 16: Cancel, 32: Refund, 64: Fail
      mul_no,       // PayApp transaction number
      linkval,      // Signature token
      var1,         // Custom var1 (orderNo)
      price,        // Price string
      recvphone,    // Buyer's actual phone number
      state_msg     // Failure message
    } = body;

    orderNo = var1 || "N/A";
    mulNo = mul_no || "N/A";

    if (!var1) {
      console.warn("[PayApp Webhook] Missing order number (var1)");
      return new NextResponse("MISSING_ORDER_NO", { status: 200 }); // Always 200 to prevent PayApp retries
    }

    if (!supabase) {
      console.error("[PayApp Webhook] Supabase admin client not initialized.");
      return new NextResponse("DB_ERROR", { status: 200 });
    }

    // 3. Fetch current order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .maybeSingle();

    if (orderError || !order) {
      console.warn(`[PayApp Webhook] Order not found for orderNo: ${orderNo}`);
      return new NextResponse("ORDER_NOT_FOUND", { status: 200 });
    }

    // 4. Check for test simulation mode bypass
    const isSimulationOrder = order.buyer_name === "김정후" && 
                              order.buyer_phone.startsWith("0105850") && 
                              mul_no?.startsWith("MOCK_SIM_");

    if (isSimulationOrder) {
      console.log(`[PayApp Webhook] [SIMULATION MODE] Bypassing IP and Signature checks for order: ${orderNo}`);
    } else {
      // A. IP Whitelist check
      const ipWhitelistStr = process.env.PAYAPP_IP_WHITELIST;
      if (ipWhitelistStr && ipWhitelistStr.trim().length > 0) {
        const whitelist = ipWhitelistStr.split(",").map((ip) => ip.trim());
        const ipv4 = clientIp.includes("::ffff:") ? clientIp.replace("::ffff:", "") : clientIp;
        
        if (!whitelist.includes(clientIp) && !whitelist.includes(ipv4) && !whitelist.includes("*")) {
          console.warn(`[PayApp Webhook] Forbidden IP address: ${clientIp}`);
          return new NextResponse("FORBIDDEN_IP", { status: 403 }); // Return 403 on invalid IP for security
        }
      }

      // B. Linkval signature check
      if (!linkval || !verifyLinkval(linkval)) {
        console.warn(`[PayApp Webhook] Unauthorized linkval signature: ${linkval}`);
        return new NextResponse("UNAUTHORIZED_SIGNATURE", { status: 401 }); // Return 401 on invalid signature
      }
    }

    // 5. Idempotency Check: if mul_no matches and status is already paid/paid_pending_key, skip processing
    if (mul_no && order.payapp_mul_no === mul_no && (order.status === "paid" || order.status === "paid_pending_key")) {
      console.log(`[PayApp Webhook Idempotency] Order ${orderNo} with transaction ${mul_no} already processed.`);
      return new NextResponse("SUCCESS", { status: 200 });
    }

    const transactionPrice = Number(price || 0);

    // 6. Handle pay_state branches
    if (pay_state === "4") {
      // Payment Completed (Success)
      if (order.amount !== transactionPrice) {
        console.warn(`[PayApp Webhook] Price mismatch for order ${orderNo}. DB: ${order.amount}, PG: ${transactionPrice}`);
        return new NextResponse("PRICE_MISMATCH", { status: 200 });
      }

      // 새 함수 issue_key_for_order 는 orders.status 가 paid 또는 paid_pending_key 일 것을
      // 요구한다. 따라서 호출 전에 pending → paid 로 선행 전이한다.
      // OUT_OF_STOCK 발생 시에는 아래 분기에서 paid_pending_key 로 덮어쓴다.
      await supabase
        .from("orders")
        .update({
          status: "paid",
          payapp_mul_no: mul_no,
          paid_at: new Date().toISOString(),
        })
        .eq("id", order.id)
        .eq("status", "pending");

      // Call Supabase RPC issue_key_for_order (자판기 모듈 메인 함수)
      let issueResult: any = null;
      let issueError: any = null;

      try {
        const rpcRes = await supabase.rpc("issue_key_for_order", { p_order_no: orderNo });
        issueResult = rpcRes.data;
        issueError = rpcRes.error;
      } catch (err) {
        issueError = err;
      }

      // OUT_OF_STOCK 은 함수가 RAISE EXCEPTION 으로 던진다.
      const isOutOfStock = Boolean(
        issueError?.message?.includes("OUT_OF_STOCK")
      );

      if (issueError && !isOutOfStock) {
        console.error(`[PayApp Webhook] issue_key_for_order RPC error:`, issueError);
      }

      // 새 함수는 {api_key, key_id, plan_code} 반환. 기존 product_name 호환을 위해 매핑.
      const PLAN_NAME: Record<string, string> = {
        STANDARD: "STANDARD 잔액형 키",
        PRO: "PRO 잔액형 키",
        ULTRA: "ULTRA 잔액형 키",
      };
      let issuedKey: { api_key: string; key_id: string; product_name: string } | null = null;
      if (!isOutOfStock && issueResult && issueResult.length > 0) {
        const row = issueResult[0];
        issuedKey = {
          api_key: row.api_key,
          key_id: row.key_id,
          product_name: PLAN_NAME[row.plan_code] || `${row.plan_code} 잔액형 키`,
        };
      }

      // Fallback for simulation mode if tables are not fully migrated/created yet
      // Also supports simulating stock empty for productCode "ULTRA" to test the paid_pending_key flow
      if (!issuedKey && isSimulationOrder) {
        if (order.product_code === "ULTRA") {
          console.log(`[PayApp Webhook Fallback] Simulation fallback: simulating out-of-stock for ULTRA.`);
          issuedKey = null;
        } else {
          console.log(`[PayApp Webhook Fallback] Simulation fallback triggered for order: ${orderNo}`);
          issuedKey = {
            api_key: "sk-ant-api03-simulatedkey12345",
            key_id: "00000000-0000-0000-0000-000000000000",
            product_name: order.product_code === "PRO" ? "PRO 잔액형 키" : order.product_code + " 잔액형 키"
          };
        }
      }

      if (!issuedKey) {
        // Out of stock
        console.warn(`[PayApp Webhook] Key inventory exhausted for order ${orderNo}`);

        // Update order status to paid_pending_key
        await supabase
          .from("orders")
          .update({
            status: "paid_pending_key",
            payapp_mul_no: mul_no,
            paid_at: new Date().toISOString()
          })
          .eq("id", order.id);

        // [Rule 3] Send low stock alert to Admin ONLY. Do not notify buyer.
        await sendAdminLowStock({
          orderNo: orderNo,
          buyerName: order.buyer_name,
          amount: order.amount,
          productName: order.product_code === "ULTRA" ? "ULTRA 잔액형 키" : order.product_code + " 잔액형 키",
          remainingCount: 0
        });

      } else {
        // Key issued successfully
        const apiKeyVal = issuedKey.api_key;
        const keyId = issuedKey.key_id;
        const productName = issuedKey.product_name;

        // Mask API Key for server logs (first 8 chars + ***)
        const maskedKey = apiKeyVal.slice(0, 8) + "***";
        console.log(`[PayApp Webhook] Key issued for order ${orderNo}: ${maskedKey}`);

        // Update order status to paid & record issued_key_id if possible
        const updatePayload: any = {
          status: "paid",
          payapp_mul_no: mul_no,
          paid_at: new Date().toISOString()
        };
        
        // Only include issued_key_id if it's a valid UUID (not our mock all-zero key)
        if (keyId && keyId !== "00000000-0000-0000-0000-000000000000") {
          updatePayload.issued_key_id = keyId;
        }

        await supabase
          .from("orders")
          .update(updatePayload)
          .eq("id", order.id);

        // [Rule 1] Buyer Alimtalk — fire-and-forget; Bati 실패가 결제 트랜잭션을 망가뜨리지 않도록 catch 분리
        const alimtalkPhone = recvphone || order.buyer_phone;
        void sendBuyerPayDone({
          buyerName: order.buyer_name,
          buyerPhone: alimtalkPhone,
          orderNo: orderNo,
          productName: productName,
          amount: order.amount,
          apiKey: apiKeyVal
        }).catch((e) => {
          console.error(`[PayApp Webhook] sendBuyerPayDone failed for ${orderNo}:`, e);
        });

        // [Rule 2] Admin Alimtalk — 동일하게 논블로킹 분리
        void sendAdminPayDone({
          orderNo: orderNo,
          buyerName: order.buyer_name,
          productName: productName,
          amount: order.amount
        }).catch((e) => {
          console.error(`[PayApp Webhook] sendAdminPayDone failed for ${orderNo}:`, e);
        });
      }

    } else if (pay_state === "16" || pay_state === "64") {
      // Payment Cancelled (16) or Failed (64)
      console.log(`[PayApp Webhook] Payment failed/cancelled for order ${orderNo}. State: ${pay_state}`);

      // Update order status to failed
      await supabase
        .from("orders")
        .update({
          status: "failed",
          payapp_mul_no: mul_no
        })
        .eq("id", order.id);

      // Release reserved inventory back to available
      try {
        await supabase.rpc("release_api_key", { p_order_id: order.id });
      } catch (e) {
        // Release function or table not updated
      }

      // [Rule 4] No Alimtalks are sent to buyer or operator. Log to database only.
      try {
        await supabase.from("notification_logs").insert({
          order_no: orderNo,
          type: "PAY_FAIL_LOGGED",
          ok: true,
          status_code: 200,
          response_body: state_msg || "고객 결제 취소 또는 잔액/한도 초과"
        });
      } catch (e) {
        // Log skip if table is not created
      }

    } else if (pay_state === "32") {
      // Refunded
      console.log(`[PayApp Webhook] Payment refunded for order ${orderNo}`);

      // Update order status to refunded
      await supabase
        .from("orders")
        .update({
          status: "refunded",
          payapp_mul_no: mul_no
        })
        .eq("id", order.id);
    }

    return new NextResponse("OK", { status: 200 });

  } catch (err: any) {
    console.error(`[PayApp Webhook Exception] orderNo=${orderNo}, mulNo=${mulNo}:`, err);
    // Return 200 anyway to prevent PayApp infinite retries, but log the error
    return new NextResponse("OK", { status: 200 });
  }
}
