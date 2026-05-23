import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientHash, email, content } = body;

    if (!email || !content) {
      return NextResponse.json({ error: "이메일과 문의 내용은 필수 항목입니다." }, { status: 400 });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "올바른 이메일 형식이 아닙니다." }, { status: 400 });
    }

    const ticketId = `TK-${Math.floor(100000 + Math.random() * 900000)}`;
    const ticketData = {
      ticketId,
      clientHash: clientHash || "anonymous",
      email,
      content,
      created_at: new Date().toISOString()
    };

    // 1. Save locally to data/tickets.json to guarantee persistence
    try {
      const dirPath = path.join(process.cwd(), "data");
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, "tickets.json");
      let tickets = [];
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        try {
          tickets = JSON.parse(fileContent || "[]");
        } catch {
          tickets = [];
        }
      }
      tickets.push(ticketData);
      fs.writeFileSync(filePath, JSON.stringify(tickets, null, 2), "utf-8");
    } catch (fsErr) {
      console.error("Failed to save ticket locally:", fsErr);
    }

    // 2. Try to save to Supabase bot_tickets if available
    const supabase = getSupabaseAdminClient();
    if (supabase) {
      const { error: dbError } = await supabase.from("bot_tickets").insert([
        {
          id: ticketId,
          client_hash: clientHash || "anonymous",
          contact_email: email,
          message: content,
          created_at: ticketData.created_at
        }
      ]);
      if (dbError) {
        console.warn("Supabase insert ignored (bot_tickets table might not exist yet):", dbError.message);
      }
    }

    return NextResponse.json({ success: true, ticketId });
  } catch (err: any) {
    console.error("Ticket API caught error:", err);
    return NextResponse.json(
      { error: "문의를 접수하는 중에 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }
}
