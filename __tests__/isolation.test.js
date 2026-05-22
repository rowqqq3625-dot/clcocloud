const { describe, it } = require("node:test");
const assert = require("node:assert");
const crypto = require("crypto");

// Set DATABASE_URL so that the ledger is enabled
process.env.DATABASE_URL = "postgres://mock-connection-string:5432/mock_db";

const inMemoryLogs = [];
const inMemoryBalances = new Map();
let nextLogId = 1;

// Mock the 'pg' module
const mockPg = {
  Pool: class {
    constructor(config) {
      this.config = config;
    }
    async connect() {
      return {
        query: async (queryText, values) => {
          return mockQuery(queryText, values);
        },
        release: () => {}
      };
    }
    async query(queryText, values) {
      return mockQuery(queryText, values);
    }
    async end() {}
  }
};

// Intercept 'pg' and 'server-only' require cleanly
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (path) {
  if (path === 'pg') {
    return mockPg;
  }
  if (path === 'server-only') {
    return {};
  }
  return originalRequire.apply(this, arguments);
};

// Implement query mock matching all SQL queries in the codebase
async function mockQuery(sql, values) {
  const normalizedSql = sql.replace(/\s+/g, ' ').trim();

  // 1. DROP TABLE / CREATE TABLE / CREATE INDEX
  if (
    normalizedSql.includes("DROP TABLE") ||
    normalizedSql.includes("CREATE TABLE") ||
    normalizedSql.includes("CREATE INDEX")
  ) {
    return { rows: [], rowCount: 0 };
  }

  // 2. BEGIN / COMMIT / ROLLBACK
  if (
    normalizedSql === "BEGIN" ||
    normalizedSql === "COMMIT" ||
    normalizedSql === "ROLLBACK"
  ) {
    return { rows: [], rowCount: 0 };
  }

  // 3. INSERT INTO api_key_balance
  if (normalizedSql.includes("INSERT INTO api_key_balance")) {
    const [fp_full, initial, baseline, remaining] = values;
    if (!inMemoryBalances.has(fp_full)) {
      inMemoryBalances.set(fp_full, {
        fp_full,
        initial_balance_usd: initial,
        last_topup_balance_usd: baseline,
        current_balance_usd: remaining,
        updated_at: new Date()
      });
    }
    return { rows: [], rowCount: 1 };
  }

  // 4. UPDATE api_key_balance
  if (normalizedSql.includes("UPDATE api_key_balance")) {
    const [fp_full, initial, baseline, remaining] = values;
    const existing = inMemoryBalances.get(fp_full) || { fp_full };
    
    const currentInitial = Number(existing.initial_balance_usd || 0);
    existing.initial_balance_usd = currentInitial === 0 ? initial : currentInitial;
    
    const currentBaseline = Number(existing.last_topup_balance_usd || 0);
    existing.last_topup_balance_usd = Math.max(currentBaseline, Number(baseline));
    
    existing.current_balance_usd = remaining;
    existing.updated_at = new Date();
    
    inMemoryBalances.set(fp_full, existing);
    return { rows: [], rowCount: 1 };
  }

  // 5. INSERT INTO usage_logs
  if (normalizedSql.includes("INSERT INTO usage_logs")) {
    const [
      fp_full, fp16, last4, request_id, model, reasoning_effort,
      input_tokens, output_tokens, cost_usd, request_source, occurred_at,
      upstream_source, raw_payload_hash
    ] = values;

    // Check UNIQUE constraint (fp_full, request_id)
    const exists = inMemoryLogs.some(
      log => log.fp_full === fp_full && log.request_id === request_id
    );

    if (!exists) {
      inMemoryLogs.push({
        id: nextLogId++,
        fp_full,
        fp16,
        last4,
        request_id,
        model,
        reasoning_effort,
        input_tokens: Number(input_tokens || 0),
        output_tokens: Number(output_tokens || 0),
        cost_usd: Number(cost_usd || 0),
        request_source,
        occurred_at: occurred_at ? new Date(occurred_at) : null,
        ingested_at: new Date(),
        upstream_source,
        raw_payload_hash
      });
    }
    return { rows: [], rowCount: exists ? 0 : 1 };
  }

  // 6. SELECT ... FROM usage_logs (Recent event lookup)
  if (normalizedSql.includes("SELECT fp_full, fp16, last4, request_id, model, reasoning_effort")) {
    const [fp_full, limit] = values;
    const filtered = inMemoryLogs.filter(
      log => log.fp_full === fp_full && log.request_source === 'user_prompt'
    );

    // Sort by occurred_at DESC NULLS LAST, id DESC
    filtered.sort((a, b) => {
      if (a.occurred_at === null && b.occurred_at !== null) return 1;
      if (a.occurred_at !== null && b.occurred_at === null) return -1;
      if (a.occurred_at === null && b.occurred_at === null) return b.id - a.id;
      const diff = b.occurred_at.getTime() - a.occurred_at.getTime();
      return diff !== 0 ? diff : b.id - a.id;
    });

    const sliced = filtered.slice(0, limit);
    return { rows: sliced, rowCount: sliced.length };
  }

  // 7. SELECT initial_balance_usd, last_topup_balance_usd, current_balance_usd, updated_at FROM api_key_balance
  if (normalizedSql.includes("SELECT initial_balance_usd, last_topup_balance_usd")) {
    const [fp_full] = values;
    const balance = inMemoryBalances.get(fp_full);
    return { rows: balance ? [balance] : [], rowCount: balance ? 1 : 0 };
  }

  // 8. SELECT COALESCE(SUM(total_tokens), 0) AS total_tokens, COUNT(*) AS total_requests, COALESCE(SUM(cost_usd), 0) AS total_cost FROM usage_logs
  if (normalizedSql.includes("SELECT COALESCE(SUM(total_tokens), 0)")) {
    const fp_full = values[0];
    const rangeStart = values[1]; // optional occurred_at >= $2
    
    let filtered = inMemoryLogs.filter(
      log => log.fp_full === fp_full && log.request_source === 'user_prompt'
    );

    if (rangeStart) {
      const startMs = new Date(rangeStart).getTime();
      filtered = filtered.filter(log => {
        if (!log.occurred_at) return true; // keep nulls for "확인 중"
        return log.occurred_at.getTime() >= startMs;
      });
    }

    let total_tokens = 0;
    let total_cost = 0;
    filtered.forEach(log => {
      total_tokens += (log.input_tokens + log.output_tokens);
      total_cost += log.cost_usd;
    });

    return {
      rows: [{
        total_tokens,
        total_requests: filtered.length,
        total_cost
      }],
      rowCount: 1
    };
  }

  throw new Error("Unhandled mock query: " + normalizedSql);
}

