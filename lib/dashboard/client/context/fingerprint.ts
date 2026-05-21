export async function fingerprintForCache(key: string): Promise<string> {
  const input = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', input);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
