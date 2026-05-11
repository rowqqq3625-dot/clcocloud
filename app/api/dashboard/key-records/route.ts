import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getDashboardKeyRecords } from "@/lib/dashboard-key-records";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ records: [] }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const records = await getDashboardKeyRecords(session, true);
  return NextResponse.json({ records }, { headers: { "Cache-Control": "no-store" } });
}
