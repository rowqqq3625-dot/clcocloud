import { supabaseAdmin as supabase } from "./supabase/server";

export interface BatiWebhookResponse {
  ok: boolean;
  status: number;
  body: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a POST request to Bati AI Webhook with 8s timeout and 1 retry (1.5s backoff)
 */
export async function sendBatiWebhook(url: string, payload: any): Promise<BatiWebhookResponse> {
  const timeoutMs = Number(process.env.BATI_TIMEOUT_MS) || 8000;
  
  let attempt = 0;
  let response: Response | null = null;
  let responseText = "";
  let errorMsg = "";
  
  while (attempt < 2) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      responseText = await response.text();
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          body: responseText.slice(0, 500),
        };
      } else {
        errorMsg = `API Error (Status: ${response.status}): ${responseText}`;
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      errorMsg = err.name === "AbortError" ? "Timeout" : err.message || "Network Error";
    }
    
    attempt++;
    if (attempt < 2) {
      console.warn(`[Bati Webhook Retry] Attempt ${attempt} failed for URL ${url}. Retrying in 1.5s... Error: ${errorMsg}`);
      await sleep(1500); // 1.5-second backoff
    }
  }
  
  return {
    ok: false,
    status: response ? response.status : 500,
    body: errorMsg.slice(0, 500),
  };
}

/**
 * Format helper: removes all non-numeric characters from phone numbers
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, "");
}

/**
 * Format helper: formats number to KRW format without currency symbol
 */
export function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR");
}

export interface BuyerPayDoneParams {
  buyerName: string;
  buyerPhone: string;
  orderNo: string;
  productName: string;
  amount: number;
  apiKey: string;
}

/**
 * Sends Bati AI Alimtalk for Buyer payment completion + key delivery (PAY_DONE_KEY_DELIVERY)
 */
export async function sendBuyerPayDone(params: BuyerPayDoneParams): Promise<BatiWebhookResponse> {
  const webhookUrl = process.env.BATI_WEBHOOK_PAY_DONE;
  const type = "PAY_DONE_KEY_DELIVERY";

  if (!webhookUrl) {
    console.error("[Bati] BATI_WEBHOOK_PAY_DONE env var is not set.");
    return { ok: false, status: 500, body: "BATI_WEBHOOK_PAY_DONE missing" };
  }

  // Idempotency: check if already sent successfully
  if (supabase) {
    const { data: existing } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("order_no", params.orderNo)
      .eq("type", type)
      .eq("ok", true)
      .maybeSingle();

    if (existing) {
      console.log(`[Bati Log Bypass] ${type} already sent for order ${params.orderNo}. Skipping.`);
      
      // Log duplicate_skipped
      await supabase.from("notification_logs").insert({
        order_no: params.orderNo,
        type: type,
        ok: true,
        status_code: 200,
        response_body: "duplicate_skipped"
      });

      return { ok: true, status: 200, body: "duplicate_skipped" };
    }
  }

  const payload = {
    buyer_name: params.buyerName,
    buyer_phone: cleanPhoneNumber(params.buyerPhone),
    order_no: params.orderNo,
    product_name: params.productName,
    amount: formatAmount(params.amount),
    api_key: params.apiKey,
  };

  // Mask API Key for console logs (first 8 chars + ***)
  const maskedKey = params.apiKey.slice(0, 8) + "***";
  console.log(`[Bati Webhook] Sending PAY_DONE_KEY_DELIVERY for ${params.orderNo} with key ${maskedKey}`);

  const response = await sendBatiWebhook(webhookUrl, payload);

  // Log in notification_logs table
  if (supabase) {
    await supabase.from("notification_logs").insert({
      order_no: params.orderNo,
      type: type,
      ok: response.ok,
      status_code: response.status,
      response_body: response.body,
    });
  }

  return response;
}

export interface AdminPayDoneParams {
  orderNo: string;
  buyerName: string;
  productName: string;
  amount: number;
}

/**
 * Sends Bati AI Alimtalk for Admin payment completion notification (ADMIN_PAY_DONE)
 */
