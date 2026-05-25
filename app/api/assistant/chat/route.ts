import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSessionFromRequest } from "@/lib/auth-session";
import { sanitizeInput, sanitizeAndProcessOutput } from "@/lib/assistant/sanitizer";
import { checkPromptInjection, appendInjectionGuard } from "@/lib/assistant/injectionFilter";
import { buildSystemPrompt } from "@/lib/assistant/systemPrompt";
import { checkQuota, incrementQuota } from "@/lib/assistant/quota";
import { callAssistantModel, ChatMessage } from "@/lib/assistant/dashscope";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let clientHash = "";
  try {
    const body = await request.json();
    const { os, usecase, messages, images, nonce } = body;
    let requestClientHash = body.clientHash;

    // 1. Resolve and authenticate user's clientHash - STRICT AUTHENTICATION GUARD
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다. 회원가입 후 어시스턴트를 이용해주세요. 😊" }, { status: 401 });
    }

    const rawId = `${session.provider}:${session.providerAccountId}`;
    clientHash = createHash("sha256").update(rawId).digest("hex");

    // 2. Validate clientHash format
    if (!clientHash || typeof clientHash !== "string" || clientHash.length !== 64) {
      return NextResponse.json({ error: "Invalid client hash format" }, { status: 400 });
    }

    // 3. Validate OS & Usecase
    const validOS = ["macos", "powershell", "cmd", "linux"];
    if (!os || !validOS.includes(os)) {
      return NextResponse.json({ error: "Invalid or missing OS environment" }, { status: 400 });
    }

    if (!usecase || typeof usecase !== "string" || usecase.trim().length === 0) {
      return NextResponse.json({ error: "Usecase is required" }, { status: 400 });
    }

    const sanitizedUsecase = usecase.trim().slice(0, 60);

    // 4. Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== "user") {
      return NextResponse.json({ error: "Latest message must be from user" }, { status: 400 });
    }

    // Sanitize user input content
    const sanitizedUserContent = sanitizeInput(lastUserMessage.content);
    const hasImage = !!(images && Array.isArray(images) && images.length > 0) || !!lastUserMessage.image || !!lastUserMessage.images;

    if (!sanitizedUserContent && !hasImage) {
      return NextResponse.json({ error: "Message content cannot be empty after sanitization" }, { status: 400 });
    }

    // Check images count limit
    const imagesToAttach = images || lastUserMessage.images || (lastUserMessage.image ? [lastUserMessage.image] : []);
    if (imagesToAttach.length > 4) {
      return NextResponse.json({ error: "최대 4장의 이미지만 첨부할 수 있습니다." }, { status: 400 });
    }

    // Update last message with sanitized values
    lastUserMessage.content = sanitizedUserContent || "이 이미지를 분석해 주세요.";
    if (imagesToAttach.length > 0) {
      lastUserMessage.images = imagesToAttach;
      delete lastUserMessage.image; // standardize to images array
    }

    // 5. Weekly quota limit check
    const quotaStatus = await checkQuota(clientHash);
    if (!quotaStatus.allowed) {
      return NextResponse.json(
        {
          reply: `이번 주 어시스턴트 상담 한도(${quotaStatus.limit}회)에 도달했습니다. 최근 7일간의 사용량이 반영되니 잠시 후 또는 다음 주에 다시 이용해 주세요. 급하신 경우 support.clcocloud@gmail.com으로 문의 부탁드립니다.`,
          quotaExceeded: true
        },
        { status: 429 }
      );
    }

    // 6. Injection Filter & System Prompt Build
    const injectionCheck = process.env.ASSISTANT_INJECTION_FILTER === "on" 
      ? checkPromptInjection(lastUserMessage.content) 
      : { hasInjection: false };

    let systemPrompt = buildSystemPrompt(os, sanitizedUsecase);
    if (injectionCheck.hasInjection) {
      systemPrompt = appendInjectionGuard(systemPrompt);
      console.warn(`[AssistantChatRoute] Injection attempt detected: ${injectionCheck.matchedPattern}`);
    }

    const history = messages.slice(-16) as ChatMessage[];
    let chatPayload: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    // 7. Invoke Qwen Model via DashScope
    let modelResult;
    try {
      modelResult = await callAssistantModel(chatPayload, nonce || "");
    } catch (modelError) {
      console.error("[AssistantChatRoute] Model completions API failed:", modelError);
      
      // Mask original errors to protect system info and prevent quota deduction
      return NextResponse.json({
        reply: "지금 응답을 받아오지 못했어요. 잠시 후 다시 시도해 주세요.",
        quota: {
          used: quotaStatus.used,
          limit: quotaStatus.limit
        },
        finishedAt: new Date().toISOString()
      });
    }

    // Log the reasoning content for backend debugging
    if (modelResult.reasoningContent) {
      console.log(`[AssistantChatRoute] Reasoning (Thinking Logs): \n${modelResult.reasoningContent}`);
    }

    // 8. Mask and Post-process the assistant response (with Retry logic)
    // Pass false to maskKeys to expose original API keys for client copy-paste convenience
    let sanitizeResult = sanitizeAndProcessOutput(modelResult.content, os, false);
    
    // Retry once if there are severe violations (identity, proxy, prompt leak)
    if (sanitizeResult.needsRetry) {
      console.warn("[AssistantChatRoute] Retrying model due to severe identity/guideline violation.");
      // Provide a hint to the model to strictly follow identity guidelines
      chatPayload[0].content += "\n\n(이전 응답이 가이드라인을 위반하여 정체성 방어 답변으로 재작성합니다.)";
      
      try {
        const retryResult = await callAssistantModel(chatPayload, (nonce || "") + "-retry");
        modelResult = retryResult; // update result for tokens
        sanitizeResult = sanitizeAndProcessOutput(retryResult.content, os, false);
      } catch (retryError) {
        console.error("[AssistantChatRoute] Retry failed:", retryError);
      }
    }
    
    const safeReply = sanitizeResult.safeReply;

    // 9. Increment Daily usage quota
    const nextQuota = await incrementQuota(clientHash);

    // 10. Persist Session & Messages in Supabase
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      try {
        // Resolve/Create session
        let sessionId = "";
        const { data: sessionRow, error: sessionFetchError } = await supabase
          .from("assistant_sessions")
          .select("id")
          .eq("client_hash", clientHash)
          .eq("os", os)
          .eq("usecase", sanitizedUsecase)
          .order("last_active_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!sessionFetchError && sessionRow) {
          sessionId = sessionRow.id;
          // Update last active
          await supabase
            .from("assistant_sessions")
            .update({ last_active_at: new Date().toISOString() })
            .eq("id", sessionId);
        } else {
          // Create new session
          const { data: newSession, error: sessionInsertError } = await supabase
            .from("assistant_sessions")
            .insert({
              client_hash: clientHash,
              os,
              usecase: sanitizedUsecase
            })
            .select("id")
            .single();
          
          if (!sessionInsertError && newSession) {
            sessionId = newSession.id;
          }
        }

        if (sessionId) {
          // Generate masked reply for database logs to ensure key security (no plaintext keys in DB)
          const dbSafeReply = sanitizeAndProcessOutput(modelResult.content, os, true).safeReply;

          // Insert anonymous messages (fp16 level equivalent - keeping only safe strings, no direct keys)
          await supabase.from("assistant_messages").insert([
            {
              session_id: sessionId,
              role: "user",
              content: sanitizedUserContent || "[이미지 분석 요청]",
              has_image: hasImage,
              tokens_in: modelResult.tokensIn,
              tokens_out: modelResult.tokensOut,
              latency_ms: modelResult.latencyMs
            },
            {
              session_id: sessionId,
              role: "assistant",
              content: dbSafeReply,
              has_image: false,
              tokens_in: modelResult.tokensIn,
              tokens_out: modelResult.tokensOut,
              latency_ms: modelResult.latencyMs
            }
          ]);

          // Log sanitize events if any
          if (sanitizeResult.loggedEvents && sanitizeResult.loggedEvents.length > 0) {
            const logEntries = sanitizeResult.loggedEvents.map(event => ({
              session_id: sessionId,
              client_hash: clientHash,
              event_type: event.type,
              triggered_pattern: event.pattern
            }));
            await supabase.from("assistant_sanitize_logs").insert(logEntries);
          }
        }
      } catch (dbError) {
        console.error("[AssistantChatRoute] Database logging failed:", dbError);
      }
    }

    // 11. Return sanitized results
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");

    return NextResponse.json(
      {
        reply: safeReply,
        quota: nextQuota,
        finishedAt: new Date().toISOString()
      },
      { headers }
    );
  } catch (err) {
    console.error("[AssistantChatRoute] Caught general error:", err);
    return NextResponse.json(
      { reply: "지금 응답을 받아오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
