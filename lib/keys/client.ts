import "server-only";
import { ApiKeyStatusSchema, ApiKeyStatus } from "./types";

export class ApiKeyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiKeyError";
    this.status = status;
  }
}

// Target upstream endpoint
const API_BASE = "https://api.routermint.com/v1";

/**
 * Enhanced fetch with exponential backoff for 5xx errors
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3, backoff = 300): Promise<Response> {
  try {
    // 10s timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // If 5xx, retry with exponential backoff
    if (response.status >= 500 && retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw new ApiKeyError(502, `Failed after ${retries} attempts: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
  throw new ApiKeyError(502, "Unexpected retry failure");
}

export async function getKeyInfo(apiKey: string): Promise<ApiKeyStatus> {
  const response = await fetchWithRetry(`${API_BASE}/keys/lookup`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key: apiKey }),
  });

  if (!response.ok) {
    throw new ApiKeyError(response.status, `API Error: ${response.statusText}`);
  }

  const data = await response.json();
  
  const parsed = ApiKeyStatusSchema.safeParse(data);
  if (!parsed.success) {
    console.error("API response schema mismatch:", parsed.error);
    throw new ApiKeyError(502, "Malformed response from upstream API");
  }

  return parsed.data;
}
