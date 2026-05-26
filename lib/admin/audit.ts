import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getClientIp, getCountryFromRequest } from "./geo";
import { hashUserAgent } from "./hash";

type HeaderSource = Headers | { get(name: string): string | null };

type RequestLike = {
  headers: HeaderSource;
};

type AuditInput = {
  email?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  payload?: Record<string, unknown>;
  req: RequestLike;
};

type SecurityEventInput = {
  eventType: string;
  email?: string | null;
  payload?: Record<string, unknown>;
  req: RequestLike;
};

function readHeader(headers: HeaderSource, name: string): string | null {
  return headers.get(name) ?? null;
}

function pickContext(req: RequestLike) {
  const country = getCountryFromRequest(req.headers);
  const ip = getClientIp(req.headers);
  const ua = readHeader(req.headers, "user-agent");
  return {
    ip,
    country,
    user_agent_hash: hashUserAgent(ua),
  };
}

export async function logAdminAction(input: AuditInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const ctx = pickContext(input.req);
  await supabase.from("admin_audit_logs").insert({
    admin_email: input.email ?? null,
    action: input.action,
    target_type: input.targetType ?? null,
    target_id: input.targetId ?? null,
    payload: input.payload ?? {},
    ip: ctx.ip,
    country: ctx.country,
    user_agent_hash: ctx.user_agent_hash,
  });
}

export async function logAdminSecurityEvent(input: SecurityEventInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const ctx = pickContext(input.req);
  await supabase.from("admin_security_events").insert({
    event_type: input.eventType,
    email: input.email ?? null,
    payload: input.payload ?? {},
    ip: ctx.ip,
    country: ctx.country,
    user_agent_hash: ctx.user_agent_hash,
  });
}
