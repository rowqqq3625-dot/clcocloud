import { NextRequest, NextResponse } from "next/server";
import { checkQuota } from "@/lib/assistant/quota";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientHash = searchParams.get("clientHash");

    if (!clientHash || typeof clientHash !== "string" || clientHash.length < 10) {
      return NextResponse.json({ error: "Invalid clientHash" }, { status: 400 });
    }

    const quota = await checkQuota(clientHash);

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");
    
    return NextResponse.json(quota, { headers });
  } catch (err: any) {
    console.error("[AssistantQuotaRoute] GET failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
