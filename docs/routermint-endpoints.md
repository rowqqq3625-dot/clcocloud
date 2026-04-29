# RouterMint Endpoints Capture

## Captured Endpoint
**Method**: `POST`
**URL**: `https://api.routermint.com/v1/keys/lookup`
**Headers**: `Authorization: Bearer <API_KEY>`
**Body**: *(Empty or not strictly required based on capture, but usually empty POST or `{}`)*
**Polling Cadence**: The script observed the initial call. Based on standard implementations, polling should be every 5s-10s.

## Response Schema & UI Mapping
```json
{
  "valid": true,
  "accountKind": "prepaid",
  "name": "Prepaid API access",
  "prefix": "rm_0f17a59906ce",                // UI: Key Prefix Indicator
  "status": "active",                         // UI: Status Badge
  "rateLimitRpm": 60,                         // UI: RPM Cap
  "monthlySpendCapUsd": null,                 // UI: Spend Cap Remaining
  "allowedModels": [],                        // UI: Allowed Models List
  "createdAt": "2026-04-19T13:01:21.703Z",
  "lastUsedAt": "2026-04-27T14:34:26.451Z",
  "expiresAt": null,
  "balanceUsd": 8.135488,                     // UI: Balance
  "lifetimeConsumedUsd": 487.361551,
  "stats": {
    "totalCostUsd": 487.361552,
    "totalRequests": 755,
    "totalTokens": 95714842,
    "last7dCostUsd": 0.967541,
    "last7dRequests": 23,
    "last7dTokens": 213477
  },
  "recentRequests": [                         // UI: Recent Requests Table
    {
      "requestId": "eefdc706-234f-4a59-b37f-2e59f5298802",
      "requestedModel": "anthropic/claude-sonnet-4-6", // UI Table: Model
      "totalTokens": 24438,                            // UI Table: Tokens
      "costUsd": 0.110133,                             // UI Table: Cost
      "latencyMs": 3333,                               // UI Table: Latency
      "statusCode": 200,                               // UI Table: HTTP Status
      "createdAt": "2026-04-27T14:34:26.590Z"          // UI Table: When
    }
  ]
}
```

## UI Element Mapping
- **Balance**: `balanceUsd`
- **Spend Cap Remaining**: `monthlySpendCapUsd`
- **RPM Cap**: `rateLimitRpm`
- **Allowed Models List**: `allowedModels`
- **Key Prefix Indicator**: `prefix`
- **Status Badge**: `status`
- **Recent Requests Table**: Mapped from `recentRequests` array.

## Implementation Details
Since this is a `POST` request to `/v1/keys/lookup`, our proxy route `/api/routermint/key-status` will forward the provided API key as the `Authorization: Bearer` header to this endpoint. The response will be directly parsed and returned to the client.
