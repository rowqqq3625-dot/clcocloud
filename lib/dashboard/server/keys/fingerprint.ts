import { createHash, timingSafeEqual } from 'crypto';

export function fingerprint(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

export function fp16(key: string): string {
  return fingerprint(key).slice(0, 16);
}

export function safeEq(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
}
