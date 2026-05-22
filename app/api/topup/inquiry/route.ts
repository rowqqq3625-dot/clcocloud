import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { generateInquiryNo } from "@/lib/orderNumber";
import { sendAlimtalk } from "@/lib/alimtalk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { desiredUsd, buyerName, buyerPhone, memo } = body;

    // 1. 입력 유효성 검증
    const usd = Number(desiredUsd);
    if (isNaN(usd) || usd < 1000 || usd > 5000 || usd % 100 !== 0) {
      return NextResponse.json({ error: "희망 잔액은 $1,000에서 $5,000 사이의 $100 단위여야 합니다." }, { status: 400 });
    }

    if (!buyerName || typeof buyerName !== "string" || buyerName.trim().length === 0) {
      return NextResponse.json({ error: "성함을 입력해주세요." }, { status: 400 });
    }

    const phoneClean = buyerPhone ? buyerPhone.replace(/[^0-9]/g, "") : "";
    const phoneRegex = /^(010|011|016|017|018|019)[0-9]{7,8}$/;
    if (!phoneClean || !phoneRegex.test(phoneClean)) {
      return NextResponse.json({ error: "올바른 휴대폰 번호를 입력해주세요." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "데이터베이스 연결에 실패했습니다." }, { status: 500 });
    }

    // 2. 환산금액 산출 ($100 당 40,000원 고정)
    // $1000 = 400,000원
    const amountKrw = usd * 400;

    // 3. 문의번호 생성
    const inquiryNo = await generateInquiryNo();

    // 4. DB 저장
    const { data: inquiry, error: insertError } = await supabase
      .from("topup_inquiries")
      .insert({
        inquiry_no: inquiryNo,
        desired_usd: usd,
        amount_krw: amountKrw,
        buyer_name: buyerName.trim(),
        buyer_phone: phoneClean,
        memo: memo ? memo.trim() : null,
        status: "open"
      })
      .select()
      .single();

    if (insertError || !inquiry) {
      console.error("[Topup Inquiry] DB insert failed:", insertError?.message);
      return NextResponse.json({ error: "문의 사항 등록에 실패했습니다. 다시 시도해주세요." }, { status: 500 });
    }

    // 5. 운영자 알림톡 전송
    const sysNow = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    await sendAlimtalk({
      templateCode: process.env.BARTI_TEMPLATE_ADMIN_INQUIRY || "ADMIN_INQUIRY",
      phone: process.env.OPERATOR_PHONE || "",
      variables: {
        문의번호: inquiryNo,
        희망잔액: String(usd),
        예상금액: String(amountKrw),
        문의자명: buyerName.trim(),
        문의자연락처: phoneClean,
        메모: memo ? memo.trim() : "없음",
        접수시각: sysNow
      },
      inquiryId: inquiry.id,
      recipient: "operator"
    });

    return NextResponse.json({
      success: true,
      inquiryNo: inquiryNo
    });

  } catch (err: any) {
    console.error("[Topup Inquiry API] Unexpected error:", err);
    return NextResponse.json({ error: "서버 오류로 인해 접수에 실패했습니다." }, { status: 500 });
  }
}
