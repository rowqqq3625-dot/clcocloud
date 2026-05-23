import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSessionFromRequest } from "@/lib/auth-session";
import { SYSTEM_PROMPT } from "@/lib/bot/systemPrompt";

export const dynamic = "force-dynamic";
import { checkBlocklist } from "@/lib/bot/blocklist";
import { callChatbotModel, ChatMessage } from "@/lib/bot/client";

// Global cache reference to share in-memory quotas during local development
const globalRef = global as any;
globalRef.inMemoryQuota = globalRef.inMemoryQuota || new Map<string, { used_count: number; quota_date: string }>();
const inMemoryQuota = globalRef.inMemoryQuota;

// Simple HTML sanitizer
function sanitizeInput(text: string): string {
  if (!text) return "";
  // Remove HTML tags
  return text.replace(/<[^>]*>/g, "").slice(0, 600);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, nonce } = body;
    let requestClientHash = body.clientHash;

    // 1. Authenticate user to prioritize user ID as the rate limit key
    const session = getSessionFromRequest(request);
    let clientHash = requestClientHash;

    if (session) {
      const rawId = `${session.provider}:${session.providerAccountId}`;
      clientHash = createHash("sha256").update(rawId).digest("hex");
    }

    // 2. Validate clientHash format
    if (!clientHash || typeof clientHash !== "string" || clientHash.length !== 64) {
      return NextResponse.json({ error: "Invalid client hash format" }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // 3. Extract and sanitize latest user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      return NextResponse.json({ error: "Latest message must be from user" }, { status: 400 });
    }

    const sanitizedContent = sanitizeInput(lastUserMessage.content);
    const hasImage = !!lastUserMessage.image;

    // Allow messages with only an image (no text) - the model will analyze the image
    if (!sanitizedContent && !hasImage) {
      return NextResponse.json({ error: "Message content is empty after sanitization" }, { status: 400 });
    }

    // Update the last user message with sanitized content
    lastUserMessage.content = sanitizedContent || "이 이미지를 분석해 주세요.";

    // 4. Pre-checks blocklist matching (only check text, not images)
    if (sanitizedContent) {
      const blockCheck = checkBlocklist(sanitizedContent);
      if (blockCheck.blocked) {
        // Log blocked request if database is available
        const supabase = getSupabaseAdminClient();
        if (supabase) {
          await supabase.from("bot_messages").insert([
            {
              client_hash: clientHash,
              role: "user",
              content: sanitizedContent,
              blocked_reason: blockCheck.reason
            }
          ]);
        }
        return NextResponse.json({
          content: blockCheck.refusalMessage,
          blocked: true
        });
      }
    }

    // 5. Rate limit daily check
    const dailyLimit = Number(process.env.CLCOCLOUD_BOT_DAILY_LIMIT) || 30;
    const now = new Date();
    const kstDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    let currentUsedCount = 0;
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data: quotaRow, error: quotaError } = await supabase
        .from("bot_usage_quota")
        .select("used_count")
        .eq("client_hash", clientHash)
        .eq("quota_date", kstDate)
        .maybeSingle();

      if (quotaError) {
        console.error("Failed to query usage quota from DB:", quotaError);
      } else if (quotaRow) {
        currentUsedCount = quotaRow.used_count;
      }
    } else {
      // Fallback to in-memory in development
      const cached = inMemoryQuota.get(clientHash);
      if (cached && cached.quota_date === kstDate) {
        currentUsedCount = cached.used_count;
      }
    }

    // If quota exceeded, return 429
    if (currentUsedCount >= dailyLimit) {
      const quotaExceededMessage = `오늘의 상담 한도(30회)에 도달했습니다. 내일 자정 이후 다시 도와드릴게요. 급하시면 support.clcocloud@gmail.com 으로 연락 부탁드립니다.`;
      if (supabase) {
        await supabase.from("bot_messages").insert([
          {
            client_hash: clientHash,
            role: "user",
            content: sanitizedContent || "[이미지 첨부]",
            blocked_reason: "rate_limit"
          }
        ]);
      }
      return NextResponse.json({
        content: quotaExceededMessage,
        rateLimited: true
      }, { status: 429 });
    }

    // 6. Build contextual message logs: up to 8 turns (16 messages) + prepend system instructions
    const conversationHistory = messages.slice(-16) as ChatMessage[];
    const chatPayload: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...conversationHistory
    ];

    // 7. Call Qwen 3.5 Flash Multimodal via DashScope API
    let responseData;
    try {
      responseData = await callChatbotModel(chatPayload, nonce || "");
    } catch (modelError) {
      console.error("Model completions API failed:", modelError);
      return NextResponse.json(
        { content: "죄송합니다, AI 상담 시스템에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요. 😔" },
        { status: 500 }
      );
    }

    // 8. Update DB logs and Quota counter (Template/error responses do not decrement remaining quotas)
    const isTemplate = responseData.isTemplate === true;
    const nextUsedCount = isTemplate ? currentUsedCount : currentUsedCount + 1;

    if (supabase) {
      // Transactional updates - update db only if quota actually consumed, or upsert to touch timestamp
      const { error: upsertError } = await supabase.from("bot_usage_quota").upsert(
        {
          client_hash: clientHash,
          quota_date: kstDate,
          used_count: nextUsedCount,
          last_used_at: new Date().toISOString()
        },
        { onConflict: "client_hash,quota_date" }
      );

      if (upsertError) {
        console.error("Failed to update usage quota in DB:", upsertError);
      }

      const { error: logError } = await supabase.from("bot_messages").insert([
        {
          client_hash: clientHash,
          role: "user",
          content: sanitizedContent || "[이미지 첨부]",
          tokens_in: responseData.tokensIn || 0,
          tokens_out: responseData.tokensOut || 0
        },
        {
          client_hash: clientHash,
          role: "assistant",
          content: responseData.content,
          tokens_in: responseData.tokensIn || 0,
          tokens_out: responseData.tokensOut || 0
        }
      ]);

      if (logError) {
        console.error("Failed to log bot messages in DB:", logError);
      }
    } else {
      // Fallback cache in development
      inMemoryQuota.set(clientHash, {
        used_count: nextUsedCount,
        quota_date: kstDate
      });
    }

    // 9. Deliver response
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");
    return NextResponse.json(
      {
        content: responseData.content,
        usedCount: nextUsedCount,
        dailyLimit
      },
      { headers }
    );
  } catch (err) {
    console.error("Chat API caught general error:", err);
    return NextResponse.json(
      { content: "서버가 정상적으로 응답하지 못했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
