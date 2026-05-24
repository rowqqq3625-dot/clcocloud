import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, rating, reason } = body;

    // Validate inputs
    const parsedMessageId = typeof messageId === "string" ? parseInt(messageId, 10) : messageId;
    if (!parsedMessageId || isNaN(parsedMessageId)) {
      return NextResponse.json({ error: "Invalid messageId" }, { status: 400 });
    }

    if (rating !== 1 && rating !== -1) {
      return NextResponse.json({ error: "Rating must be 1 or -1" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error } = await supabase.from("assistant_feedback").upsert({
        message_id: parsedMessageId,
        rating,
        reason: reason || null,
        created_at: new Date().toISOString()
      });

      if (error) {
        console.error("[AssistantFeedbackRoute] Supabase error:", error);
        return NextResponse.json({ error: "Failed to record feedback in DB" }, { status: 500 });
      }
    } else {
      console.warn("[AssistantFeedbackRoute] Supabase client unavailable. Simulating success.");
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[AssistantFeedbackRoute] POST failed:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
