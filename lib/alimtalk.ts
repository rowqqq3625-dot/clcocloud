import { supabaseAdmin as supabase } from "./supabase/server";

export interface SendAlimtalkParams {
  templateCode: string;
  phone: string;
  variables: Record<string, string>;
  orderId?: string;
  inquiryId?: string;
  recipient: "buyer" | "operator";
}

/**
 * sleep helper for exponential backoff
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 바티AI 카카오 알림톡 발송 모듈
 */
export async function sendAlimtalk(params: SendAlimtalkParams): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const { templateCode, phone, variables, orderId, inquiryId, recipient } = params;

  const apiKey = process.env.BARTI_API_KEY;
  const senderKey = process.env.BARTI_SENDER_KEY;

  const isDev = process.env.NODE_ENV === "development" || !apiKey || !senderKey;

  // 1. 개발/테스트 모드에서의 모킹 처리
  if (isDev) {
    console.log(`[Alimtalk Mock] Sending talk template [${templateCode}] to [${recipient} : ${phone}]`);
    console.log("[Alimtalk Mock] Variables:", JSON.stringify(variables, null, 2));
    
    // 로그 적재 시도
    await logAlimtalkResult({
      orderId,
      inquiryId,
      templateCode,
      recipient,
      phone,
      payload: variables,
      result: "success",
      messageId: "mock-message-id-" + Math.random().toString(36).substring(2, 9),
    });

    return { success: true, messageId: "mock-message-id" };
  }

  // 2. 실서버 전송 (최대 3회 재시도, 지수 백오프 1s, 3s, 9s)
  const retries = [1000, 3000, 9000];
  let attempt = 0;
  let lastError = "";
  let messageId = "";
  let success = false;

  const bodyData = {
    senderKey,
    templateCode,
    recipient: phone.replace(/-/g, ""), // 하이픈 제거
    variables,
  };

  while (attempt <= retries.length) {
    try {
      // 바티 AI 알림톡 전송 엔드포인트 호출
      const response = await fetch("https://api.bati.ai/v1/send/alimtalk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Barti-Api-Key": apiKey!,
          "Authorization": `Bearer ${apiKey}`, // Bearer 형식도 호환용으로 같이 보냄
        },
        body: JSON.stringify(bodyData),
      });

      const responseData = await response.json().catch(() => ({}));

      if (response.ok && (responseData.success || responseData.messageId || responseData.code === "success")) {
        success = true;
        messageId = responseData.messageId || responseData.id || "success-id";
        break;
      } else {
        lastError = responseData.message || responseData.errorMessage || `API 응답 오류 (Status: ${response.status})`;
      }
    } catch (err: any) {
      lastError = err.message || "네트워크 에러";
    }

    if (attempt < retries.length) {
      console.warn(`[Alimtalk Retry] Attempt ${attempt + 1} failed for ${phone}. Retrying in ${retries[attempt]}ms... Error: ${lastError}`);
      await sleep(retries[attempt]);
    }
    attempt++;
  }

  // 3. 발송 로그 적재
  await logAlimtalkResult({
    orderId,
    inquiryId,
    templateCode,
    recipient,
    phone,
    payload: variables,
    result: success ? "success" : "failed",
    messageId: success ? messageId : undefined,
    error: success ? undefined : lastError,
  });

  if (!success) {
    const errorMsg = `알림톡 발송 실패 [${templateCode}] -> ${phone}: ${lastError}`;
    
    // 운영자 발송 실패 시 콘솔 + Vercel 로그 강제 출력
    if (recipient === "operator") {
      console.error(`🚨 [OPERATOR ALIMTALK FAILURE] ${errorMsg}`);
    } else {
      console.warn(errorMsg);
    }
    return { success: false, error: lastError };
  }

  return { success: true, messageId };
}

/**
 * DB 로그 적재 헬퍼
 */
async function logAlimtalkResult(data: {
  orderId?: string;
  inquiryId?: string;
  templateCode: string;
  recipient: string;
  phone: string;
  payload: Record<string, string>;
  result: "success" | "failed";
  messageId?: string;
  error?: string;
}) {
  try {
    if (!supabase) {
      console.warn("[Alimtalk Log] Supabase admin client not initialized. Cannot save log.");
      return;
    }

    const { error } = await supabase.from("alimtalk_logs").insert({
      order_id: data.orderId || null,
      inquiry_id: data.inquiryId || null,
      template_code: data.templateCode,
      recipient: data.recipient,
      phone: data.phone,
      payload: data.payload,
      result: data.result,
      barti_message_id: data.messageId || null,
      sent_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[Alimtalk Log] Failed to insert log to Supabase:", error.message);
    }
  } catch (err: any) {
    console.error("[Alimtalk Log] Error during log insert:", err.message);
  }
}
