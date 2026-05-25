export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
  image?: string; // base64 or URL (legacy/single)
  images?: string[]; // base64 or URLs (up to 4)
}

interface DashScopeCompletionsResponse {
  choices?: {
    message?: {
      role?: string;
      content?: string;
      reasoning_content?: string;
    };
    finish_reason?: string;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

export interface ModelCallResult {
  content: string;
  reasoningContent?: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}

/**
 * Delay helper for retry backoff
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Call the DashScope completions model (Qwen3.6-plus) with retry and thinking enabled.
 */
export async function callAssistantModel(
  messages: ChatMessage[],
  nonce: string = ""
): Promise<ModelCallResult> {
  const model = process.env.DASHSCOPE_MODEL || "qwen3.6-plus";
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    throw new Error("DASHSCOPE_API_KEY environment variable is not set");
  }
  const baseUrl = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
  
  const timeoutMs = Number(process.env.ASSISTANT_TIMEOUT_MS) || 45000;
  const enableThinking = process.env.ASSISTANT_ENABLE_THINKING !== "false"; // default true

  // Format messages into OpenAI compatible formats
  const formattedMessages: any[] = [];

  for (const m of messages) {
    if (m.images && m.images.length > 0) {
      // Multimodal payload with multiple images
      const contentArray: any[] = [];
      m.images.forEach((img) => {
        contentArray.push({ type: "image_url", image_url: { url: img } });
      });
      
      if (m.content) {
        contentArray.push({ type: "text", text: m.content });
      } else {
        contentArray.push({ type: "text", text: "이 이미지들을 분석해 주세요." });
      }
      formattedMessages.push({ role: m.role, content: contentArray });
    } else if (m.image) {
      // Multimodal payload with single image
      const contentArray: any[] = [
        { type: "image_url", image_url: { url: m.image } }
      ];
      if (m.content) {
        contentArray.push({ type: "text", text: m.content });
      } else {
        contentArray.push({ type: "text", text: "이 이미지를 분석해 주세요." });
      }
      formattedMessages.push({ role: m.role, content: contentArray });
    } else {
      formattedMessages.push({ role: m.role, content: m.content });
    }
  }

  const payload = {
    model,
    messages: formattedMessages,
    temperature: 0.2,
    top_p: 0.85,
    max_tokens: 1800,
    enable_thinking: enableThinking
  };

  const makeSingleRequest = async (): Promise<ModelCallResult> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const startTime = Date.now();

    try {
      console.log(`[DashScope Assistant] Calling ${model} (Singapore) | messages: ${formattedMessages.length}`);
      
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      const latencyMs = Date.now() - startTime;
      const data = (await response.json()) as DashScopeCompletionsResponse;

      if (!response.ok || data.error) {
        const errMsg = data.error?.message || `HTTP ${response.status}`;
        const errCode = data.error?.code || data.error?.type || "";
        console.error(`[DashScope Assistant] Error: ${errCode} - ${errMsg}`);
        throw new Error(`DashScope API error: ${errCode} - ${errMsg}`);
      }

      const choice = data.choices?.[0]?.message;
      let rawText = choice?.content || "";
      const reasoningText = choice?.reasoning_content || "";

      if (!rawText && !reasoningText) {
        console.warn("[DashScope Assistant] Empty response. Full data:", JSON.stringify(data));
        throw new Error("Empty response from model");
      }

      // If thinking was embedded in standard content inside <think> tags, strip it out
      // (some versions output inside <think> tags rather than reasoning_content)
      const cleanText = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      const tokensIn = data.usage?.prompt_tokens || 0;
      const tokensOut = data.usage?.completion_tokens || 0;

      console.log(`[DashScope Assistant] Qwen Call Success. In: ${tokensIn}, Out: ${tokensOut}, Latency: ${latencyMs}ms`);

      return {
        content: cleanText,
        reasoningContent: reasoningText || undefined,
        tokensIn,
        tokensOut,
        latencyMs
      };
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Attempt 1
  try {
    return await makeSingleRequest();
  } catch (error: any) {
    console.warn("[DashScope Assistant] Attempt 1 failed:", error?.message);
    
    // Exponential backoff 1.5s
    await delay(1500);

    // Attempt 2 (Retry 1)
    try {
      console.log("[DashScope Assistant] Retrying API request...");
      return await makeSingleRequest();
    } catch (retryError: any) {
      console.error("[DashScope Assistant] All attempts failed:", retryError?.message);
      throw retryError;
    }
  }
}