export async function sendAdminPayDone(params: AdminPayDoneParams): Promise<BatiWebhookResponse> {
  const webhookUrl = process.env.BATI_WEBHOOK_ADMIN_PAID;
  const type = "ADMIN_PAY_DONE";

  if (!webhookUrl) {
    console.error("[Bati] BATI_WEBHOOK_ADMIN_PAID env var is not set.");
    return { ok: false, status: 500, body: "BATI_WEBHOOK_ADMIN_PAID missing" };
  }

  // Idempotency: check if already sent successfully
  if (supabase) {
    const { data: existing } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("order_no", params.orderNo)
      .eq("type", type)
      .eq("ok", true)
      .maybeSingle();

    if (existing) {
      console.log(`[Bati Log Bypass] ${type} already sent for order ${params.orderNo}. Skipping.`);
      
      // Log duplicate_skipped
      await supabase.from("notification_logs").insert({
        order_no: params.orderNo,
        type: type,
        ok: true,
        status_code: 200,
        response_body: "duplicate_skipped"
      });

      return { ok: true, status: 200, body: "duplicate_skipped" };
    }
  }

  const payload = {
    order_no: params.orderNo,
    buyer_name: params.buyerName,
    product_name: params.productName,
    amount: formatAmount(params.amount),
    // 운영자 워크플로 데이터 시트 컬럼5: 처리시각(Asia/Seoul, YYYY. MM. DD. HH:mm)
    timestamp: new Date().toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  };

  console.log(`[Bati Webhook] Sending ADMIN_PAY_DONE for ${params.orderNo}`);
  const response = await sendBatiWebhook(webhookUrl, payload);

  // Log in notification_logs table
  if (supabase) {
    await supabase.from("notification_logs").insert({
      order_no: params.orderNo,
      type: type,
      ok: response.ok,
      status_code: response.status,
      response_body: response.body,
    });
  }

  return response;
}

export interface AdminLowStockParams {
  orderNo: string;
  productName: string;
  remainingCount: number;
  buyerName: string;
  amount: number;
}

/**
 * Sends Bati AI Alimtalk for Admin stock inventory exhaustion warning (ADMIN_LOW_STOCK)
 */
export async function sendAdminLowStock(params: AdminLowStockParams): Promise<BatiWebhookResponse> {
  const webhookUrl = process.env.BATI_WEBHOOK_ADMIN_LOW_STOCK;
  const type = "ADMIN_LOW_STOCK";

  if (!webhookUrl) {
    console.error("[Bati] BATI_WEBHOOK_ADMIN_LOW_STOCK env var is not set.");
    return { ok: false, status: 500, body: "BATI_WEBHOOK_ADMIN_LOW_STOCK missing" };
  }

  // Idempotency: check if already sent successfully
  if (supabase) {
    const { data: existing } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("order_no", params.orderNo)
      .eq("type", type)
      .eq("ok", true)
      .maybeSingle();

    if (existing) {
      console.log(`[Bati Log Bypass] ${type} already sent for order ${params.orderNo}. Skipping.`);
      
      // Log duplicate_skipped
      await supabase.from("notification_logs").insert({
        order_no: params.orderNo,
        type: type,
        ok: true,
        status_code: 200,
        response_body: "duplicate_skipped"
      });

      return { ok: true, status: 200, body: "duplicate_skipped" };
    }
  }

  // 수신번호는 Bati 워크플로의 알림톡 액션 슬롯에 고정값(01058503625)으로 직접 지정됨.
  // 페이로드는 시트 컬럼 매핑용 5개 키만 전송.
  const payload = {
    order_no: params.orderNo,
    buyer_name: params.buyerName,
    product_name: params.productName,
    amount: formatAmount(params.amount),
    remaining: String(params.remainingCount),
  };

  console.log(`[Bati Webhook] Sending ADMIN_LOW_STOCK for ${params.orderNo}`);
  const response = await sendBatiWebhook(webhookUrl, payload);

  // Log in notification_logs table
  if (supabase) {
    await supabase.from("notification_logs").insert({
      order_no: params.orderNo,
      type: type,
      ok: response.ok,
      status_code: response.status,
      response_body: response.body,
    });
  }

  return response;
}