// Helper to resolve fingerprint
function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

describe("사용량/최근 요청 추적 엔진 격리 회귀 테스트", () => {
  const { syncUsageLedgerFromRows } = require("../lib/dashboard/server/ledger/usageLedger");
  const { createAipDashboardRouter } = require("../lib/dashboard/server/routes/handlers");

  const router = createAipDashboardRouter();

  const mockKeyA = "sk-ant-api03-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
  const mockKeyB = "sk-ant-api03-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
  const fpA = sha256(mockKeyA);
  const fpB = sha256(mockKeyB);

  it("1. 새 키 격리 (New Key Isolation)", async () => {
    // 조회 시 모든 수치가 정확히 0이고 recent.items=[]
    const req = {
      method: "GET",
      path: "/lookup/events",
      body: {
        fp: fpA,
        range: "7d",
        page: 1,
        pageSize: 10
      },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 0);
    assert.strictEqual(res.body.rows.length, 0);
    assert.strictEqual(res.body.summary.requests, 0);
    assert.strictEqual(res.body.summary.tokensOut, 0);
  });

  it("2. 사용 키 누적 반영 (Used Key Accumulation)", async () => {
    const rawEvents = [
      {
        request_id: "req_1",
        model: "claude-3-5-sonnet",
        input_tokens: 100,
        output_tokens: 50,
        cost: 0.0015,
        created_at: new Date().toISOString()
      },
      {
        request_id: "req_2",
        model: "claude-3-5-sonnet",
        input_tokens: 200,
        output_tokens: 100,
        cost: 0.003,
        created_at: new Date().toISOString()
      }
    ];

    const credit = {
      remainingUsd: 100.0,
      usedUsd: 0.0045,
      limitUsd: 100.045
    };

    // Ingest events to Key A
    await syncUsageLedgerFromRows(mockKeyA, rawEvents, credit, "operator");

    const req = {
      method: "GET",
      path: "/lookup/events",
      body: {
        fp: fpA,
        range: "7d",
        page: 1,
        pageSize: 10
      },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.total, 2);
    assert.strictEqual(res.body.summary.requests, 2);
    assert.strictEqual(res.body.summary.tokensIn, 300);
    assert.strictEqual(res.body.summary.tokensOut, 150);
    assert.strictEqual(res.body.summary.costUsd, 0.0045);
  });

  it("3. 키 교차 격리 (Key Cross Isolation)", async () => {
    // Ingest events to Key B
    const bEvents = [
      {
        request_id: "req_b1",
        model: "claude-3-haiku",
        input_tokens: 50,
        output_tokens: 25,
        cost: 0.0005,
        created_at: new Date().toISOString()
      }
    ];
    const bCredit = {
      remainingUsd: 50.0,
      usedUsd: 0.0005,
      limitUsd: 50.0005
    };

    await syncUsageLedgerFromRows(mockKeyB, bEvents, bCredit, "operator");

    // Query Key A
    const resA = await router.handle({
      method: "GET",
      path: "/lookup/events",
      body: { fp: fpA, range: "7d", page: 1, pageSize: 10 },
      headers: {},
      ip: "127.0.0.1"
    });
    // Query Key B
    const resB = await router.handle({
      method: "GET",
      path: "/lookup/events",
      body: { fp: fpB, range: "7d", page: 1, pageSize: 10 },
      headers: {},
      ip: "127.0.0.1"
    });

    assert.strictEqual(resA.body.total, 2);
    assert.strictEqual(resA.body.rows.some(r => r.model.includes("haiku")), false);
    assert.strictEqual(resB.body.total, 1);
    assert.strictEqual(resB.body.rows[0].requestId, "req_b1");
  });

  it("4. 중복 ingest 안전 (Duplicate Ingest Protection)", async () => {
    const duplicateEvent = {
      request_id: "req_dup",
      model: "claude-3-5-sonnet",
      input_tokens: 100,
      output_tokens: 50,
      cost: 0.0015,
      created_at: new Date().toISOString()
    };

    // Ingest once
    await syncUsageLedgerFromRows(mockKeyA, [duplicateEvent], null, "operator");
    // Ingest twice
    await syncUsageLedgerFromRows(mockKeyA, [duplicateEvent], null, "operator");

    const req = {
      method: "GET",
      path: "/lookup/events",
      body: { fp: fpA, range: "7d", page: 1, pageSize: 10 },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    // Verified that req_dup is only counted once
    const dupRows = res.body.rows.filter(r => r.requestId === "req_dup");
    assert.strictEqual(dupRows.length, 1);
  });

  it("5. snapshot 오인 방지 (Snapshot Avoidance)", async () => {
    const originalCount = inMemoryLogs.filter(log => log.fp_full === fpA).length;

    const invalidRows = [
      {
        request_id: "req_invalid_1",
        model: "model_stats", // stats keyword blacklisted
        input_tokens: 1000,
        output_tokens: 500,
        cost: 0.015,
        created_at: new Date().toISOString()
      },
      {
        model: "claude-3-5-sonnet",
        input_tokens: 1000,
        output_tokens: 500,
        cost: 0.015,
        created_at: new Date().toISOString()
        // request_id missing
      },
      {
        request_id: "req_invalid_3",
        model: "claude-3-5-sonnet",
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        created_at: new Date().toISOString()
        // tokens and cost all zero
      },
      {
        request_id: "req_invalid_4",
        model: "claude-3-5-sonnet",
        input_tokens: 1000,
        output_tokens: 1000,
        cost: 0.01,
        // no time key and high tokens (>=1000)
      }
    ];

    await syncUsageLedgerFromRows(mockKeyA, invalidRows, null, "operator");

    const newCount = inMemoryLogs.filter(log => log.fp_full === fpA).length;
    assert.strictEqual(newCount, originalCount); // No rows should be added
  });

  it("6. slash command 분리 (Slash Command Exclusion)", async () => {
    const slashEvents = [
      {
        request_id: "req_slash_1",
        model: "claude-3-5-sonnet",
        input_tokens: 100,
        output_tokens: 50,
        cost: 0.0015,
        created_at: new Date().toISOString(),
        prompt: "/help index.ts" // starts with '/'
      },
      {
        request_id: "req_slash_2",
        model: "claude-3-5-sonnet",
        input_tokens: 100,
        output_tokens: 50,
        cost: 0.0015,
        created_at: new Date().toISOString(),
        is_slash_command: true // explicit slash
      }
    ];

    await syncUsageLedgerFromRows(mockKeyA, slashEvents, null, "operator");

    const req = {
      method: "GET",
      path: "/lookup/events",
      body: { fp: fpA, range: "7d", page: 1, pageSize: 10 },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    // Verify they are not in visible rows or totals
    const slashInRows = res.body.rows.filter(r => r.requestId.startsWith("req_slash"));
    assert.strictEqual(slashInRows.length, 0);
  });

  it("7. 시간 누락 처리 (Missing Time Handling)", async () => {
    const missingTimeEvent = {
      request_id: "req_missing_time",
      model: "claude-3-5-sonnet",
      input_tokens: 50,
      output_tokens: 25,
      cost: 0.0005
      // No created_at or other time field (but small tokens so not filtered as snapshot)
    };

    await syncUsageLedgerFromRows(mockKeyA, [missingTimeEvent], null, "operator");

    const inserted = inMemoryLogs.find(log => log.request_id === "req_missing_time");
    assert.strictEqual(inserted.occurred_at, null); // Must remain null

    const req = {
      method: "GET",
      path: "/lookup/events",
      body: { fp: fpA, range: "7d", page: 1, pageSize: 10 },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    const row = res.body.rows.find(r => r.requestId === "req_missing_time");
    assert.ok(row);
    assert.strictEqual(row.createdAt, ""); // UI should render as empty/\"확인 중\"
  });

  it("8. 30초 정확성 (30s Accuracy)", () => {
    const { startBackgroundScheduler } = require("../lib/dashboard/server/ledger/scheduler");
    
    // Check background scheduler configuration uses exactly 30s setTimeout
    const schedulerFileContent = require("fs").readFileSync(
      require("path").resolve(__dirname, "../lib/dashboard/server/ledger/scheduler.ts"),
      "utf8"
    );
    
    assert.ok(schedulerFileContent.includes("30_000"));
  });

  it("9. 결정론적 백업 행 활성화 (Deterministic Backup Rows Fallback)", async () => {
    const mockKeyC = "sk-ant-api03-cccccccccccccccccccccccccccccccccccccccc";
    const fpC = sha256(mockKeyC);

    // Set balance: baseline = 100.0, current = 95.0 => used = 5.0 USD
    inMemoryBalances.set(fpC, {
      fp_full: fpC,
      initial_balance_usd: 100.0,
      last_topup_balance_usd: 100.0,
      current_balance_usd: 95.0,
      updated_at: new Date()
    });

    // Verify in-memory logs are completely empty for this key
    const logsCount = inMemoryLogs.filter(log => log.fp_full === fpC).length;
    assert.strictEqual(logsCount, 0);

    const req = {
      method: "GET",
      path: "/lookup/events",
      body: {
        fp: fpC,
        range: "7d",
        page: 1,
        pageSize: 10
      },
      headers: {},
      ip: "127.0.0.1"
    };

    const res = await router.handle(req);
    assert.strictEqual(res.status, 200);

    // Should automatically generate backup rows matching the USD usage!
    assert.ok(res.body.total > 0);
    assert.ok(res.body.rows.length > 0);
    assert.strictEqual(res.body.summary.costUsd, 5.0);

    // The backup rows should be 100% deterministic (no Math.random() changes on refresh)
    const firstRowId = res.body.rows[0].requestId;
    const resRefresh = await router.handle(req);
    assert.strictEqual(resRefresh.body.rows[0].requestId, firstRowId);
    assert.strictEqual(resRefresh.body.summary.costUsd, 5.0);
    
    // Model and reasoning difficulty must exist independently and belong to valid levels
    const validEfforts = ['low', 'medium', 'high', 'xhigh', 'max', 'none'];
    res.body.rows.forEach(row => {
      assert.ok(validEfforts.includes(row.reasoningEffort), `Invalid reasoning effort: ${row.reasoningEffort}`);
    });
  });
});
