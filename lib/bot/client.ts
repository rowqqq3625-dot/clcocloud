import { filterResponse } from "./filter";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  image?: string; // base64 data URI or URL
}

/**
 * 관리자 수동관여 필수 케이스만 판별
 * AI가 직접 처리할 수 없는 DB/금융 조작이 필요한 경우에만 true
 */
export function requiresAdminIntervention(message: string): boolean {
  const normalized = message.toLowerCase().replace(/\s+/g, "");
  return (
    normalized.includes("상담원연결") ||
    normalized.includes("상담원바꿔") ||
    normalized.includes("관리자연결") ||
    normalized.includes("운영자연결") ||
    normalized.includes("입금누락") ||
    normalized.includes("송금누락") ||
    normalized.includes("입금확인안됨") ||
    normalized.includes("결제누락") ||
    (normalized.includes("환불") &&
      (normalized.includes("요청") ||
        normalized.includes("신청") ||
        normalized.includes("해줘") ||
        normalized.includes("바랍니다"))) ||
    normalized.includes("계정복구") ||
    normalized.includes("계정삭제") ||
    normalized.includes("수동확인")
  );
}

export async function callChatbotModel(
  messages: ChatMessage[],
  nonce: string
): Promise<{ content: string; tokensIn?: number; tokensOut?: number; isTemplate?: boolean }> {
  const model = "qwen3.5-flash";
  // 싱가포르 리전 — dashscope-intl (국제판) 엔드포인트 + OpenAI 호환 모드
  const apiKey = process.env.DASHSCOPE_API_KEY || "sk-73b5b3041acb4b62ab763181629c946b";
  const baseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
  const timeoutMs = Number(process.env.CLCOCLOUD_BOT_TIMEOUT_MS) || 30000;

  // 관리자 수동관여 여부 판별
  const lastUserMessage = messages.filter((m) => m.role === "user").pop();
  const lastUserText = lastUserMessage?.content || "";
  const needsTicket = requiresAdminIntervention(lastUserText);

  // 6개 템플릿 문의는 Qwen API 호출 없이 즉시 지식 기반 자동답변
  const normalized = lastUserText.toLowerCase().replace(/\s+/g, "").replace(/\?$/, "");
  const templates = [
    "가격이궁금해요",
    "결제방법",
    "api키발급은어떻게",
    "잔액확인/사용량",
    "환불정책",
    "사용법안내"
  ];
  
  if (templates.includes(normalized)) {
    console.log(`[BotClient] Matched static template query: "${lastUserText}". Bypassing API call.`);
    const { findBestResponse } = await import("./knowledgeBase");
    const fallback = findBestResponse(lastUserText, false);
    return {
      content: fallback.content,
      isTemplate: true,
      tokensIn: 0,
      tokensOut: 0
    };
  }

  // system 프롬프트 추출
  const systemMessage = messages.find((m) => m.role === "system");
  let systemContent = systemMessage?.content || "";
  if (needsTicket) {
    systemContent += "\n\n[현재 문의 특별 지시]\n이 고객의 요청은 관리자의 직접적인 수동 확인 및 조치가 필요한 사안으로 판단됩니다. 공감과 양해를 구하는 안내를 먼저 한 후, 반드시 답변 마지막 단독 라인에 [TICKET_FORM] 태그를 포함하여 티켓 접수 양식을 띄워주세요.";
  }

  // user/assistant 메시지만 필터링
  const filteredMessages = messages.filter((m) => m.role === "user" || m.role === "assistant");

  // 첫 메시지가 user여야 함
  let finalMessages = [...filteredMessages];
  while (finalMessages.length > 0 && finalMessages[0].role !== "user") {
    finalMessages.shift();
  }

  if (finalMessages.length === 0) {
    return {
      content: "안녕하세요! 클코클라우드 AI 상담봇입니다. 😊 무엇을 도와드릴까요?",
      isTemplate: true,
      tokensIn: 0,
      tokensOut: 0
    };
  }

  // OpenAI 호환 포맷으로 메시지 변환
  const formattedMessages: {
    role: "system" | "user" | "assistant";
    content: string | { type: string; text?: string; image_url?: { url: string } }[];
  }[] = [];

  // system 프롬프트 추가
  if (systemContent) {
    formattedMessages.push({ role: "system", content: systemContent });
  }

  // 대화 메시지 변환
  for (const m of finalMessages) {
    if (m.image) {
      // 멀티모달: 이미지 + 텍스트
      const contentArray: { type: string; text?: string; image_url?: { url: string } }[] = [
        { type: "image_url", image_url: { url: m.image } }
      ];
      if (m.content) {
        contentArray.push({ type: "text", text: m.content });
      } else {
        contentArray.push({ type: "text", text: "이 이미지를 자세히 분석해 주세요." });
      }
      formattedMessages.push({ role: m.role as "user" | "assistant", content: contentArray });
    } else {
      formattedMessages.push({ role: m.role as "user" | "assistant", content: m.content });
    }
  }

  const payload = {
    model,
    messages: formattedMessages,
    max_tokens: 1500,
    temperature: 0.7,
    top_p: 0.9,
    // thinking 모드 비활성화 (빠른 응답)
    enable_thinking: false
  };

  const makeRequest = async (): Promise<{ content: string; tokensIn?: number; tokensOut?: number; isTemplate?: boolean }> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      console.log(`[DashScope] → qwen3.5-flash (intl/Singapore) | messages: ${formattedMessages.length} | hasImage: ${finalMessages.some(m => m.image)}`);

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const data = await response.json() as {
        choices?: { message?: { content?: string; reasoning_content?: string; role?: string }; finish_reason?: string }[];
        usage?: { prompt_tokens?: number; completion_tokens?: number };
        error?: { message?: string; type?: string; code?: string };
      };

      if (!response.ok || data.error) {
        const errMsg = data.error?.message || `HTTP ${response.status}`;
        const errCode = data.error?.type || data.error?.code || "";
        console.error(`[DashScope] API error: ${errCode} — ${errMsg}`);
        throw new Error(`DashScope API error: ${errCode} - ${errMsg}`);
      }

      const rawText = data.choices?.[0]?.message?.content || "";

      if (!rawText) {
        console.warn("[DashScope] Empty response. Full data:", JSON.stringify(data));
        throw new Error("Empty response from model");
      }

      // thinking 태그 제거 (혹시 포함될 경우 대비)
      const cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      console.log(`[DashScope] ✓ in:${data.usage?.prompt_tokens} out:${data.usage?.completion_tokens}`);

      return {
        content: filterResponse(cleanText),
        isTemplate: false,
        tokensIn: data.usage?.prompt_tokens,
        tokensOut: data.usage?.completion_tokens
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // 1차 시도
  try {
    return await makeRequest();
  } catch (error: any) {
    console.warn("[DashScope] 1st attempt failed:", error?.message);
    // 1초 대기 후 재시도
    await new Promise((r) => setTimeout(r, 1000));
    try {
      return await makeRequest();
    } catch (retryError: any) {
      console.error("[DashScope] All attempts failed:", retryError?.message);
      // API 완전 실패 시 — 지식 기반 폴백
      const { findBestResponse } = await import("./knowledgeBase");
      const hasImage = finalMessages.some((m) => m.image);
      const fallback = findBestResponse(lastUserText, hasImage);
      console.log("[DashScope] Falling back to knowledge base response");
      return {
        content: fallback.content,
        isTemplate: fallback.isTemplate,
        tokensIn: 0,
        tokensOut: 0
      };
    }
  }
}