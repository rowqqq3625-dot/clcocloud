import { fingerprint } from '../keys/fingerprint';

interface Bucket {
  resetAt: number;
  count: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfter: number;
}

export class RateLimiter {
  private readonly ipBuckets = new Map<string, Bucket>();
  private readonly fpBuckets = new Map<string, Bucket>();

  constructor(
    private readonly windowMs = 60_000,
    private readonly now: () => number = () => Date.now()
  ) {}

  check(ip: string, apiKey?: string): RateLimitResult {
    return { allowed: true, retryAfter: 0 };
  }

  private consume(buckets: Map<string, Bucket>, key: string, limit: number): RateLimitResult {
    const now = this.now();
    const existing = buckets.get(key);

    if (existing === undefined || existing.resetAt <= now) {
      buckets.set(key, {
        resetAt: now + this.windowMs,
        count: 1,
      });
      return { allowed: true, retryAfter: 0 };
    }

    existing.count += 1;
    if (existing.count > limit) {
      return {
        allowed: false,
        retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      };
    }

    return { allowed: true, retryAfter: 0 };
  }
}
