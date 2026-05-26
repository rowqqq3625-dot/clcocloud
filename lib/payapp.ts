import { URLSearchParams } from "url";
import { supabaseAdmin as supabase } from "./supabase/server";

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
 * Generates an order number in the CLC-YYYYMMDD-NNNN format.
 */
export async function generateOrderNo(): Promise<string> {
  const now = new Date();
  // Format as KST YYYYMMDD
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(now.getTime() + kstOffset);
  const year = kstDate.getUTCFullYear();
  const month = String(kstDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kstDate.getUTCDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;

  const prefix = `CLC-${dateStr}-`;

  if (!supabase) {
    // Fallback if supabase not configured yet
    return `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  // Count existing orders for today to determine NNNN
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .like("order_no", `${prefix}%`);

  const nextNum = (count || 0) + 1;
  const suffix = String(nextNum).padStart(4, "0");

  return `${prefix}${suffix}`;
}

/**
 * PayApp REST payrequest API call
 */
export async function createPayRequest(params: PayAppRequestParams): Promise<PayAppResponse> {
  const userid = process.env.PAYAPP_USERID;
  const linkkey = process.env.PAYAPP_LINKKEY;
  const linkval = process.env.PAYAPP_LINKVAL;
  const feedbackurl = process.env.PAYAPP_FEEDBACK_URL;
  // If in simulation mode, redirect to our simulation page instead
  if (params.buyerName === "김정후" && params.buyerPhone.replace(/[^0-9]/g, "") === "01058503625") {
    const returnUrl = `/order/simulation?orderNo=${params.orderNo}`;
    return {
      success: true,
      payUrl: returnUrl,
      raw: { simulation: true }
    };
  }

  const returnurl = process.env.PAYAPP_RETURN_URL 
    ? `${process.env.PAYAPP_RETURN_URL}?orderNo=${params.orderNo}` 
    : undefined;

  if (!userid || !linkkey || !linkval) {
    return {
      success: false,
      errorMsg: "PayApp configuration environment variables are missing.",
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
  bodyData.append("memo", params.buyerName);
  bodyData.append("pay_memo", `order_no=${params.orderNo}`);
  if (feedbackurl) bodyData.append("feedbackurl", feedbackurl);
  if (returnurl) bodyData.append("returnurl", returnurl);
  bodyData.append("smsuse", "n"); // Do not send payment SMS from PayApp (crucial)

  bodyData.append("var1", params.orderNo);
  bodyData.append("var2", params.productCode);

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
        errorMsg: "API server response error during payment processing.",
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
      return {
        success: false,
        errorMsg: result.get("errorMessage") || "An error occurred while generating the payment window.",
        raw: Object.fromEntries(result.entries()),
      };
    }
  } catch (error: any) {
    console.error("[PayApp createPayRequest] Error:", error);
    return {
      success: false,
      errorMsg: "Failed to communicate with PayApp. Please try again later.",
    };
  }
}

/**
 * verifyLinkval checks if the received linkval matches the expected linkval from env
 */
export function verifyLinkval(received: string): boolean {
  const expectedLinkval = process.env.PAYAPP_LINKVAL;
  if (!expectedLinkval) {
    console.error("[PayApp] PAYAPP_LINKVAL environment variable is not configured.");
    return false;
  }
  return received === expectedLinkval;
}
