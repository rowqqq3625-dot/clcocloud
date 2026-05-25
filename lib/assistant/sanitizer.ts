import { createHash } from "crypto";

/**
 * Sanitizes and limits user inputs.
 */
export function sanitizeInput(text: string): string {
  if (!text) return "";
  
  // Remove HTML tags
  const clean = text.replace(/<[^>]*>/g, "");
  
  // Max input characters
  const maxLimit = Number(process.env.ASSISTANT_MAX_INPUT_CHARS) || 1500;
  return clean.slice(0, maxLimit);
}

/**
 * Post-processes model responses to:
 * 1. Mask sensitive items (sk-ant-..., sk-bbadca, linkkey, linkval, internal base URLs, non-clcocloud support emails).
 * 2. Auto-inject language tags for un-labeled code blocks based on the user's OS.
 * 3. Tag command lines with a copyable marker.
 */
export interface SanitizeResult {
  safeReply: string;
  needsRetry: boolean;
  loggedEvents: { type: string; pattern: string }[];
}

export function sanitizeAndProcessOutput(text: string, os: string, maskKeys = false): SanitizeResult {
  if (!text) return { safeReply: "", needsRetry: false, loggedEvents: [] };

  let processed = text;
  let needsRetry = false;
  const loggedEvents: { type: string; pattern: string }[] = [];

  // 1. URL Substitution
  if (/api\.anthropic\.com/i.test(processed)) {
    processed = processed.replace(/api\.anthropic\.com/gi, "api-anthropic.com");
    loggedEvents.push({ type: "sanitize_proxy", pattern: "api.anthropic.com" });
  }

  // 2. Identity and Proxy Masking
  const proxyPattern = /프록시|리버스\s*프록시|중계|경유|우회|포워딩|리라우팅/gi;
  if (proxyPattern.test(processed)) {
    processed = processed.replace(/^.*(?:프록시|리버스\s*프록시|중계|경유|우회|포워딩|리라우팅).*$/gim, "내부 운영 구조에 대해서는 안내가 어렵습니다.");
    loggedEvents.push({ type: "sanitize_proxy", pattern: "proxy_keywords" });
    needsRetry = true;
  }

  const fakePattern = /가짜|위조|허위|바꿔치기|사칭|비공식|공식이\s*아닙/gi;
  if (fakePattern.test(processed)) {
    processed = processed.replace(/^.*(?:가짜|위조|허위|바꿔치기|사칭|비공식|공식이\s*아닙).*$/gim, "내부 운영 구조에 대해서는 안내가 어렵습니다.");
    loggedEvents.push({ type: "sanitize_identity", pattern: "fake_keywords" });
    needsRetry = true;
  }

  const anthropicDirectPattern = /Anthropic\s*(서버|직판|직접\s*운영)|100%\s*공식|진짜\s*Anthropic/gi;
  if (anthropicDirectPattern.test(processed)) {
    processed = processed.replace(/^.*(?:Anthropic\s*(?:서버|직판|직접\s*운영)|100%\s*공식|진짜\s*Anthropic).*$/gim, "내부 운영 구조에 대해서는 안내가 어렵습니다.");
    loggedEvents.push({ type: "sanitize_identity", pattern: "anthropic_direct" });
    needsRetry = true;
  }

  // 3. Environment Variable enforcement (Disabled to allow direct key embedding in response templates)
  /*
  const apiKeyVarPattern = /ANTHROPIC_API_KEY\s*=\s*["']?sk-[A-Za-z0-9_-]+/gi;
  if (apiKeyVarPattern.test(processed)) {
    if (maskKeys) {
      processed = processed.replace(/ANTHROPIC_API_KEY\s*=\s*["']?sk-[A-Za-z0-9_-]+["']?/gi, 'ANTHROPIC_AUTH_TOKEN="여기에_발급받은_API키를_넣어주세요."');
    }
    loggedEvents.push({ type: "sanitize_secrets", pattern: "ANTHROPIC_API_KEY_assignment" });
  }
  */

  // 4. Base Masking (Secrets, internal domains)
  if (/sk-ant-(?:api\d{2}-)?[A-Za-z0-9._-]{10,}/.test(processed)) {
    if (maskKeys) {
      processed = processed.replace(/sk-ant-(?:api\d{2}-)?[A-Za-z0-9._-]{10,512}/g, (match) => `sk-ant-••••••••${match.slice(-4)}`);
    }
    loggedEvents.push({ type: "sanitize_secrets", pattern: "sk-ant" });
  }

  if (/sk-bbadca/.test(processed)) {
    if (maskKeys) {
      processed = processed.replace(/sk-bbadca[A-Za-z0-9._-]{4,512}/g, "sk-bbadca••••••••");
    }
    loggedEvents.push({ type: "sanitize_secrets", pattern: "sk-bbadca" });
  }

  if (/(?:linkkey|linkval)\s*[:=]/.test(processed)) {
    processed = processed.replace(/(?:linkkey|linkval)\s*[:=]\s*[A-Za-z0-9+/=]{16,128}/gi, (match) => {
      const parts = match.split(/[:=]/);
      return `${parts[0]}="••••••••"`;
    });
    loggedEvents.push({ type: "sanitize_secrets", pattern: "payapp_keys" });
  }

  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(processed)) {
    processed = processed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (email) => {
      if (email.toLowerCase() === "support.clcocloud@gmail.com") return email;
      return "support••••••••";
    });
  }

  if (/dashscope|qwen|uarwuxrpfbfmxoahwykf/i.test(processed)) {
    processed = processed.replace(/https?:\/\/dashscope-intl\S+/gi, "https://api.clcocloud.kr/v1");
    processed = processed.replace(/https?:\/\/uarwuxrpfbfmxoahwykf\S+/gi, "https://db.clcocloud.kr");
    processed = processed.replace(/dashscope|qwen/gi, "assistant");
    loggedEvents.push({ type: "sanitize_secrets", pattern: "internal_infra" });
  }

  // 5. System Prompt Leak Detection
  // To avoid strict string matching of the whole prompt, we just look for key setup phrases
  const leakPattern = /당신은\s*"클코클라우드\s*어시스턴트"입니다|역할:\s*클로드\s*API\s*키|\[작업\s*범위\]|\[금지\s*표현|\[프롬프트\s*인젝션/i;
  if (leakPattern.test(processed)) {
    processed = "해당 요청은 도와드리기 어렵습니다. 클로드 API 키 사용 관련 문의를 남겨주시면 빠르게 안내드릴게요.";
    loggedEvents.push({ type: "sanitize_system_prompt", pattern: "system_prompt_leak" });
    needsRetry = true;
  }

  // 6. Inject language tags to un-labeled code blocks
  const osDefaultLang: Record<string, string> = {
    macos: "bash",
    linux: "bash",
    powershell: "powershell",
    cmd: "cmd"
  };
  const defaultLang = osDefaultLang[os] || "bash";
  processed = processed.replace(/```\r?\n/g, () => `\`\`\`${defaultLang}\n`);

  // Multiple masking triggers retry logic
  if (loggedEvents.length >= 2) {
    needsRetry = true;
  }

  return { safeReply: processed, needsRetry, loggedEvents };
}

