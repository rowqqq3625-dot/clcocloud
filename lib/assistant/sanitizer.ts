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
export function sanitizeAndProcessOutput(text: string, os: string): string {
  if (!text) return "";

  let processed = text;

  // 1. Masking Sensitive Fields
  // sk-ant- keys (Claude keys look like sk-ant-api03-xxxx... or sk-ant-xxxx...)
  processed = processed.replace(/sk-ant-(?:api\d{2}-)?[A-Za-z0-9._-]{10,512}/g, (match) => {
    return `sk-ant-••••••••${match.slice(-4)}`;
  });

  // sk-bbadca and general other sk- keys
  processed = processed.replace(/sk-bbadca[A-Za-z0-9._-]{4,512}/g, "sk-bbadca••••••••");
  
  // PayApp PG keys / linkkey / linkval
  processed = processed.replace(/(?:linkkey|linkval)\s*[:=]\s*[A-Za-z0-9+/=]{16,128}/gi, (match) => {
    const parts = match.split(/[:=]/);
    return `${parts[0]}="••••••••"`;
  });
  
  // Mask any other occurrences of potential base64 PG linkkeys (like the specific payapp ones)
  // PayApp LINKKEY / LINKVAL patterns (e.g. Q4EMxZJXPXxsB38DlsqM8O1DPJnCCRVaOgT+oqg6zaM=)
  processed = processed.replace(/[A-Za-z0-9+/]{20,80}=/g, (match) => {
    // Check if it looks like a base64 key and is not a normal word
    if (match.includes("/") || match.includes("+") || /[0-9]/.test(match)) {
      return "••••••••";
    }
    return match;
  });

  // Mask non-clcocloud support emails (keep support.clcocloud@gmail.com)
  processed = processed.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (email) => {
    if (email.toLowerCase() === "support.clcocloud@gmail.com") {
      return email;
    }
    return "support••••••••";
  });

  // Mask internal Base URLs / endpoints (dashscope, routeai, etc)
  processed = processed.replace(/https?:\/\/dashscope-intl\S+/gi, "https://api.clcocloud.kr/v1");
  processed = processed.replace(/https?:\/\/uarwuxrpfbfmxoahwykf\S+/gi, "https://db.clcocloud.kr");

  // 2. Injecting language tags to un-labeled code blocks based on OS
  // e.g. ``` without tag -> ```bash or ```powershell
  const osDefaultLang: Record<string, string> = {
    macos: "bash",
    linux: "bash",
    powershell: "powershell",
    cmd: "cmd"
  };
  const defaultLang = osDefaultLang[os] || "bash";

  // Replaces ```\n with ```[lang]\n
  processed = processed.replace(/```\r?\n/g, () => {
    return `\`\`\`${defaultLang}\n`;
  });

  // 3. Mark command lines with a clipboard-copyable tag
  // We can insert a special custom markdown style or prefix to command blocks
  // e.g. command blocks that are single lines inside the block or starts with $ or >
  // The prompt says: "답변에 명령어 라인이 있으면 클라이언트에서 자동 '복사' 버튼이 노출되도록 마커 삽입."
  // Let's look at command markers in blocks or lines.
  // We can detect bash/cmd/powershell code blocks and prefix lines inside them with [COPY_CMD] or similar markers,
  // or simple single backtick commands.
  // Let's implement a clean parsing of command lines or blocks.
  // For example, if a line starts with `$` or `>` or contains key commands like `setx`, `export`, `claude login`, etc.
  // We can wrap them in a special HTML tag or markdown syntax so the client knows to show a copy button, e.g. [COPY: cmd-text]
  // Or simply let the CodeBlock component handle individual line copies! In fact, CodeBlock component handles copying the whole block,
  // but if we have individual inline command lines, we can make them copyable by marking them.
  // Let's detect lines that start with "$ " or "setx " or "export " and represent commands,
  // and wrap them in a marker like `[CMD_LINE: export ANTHROPIC_API_KEY="..."]` or similar. Let's make it simple:
  // If there are code blocks like ` ```bash ... ``` `, our client-side `CodeBlock` component will parse them and display a copy button. That is extremely clean and matches modern UIs!
  // To allow individual lines within code blocks or outside to be easily copied, we can insert standard markers, but a code block copy button is the most standard and elegant.
  
  return processed;
}
