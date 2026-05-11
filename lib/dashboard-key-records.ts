import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "crypto";
import type { NextRequest } from "next/server";
import type { AuthSession } from "@/lib/auth-session";
import type { ApiKeyStatus } from "@/lib/keys/types";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export type DashboardKeyRecord = {
  id: string;
  user_provider: string;
  user_provider_account_id: string;
  encrypted_api_key: string;
  api_key_fingerprint: string;
  masked_api_key: string;
  last_status: string | null;
  last_balance: number | null;
  last_spend_cap: number | null;
  last_rpm: number | null;
  last_checked_at: string;
  created_at: string;
  updated_at: string;
};

export type DashboardKeyListItem = Pick<DashboardKeyRecord, "id" | "masked_api_key" | "last_status" | "last_balance" | "last_spend_cap" | "last_rpm" | "last_checked_at" | "created_at" | "updated_at"> & {
  apiKey?: string;
};

const ENCRYPTION_ALGORITHM = "aes-256-gcm";

function getKeySecret() {
  return process.env.API_KEY_ENCRYPTION_SECRET || "";
}

function getHashSecret() {
  return process.env.API_KEY_ENCRYPTION_SECRET || process.env.AUTH_SESSION_SECRET || "clkocloud-local-hash";
}

function getEncryptionKey() {
  const secret = getKeySecret();
  if (!secret || secret === "replace-with-a-long-random-secret") return null;
  return createHash("sha256").update(secret).digest();
}

function getFingerprint(apiKey: string) {
  const secret = getHashSecret();
  return createHmac("sha256", secret).update(apiKey).digest("hex");
}

export function maskStoredApiKey(apiKey: string) {
  if (apiKey.length <= 10) return `${apiKey.slice(0, 3)}••••`;
  return `${apiKey.slice(0, 8)}••••••${apiKey.slice(-4)}`;
}

function encryptApiKey(apiKey: string) {
  const key = getEncryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptApiKey(payload: string) {
  const key = getEncryptionKey();
  if (!key) return null;
  const [ivValue, tagValue, encryptedValue] = payload.split(".");
  if (!ivValue || !tagValue || !encryptedValue) return null;
  try {
    const decipher = createDecipheriv(ENCRYPTION_ALGORITHM, key, Buffer.from(ivValue, "base64url"));
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final()
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export async function saveDashboardKeyRecord(session: AuthSession | null, apiKey: string, status: ApiKeyStatus) {
  if (!session) return;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const encrypted = encryptApiKey(apiKey);
  if (!encrypted) return;

  const now = new Date().toISOString();
  await supabase.from("dashboard_key_records").upsert(
    {
      user_provider: session.provider,
      user_provider_account_id: session.providerAccountId,
      encrypted_api_key: encrypted,
      api_key_fingerprint: getFingerprint(apiKey),
      masked_api_key: maskStoredApiKey(apiKey),
      last_status: status.status || null,
      last_balance: status.balanceUsd ?? null,
      last_spend_cap: status.monthlySpendCapUsd ?? null,
      last_rpm: status.rateLimitRpm ?? null,
      last_checked_at: now,
      updated_at: now
    },
    { onConflict: "user_provider,user_provider_account_id,api_key_fingerprint" }
  );
}

export async function getDashboardKeyRecords(session: AuthSession | null, includeDecrypted = false): Promise<DashboardKeyListItem[]> {
  if (!session) return [];
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("dashboard_key_records")
    .select("id,user_provider,user_provider_account_id,encrypted_api_key,api_key_fingerprint,masked_api_key,last_status,last_balance,last_spend_cap,last_rpm,last_checked_at,created_at,updated_at")
    .eq("user_provider", session.provider)
    .eq("user_provider_account_id", session.providerAccountId)
    .order("last_checked_at", { ascending: false })
    .limit(12);

  if (error || !data) return [];

  return (data as DashboardKeyRecord[]).map((record) => {
    const item: DashboardKeyListItem = {
      id: record.id,
      masked_api_key: record.masked_api_key,
      last_status: record.last_status,
      last_balance: record.last_balance,
      last_spend_cap: record.last_spend_cap,
      last_rpm: record.last_rpm,
      last_checked_at: record.last_checked_at,
      created_at: record.created_at,
      updated_at: record.updated_at
    };
    if (includeDecrypted) {
      const apiKey = decryptApiKey(record.encrypted_api_key);
      if (apiKey) item.apiKey = apiKey;
    }
    return item;
  });
}

function getClientIp(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || request.ip || "unknown";
}

function hashIp(ip: string) {
  const secret = getHashSecret();
  return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
}

export async function recordSessionEvent(session: AuthSession | null, request: NextRequest, eventType: string) {
  if (!session) return;
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase.from("session_events").insert({
    user_provider: session.provider,
    user_provider_account_id: session.providerAccountId,
    event_type: eventType,
    ip_hash: hashIp(getClientIp(request)),
    user_agent: request.headers.get("user-agent")?.slice(0, 500) || null
  });
}
