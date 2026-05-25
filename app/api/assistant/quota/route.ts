import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { checkQuota } from "@/lib/assistant/quota";
import { getSessionFromRequest } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다. 회원가입 후 조회가 가능합니다." }, { status: 401 });
    }

    const rawId = `${session.provider}:${session.providerAccountId}`;
    const clientHash = createHash("sha256").update(rawId).digest("hex");

    const quota = await checkQuota(clientHash);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");
    
    return NextResponse.json(quota, { headers });
  } catch (err: any) {
    console.error("[AssistantQuotaRoute] GET failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
