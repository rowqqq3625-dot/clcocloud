import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const envKey = process.env.API_KEY_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("API_KEY_ENCRYPTION_KEY environment variable is not set.");
  }
  
  try {
    const key = Buffer.from(envKey, "base64");
    if (key.length !== 32) {
      throw new Error("Decoded API_KEY_ENCRYPTION_KEY must be exactly 32 bytes.");
    }
    return key;
  } catch (err: any) {
    throw new Error(`Failed to parse API_KEY_ENCRYPTION_KEY as base64: ${err.message}`);
  }
}

export function encryptKey(rawKey: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(rawKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const tag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:tag:encryptedText
  return `${iv.toString("hex")}:${tag}:${encrypted}`;
}

export function decryptKey(encryptedPayload: string): string {
  const key = getEncryptionKey();
  const [ivHex, tagHex, encryptedHex] = encryptedPayload.split(":");
  
  if (!ivHex || !tagHex || !encryptedHex) {
    throw new Error("Invalid encrypted API key format.");
  }
  
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const encryptedText = Buffer.from(encryptedHex, "hex");
  
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}
