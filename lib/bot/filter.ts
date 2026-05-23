export function filterResponse(text: string): string {
  if (!text) return "";

  let filtered = text;

  // 1. Mask routeai / RouteAI (case-insensitive)
  filtered = filtered.replace(/routeai/gi, "[마스킹됨]");

  // 2. Mask phone numbers matching 010-XXXX-XXXX or similar
  filtered = filtered.replace(/010[-]?\d{3,4}[-]?\d{4}/g, "[연락처 마스킹됨]");

  // 3. Mask potential API Keys (sk-ant-..., rm_..., sk-...)
  filtered = filtered.replace(/sk-ant-[a-zA-Z0-9_-]+/g, "[API 키 마스킹됨]");
  filtered = filtered.replace(/rm_[a-zA-Z0-9_-]+/g, "[API 키 마스킹됨]");
  filtered = filtered.replace(/sk-[a-f0-9]{32,}/g, "[API 키 마스킹됨]");

  // 4. Mask environment variables
  const envVars = [
    "CLCOCLOUD_BOT_API_KEY",
    "CLCOCLOUD_BOT_BASE_URL",
    "CLCOCLOUD_BOT_MODEL",
    "CLCOCLOUD_BOT_DAILY_LIMIT",
    "CLCOCLOUD_BOT_MAX_INPUT_CHARS",
    "CLCOCLOUD_BOT_TIMEOUT_MS",
    "DASHSCOPE_API_KEY",
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
  ];
  for (const envVar of envVars) {
    const regex = new RegExp(envVar, "g");
    filtered = filtered.replace(regex, "[환경변수 마스킹됨]");
  }

  // 5. Mask model names (prevent internal model name leaks)
  filtered = filtered.replace(/claude-opus-4-7/gi, "상담 모델");
  filtered = filtered.replace(/claude-sonnet-4-6/gi, "상담 모델");
  filtered = filtered.replace(/qwen3\.?5[-.]?flash/gi, "상담 모델");
  filtered = filtered.replace(/dashscope/gi, "상담 시스템");

  // 6. Remove any remaining <think>...</think> blocks from thinking models
  filtered = filtered.replace(/<think>[\s\S]*?<\/think>/g, "");

  return filtered.trim();
}
