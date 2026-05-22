import { URLSearchParams } from "url";

export interface PayAppRequestParams {
  productKind: "balance" | "bundle" | "topup_custom";
  productCode: string;
  orderNo: string;
  goodName: string;
  price: number;
  buyerPhone: string;
  buyerName: string;
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
  const feedbackurl = process.env.PAYAPP_FEEDBACK_URL || `${process.env.PAYAPP_RETURN_URL_BASE}/api/payapp/webhook`;
  const returnurl = `${process.env.PAYAPP_RETURN_URL_BASE}/order/success?orderNo=${params.orderNo}`;

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
  bodyData.append("feedbackurl", feedbackurl);
  bodyData.append("returnurl", returnurl);
  
  // 페이앱 사용자 정의 변수
  bodyData.append("var1", params.orderNo);
  bodyData.append("var2", params.productKind);
  bodyData.append("var3", params.productCode);
  
  // 테스트 가맹점 모드를 위해 100원 결제 등으로 연동할 경우 openpaytype 제한 가능
  bodyData.append("openpaytype", "card"); 

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
        errorMsg: `PayApp API 서버 응답 오류 (Status: ${response.status})`,
      };
    }

    const text = await response.text();
    const result = new URLSearchParams(text);

    const state = result.get("state");
    const errorMessage = result.get("errorMessage");
    const payurl = result.get("payurl");

    if (state === "1" && payurl) {
      return {
        success: true,
        payUrl: payurl,
        raw: Object.fromEntries(result.entries()),
      };
    } else {
      return {
        success: false,
        errorMsg: errorMessage || "결제창 생성 실패 (알 수 없는 오류)",
        raw: Object.fromEntries(result.entries()),
      };
    }
  } catch (error: any) {
    return {
      success: false,
      errorMsg: `PayApp 연동 실패: ${error.message}`,
    };
  }
}

/**
 * Webhook 서명 및 IP 화이트리스트 검증
 */
export function verifyPayAppWebhook(body: Record<string, string>, clientIp: string): { isValid: boolean; reason?: string } {
  // 1. IP 화이트리스트 검증
  const ipWhitelistStr = process.env.PAYAPP_IP_WHITELIST;
  if (ipWhitelistStr) {
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
