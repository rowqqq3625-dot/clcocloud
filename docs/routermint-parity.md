# RouterMint Dashboard Parity Verification

## Test Configuration
- **Strategy Used**: PATH D (API Mirror)
- **Test Date**: 2026-04-29
- **Key Used**: `ROUTERMINT_TEST_KEY` (masked: `rm_0f17a59906ce...`)

## Field Parity Matrix
| Field | RouterMint Original | ClkoCloud Embed (Path D) | Status | Resolution / Notes |
|-------|---------------------|--------------------------|--------|---------------------|
| Key Prefix | rm_0f17a59906ce | rm_0f17a59906ce | ✅ Match | Exact match parsed from JSON |
| Status Badge | ACTIVE (green) | ACTIVE (green) | ✅ Match | Mapped active status to bg-green-100 |
| Balance | $8.135488 | $8.135488 | ✅ Match | Intl.NumberFormat(en-US, USD) 6-digit |
| Spend Cap | 무제한 (null) | 무제한 | ✅ Match | Handled null as unlimited |
| RPM Cap | 60 | 60 | ✅ Match | |
| Allowed Models | N/A (Empty) | N/A (Empty/Hidden) | ✅ Match | Component hides section if empty |
| Recent Requests (When) | 2026-04-27 14:34:26 | 2026-04-27 14:34:26 | ✅ Match | Parsed via date-fns formatDateTime |
| Recent Requests (Model)| anthropic/claude-sonnet-4-6 | anthropic/claude-sonnet-4-6 | ✅ Match | |
| Recent Requests (Tokens)| 24,438 | 24,438 | ✅ Match | formatNumber with commas |
| Recent Requests (Latency)| 3333ms | 3333ms | ✅ Match | |
| Recent Requests (Cost)| $0.110133 | $0.110133 | ✅ Match | |
| Recent Requests (HTTP)| 200 (green) | 200 (green) | ✅ Match | 2xx logic maps to green pill |
| Live Polling | Yes | Yes (5s) | ✅ Match | Handled via SWR refreshInterval |
| Pause on Hidden Tab | Yes | Yes | ✅ Match | `document.visibilityState` + Pause Icon |

## Verification Results
**Parity Achieved**: Yes. Every field matches byte-for-byte and updates on the same polling cadence.

## Known Risks & Mitigations
- **Risk**: RouterMint changes the `/v1/keys/lookup` schema or URL.
- **Mitigation**: We mapped all fields through `zod` schemas in `lib/routermint/types.ts`. Any missing fields will be caught. A schema change only requires updating that one file and the UI mapping.
