const { describe, it } = require("node:test");
const assert = require("node:assert");

// Mock environment variables temporarily
const originalEnv = { ...process.env };

function restoreEnv() {
  process.env = { ...originalEnv };
}

describe("PayApp Unit Tests", () => {
  // We can load payapp.ts directly using ts-node or compile on the fly.
  // Since Next.js uses standard imports, we can mock/require the transpiled code if available,
  // or test the logic dynamically by implementing a lightweight check of our verifyPayAppWebhook.
  // Let's dynamically load verifyPayAppWebhook.
  
  // Register ts-node on the fly if needed, or transpiled code.
  // Next.js files can be transpiled using typescript.
  // To avoid transpilation complexity in plain node, we can mock the loader or simply read/evaluate.
  // But wait! We can just require the compiled js if we compile it,
  // or use `ts-node` which is usually globally available or inside next.js ts config.
  // Let's check if we can require it using a simple dynamic wrapper or register ts-node.
  
  // Let's implement dynamic import via ts-node register or mock testing of the function.
  try {
    require("ts-node").register();
  } catch (e) {
    // Fallback if ts-node is not installed
  }

  const { verifyPayAppWebhook } = require("../lib/payapp.ts");

  it("1. verifyPayAppWebhook - IP Whitelist Empty Case (Pass all IPs)", () => {
    restoreEnv();
    process.env.PAYAPP_USERID = "pgdk4983";
    process.env.PAYAPP_LINKVAL = "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM=";
    process.env.PAYAPP_IP_WHITELIST = ""; // Empty whitelist

    const body = {
      userid: "pgdk4983",
      linkval: "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM="
    };

    const result = verifyPayAppWebhook(body, "99.99.99.99");
    assert.strictEqual(result.isValid, true);
  });

  it("2. verifyPayAppWebhook - IP Whitelist Configured Case (Block invalid IPs)", () => {
    restoreEnv();
    process.env.PAYAPP_USERID = "pgdk4983";
    process.env.PAYAPP_LINKVAL = "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM=";
    process.env.PAYAPP_IP_WHITELIST = "1.2.3.4, 5.6.7.8";

    const body = {
      userid: "pgdk4983",
      linkval: "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM="
    };

    // Valid IP
    const validResult = verifyPayAppWebhook(body, "1.2.3.4");
    assert.strictEqual(validResult.isValid, true);

    // Invalid IP
    const invalidResult = verifyPayAppWebhook(body, "99.99.99.99");
    assert.strictEqual(invalidResult.isValid, false);
    assert.ok(invalidResult.reason.includes("허용되지 않은 IP"));
  });

  it("3. verifyPayAppWebhook - Linkval / Userid Mismatch Case", () => {
    restoreEnv();
    process.env.PAYAPP_USERID = "pgdk4983";
    process.env.PAYAPP_LINKVAL = "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM=";
    process.env.PAYAPP_IP_WHITELIST = "";

    // Mismatched Linkval
    const bodyBadLinkval = {
      userid: "pgdk4983",
      linkval: "WRONG_LINKVAL"
    };
    const badLinkvalResult = verifyPayAppWebhook(bodyBadLinkval, "1.2.3.4");
    assert.strictEqual(badLinkvalResult.isValid, false);

    // Mismatched Userid
    const bodyBadUserid = {
      userid: "WRONG_USERID",
      linkval: "Q4EMxZJXPXxsB38DlsqM8NkcPsXo4ZWP67QwRDWvVRM="
    };
    const badUseridResult = verifyPayAppWebhook(bodyBadUserid, "1.2.3.4");
    assert.strictEqual(badUseridResult.isValid, false);
  });

  it("4. createPayAppPayment - Missing Environment Variables Error Case", async () => {
    const { createPayAppPayment } = require("../lib/payapp.ts");
    restoreEnv();
    delete process.env.PAYAPP_USERID; // Remove userid

    const params = {
      productKind: "balance",
      productCode: "STANDARD",
      orderNo: "CLC-20260523-0001",
      goodName: "Standard Plan",
      price: 1000,
      buyerPhone: "01012345678",
      buyerName: "Test Buyer"
    };

    const res = await createPayAppPayment(params);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.errorMsg, "PayApp 설정 환경변수가 누락되었습니다.");
    
    restoreEnv();
  });
});
