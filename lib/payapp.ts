import { URLSearchParams } from "url";

export interface PayAppRequestParams {
  productKind: "balance" | "bundle" | "topup_custom";
  productCode: string;
  orderNo: string;
  goodName: string;
  price: number;
  buyerPhone: string;
  buyerName: string;
  openPayType?: string;
}

export interface PayAppResponse {
  success: boolean;
  payUrl?: string;
  errorMsg?: string;
  raw?: any;
}

/**
 * PayApp REST 결제창 생성 요청
 */
export async function createPayAppPayment(params: PayAppRequestParams): Promise<PayAppResponse> {
  const userid = process.env.PAYAPP_USERID;
  const linkkey = process.env.PAYAPP_LINKKEY;
  const linkval = process.env.PAYAPP_LINKVAL;
  const feedbackurl = process.env.PAYAPP_FEEDBACK_URL;
  const returnurl = process.env.PAYAPP_RETURN_URL ? `${process.env.PAYAPP_RETURN_URL}?orderNo=${params.orderNo}` : undefined;

  if (!userid || !linkkey || !linkval) {
    return {
      success: false,
      errorMsg: "PayApp 설정 환경변수가 누락되었습니다.",
    };
  }

  const bodyData = new URLSearchParams();
  bodyData.append("cmd", "payrequest");
  bodyData.append("userid", userid);
  bodyData.append("linkkey", linkkey);
  bodyData.append("linkval", linkval);
  bodyData.append("goodname", params.goodName);
  bodyData.append("price", String(params.price));
  bodyData.append("recvphone", params.buyerPhone);
  bodyData.append("memo", params.buyerName); // 구매자명 메모 전송
  bodyData.append("pay_memo", `order_no=${params.orderNo}`); // 검증 메모
  if (feedbackurl) bodyData.append("feedbackurl", feedbackurl);
  if (returnurl) bodyData.append("returnurl", returnurl);
  bodyData.append("smsuse", "n"); // 결제요청 문자 발송안함 (필수)
  
  // 페이앱 사용자 정의 변수
  bodyData.append("var1", params.orderNo);
  bodyData.append("var2", params.productCode); // var2에 productCode 전송
  
  // 결제 수단 동적 설정 (card, phone, vbank, naverpay, kakaopay, tosspay, payco, applepay 등)
  let payMethod = params.openPayType || "card";
  if (payMethod === "bank") {
    payMethod = "rbank";
  }
  
  bodyData.append("shopname", "클코클라우드");
  bodyData.append("redirectpay", "1");
  bodyData.append("openpaytype", payMethod); 

  try {
    const response = await fetch("https://api.payapp.kr/oapi/apiLoad.html", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: bodyData.toString(),
    });

    if (!response.ok) {
      return {
        success: false,
        errorMsg: "결제 처리 중 API 서버 응답 오류가 발생했습니다.",
      };
    }

    const text = await response.text();
    const result = new URLSearchParams(text);

    const state = result.get("state");
    const payurl = result.get("payurl");

    if (state === "1" && payurl) {
      return {
        success: true,
        payUrl: payurl,
        raw: Object.fromEntries(result.entries()),
      };
    } else {
      // 에러 메시지 마스킹
      return {
        success: false,
        errorMsg: "결제창 생성 중 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
        raw: Object.fromEntries(result.entries()),
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errorMsg: "결제 대행 서비스 통신에 실패했습니다. 관리자에게 문의해 주세요.",
    };
  }
}

/**
 * Webhook 서명 및 IP 화이트리스트 검증
 */
export function verifyPayAppWebhook(body: Record<string, string>, clientIp: string): { isValid: boolean; reason?: string } {
  // 1. IP 화이트리스트 검증 (설정되었을 때만 검사)
  const ipWhitelistStr = process.env.PAYAPP_IP_WHITELIST;
  if (ipWhitelistStr && ipWhitelistStr.trim().length > 0) {
    const whitelist = ipWhitelistStr.split(",").map((ip) => ip.trim());
    // IPv6 매핑된 IPv4 주소 처리 (e.g. ::ffff:1.2.3.4)
    const ipv4 = clientIp.includes("::ffff:") ? clientIp.replace("::ffff:", "") : clientIp;
    
    if (!whitelist.includes(clientIp) && !whitelist.includes(ipv4) && !whitelist.includes("*")) {
      return { isValid: false, reason: `허용되지 않은 IP 주소: ${clientIp}` };
    }
  }

  // 2. userid 및 linkval 일치 여부 대조 (페이앱 표준 위변조 방지)
  const expectedUserid = process.env.PAYAPP_USERID;
  const expectedLinkval = process.env.PAYAPP_LINKVAL;

  if (!expectedUserid || !expectedLinkval) {
    return { isValid: false, reason: "서버 측 PayApp 연동 환경 변수가 누락되었습니다." };
  }

  const { userid, linkval } = body;

  if (userid !== expectedUserid) {
    return { isValid: false, reason: "userid 불일치" };
  }

  if (linkval !== expectedLinkval) {
    return { isValid: false, reason: "linkval(연동 VALUE) 불일치" };
  }

  return { isValid: true };
}

