import { NextRequest, NextResponse } from "next/server";
import { getKeyInfo, ApiKeyError } from "@/lib/keys/client";

// Simple in-memory rate limiting map
// In production, use Redis or Vercel KV
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 requests per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record) {
    rateLimitStore.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (now > record.expiresAt) {
    // Window expired, reset
    rateLimitStore.set(ip, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  record.count += 1;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting based on IP
    const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": "60", "Cache-Control": "no-store" } }
      );
    }

    // 2. Parse and validate payload
    const body = await request.json();
    const apiKey = body.apiKey;

    if (!apiKey || typeof apiKey !== "string") {
      return NextResponse.json(
        { error: "API Key is required" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    // Remove strict prefix validation to allow mapped keys or ClkoCloud keys (sk-...)
    // as well as rm_ keys.
    if (!/^[A-Za-z0-9_\-\.]+$/.test(apiKey)) {
      return NextResponse.json(
        { error: "Invalid API Key format" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    // 3. Fetch data from upstream securely
    const keyInfo = await getKeyInfo(apiKey);

    // 4. Return sanitized response
    return NextResponse.json(
      { data: keyInfo, fetchedAt: new Date().toISOString() },
      { 
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        }
      }
    );
    
  } catch (error) {
    if (error instanceof ApiKeyError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status, headers: { "Cache-Control": "no-store" } }
      );
    }

    console.error("Upstream proxy unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
