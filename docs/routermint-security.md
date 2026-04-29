# RouterMint Embed Security Verification

## Data Path & Storage Analysis

1. **Local Storage / Session Storage**
   - **Verification**: The `ApiKeyInput` component manages the `apiKey` strictly within React state (`useState`). It is never written to `localStorage` or `sessionStorage`.
   - **Status**: Secure. The key vanishes upon page refresh, mirroring RouterMint's ephemeral design.

2. **Server Logs**
   - **Verification**: The `/api/routermint/key-status` Next.js route parses the `apiKey` from the JSON body and injects it into the `Authorization` header. `console.error` logs only print generic server errors or schema mismatches, never the raw key.
   - **Status**: Secure.

3. **CORS / Browser-Side Exposure**
   - **Verification**: Strategy B (API Mirror) was selected. The browser never makes a direct cross-origin request to `api.routermint.com`. This ensures the key is not intercepted by rogue extensions or exposed in cross-origin preflight logs.
   - **Status**: Secure.

4. **Error Handling Leakage**
   - **Verification**: Upstream 5xx/4xx errors are caught by `client.ts` and normalized into `RouterMintError`. The proxy route returns generic, sanitized JSON `{ error: "message" }`. Raw upstream stack traces are stripped.
   - **Status**: Secure.

5. **Rate Limiting Protection**
   - **Verification**: The proxy route implements an IP-based rate limit of 30 requests per minute. This prevents malicious actors from brute-forcing or abusing our server as an open RouterMint validation endpoint.
   - **Status**: Secure.

## Conclusion
The embedding mechanism safely proxies the API key, fulfilling the requirement: "single read-only lookup, not stored in this browser, never leaked."
