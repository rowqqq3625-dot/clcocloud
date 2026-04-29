const { describe, it, mock } = require("node:test");
const assert = require("node:assert");

// We need to mock global fetch before requiring the client
const originalFetch = global.fetch;

describe("RouterMint Client", async () => {
  let client;

  it("handles 200 OK and validates schema", async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        valid: true,
        prefix: "rm_live_xyz",
        status: "active",
        rateLimitRpm: 60,
        monthlySpendCapUsd: null,
        allowedModels: [],
        balanceUsd: 10.5,
      })
    });
    
    // Lazy require to ensure fetch mock is active
    client = require("../../lib/routermint/client");
    
    const result = await client.getKeyInfo("test_key");
    assert.strictEqual(result.balanceUsd, 10.5);
  });

  it("handles 401 Unauthorized", async () => {
    global.fetch = async () => ({
      ok: false,
      status: 401,
      statusText: "Unauthorized"
    });
    
    client = require("../../lib/routermint/client");
    
    try {
      await client.getKeyInfo("invalid_key");
      assert.fail("Should have thrown");
    } catch (err) {
      assert.strictEqual(err.status, 401);
    }
  });

  it("handles malformed JSON response as 502", async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        // missing required fields
        random_field: 123
      })
    });
    
    client = require("../../lib/routermint/client");
    
    try {
      await client.getKeyInfo("test_key");
      assert.fail("Should have thrown");
    } catch (err) {
      assert.strictEqual(err.status, 502);
      assert.strictEqual(err.message, "Malformed response from RouterMint API");
    }
  });

  it("restores fetch", () => {
    global.fetch = originalFetch;
  });
});
