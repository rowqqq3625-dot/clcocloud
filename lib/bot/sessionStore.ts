import { ChatMessage } from "./client";

export interface MessageWithTime {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string; // ISO string or simple time format
  image?: string; // Optional image attachment base64/URL
  isError?: boolean;
}

const STORAGE_KEY = "clco_bot_messages";

export function loadSessionMessages(): MessageWithTime[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessionMessages(messages: MessageWithTime[]): void {
  if (typeof window === "undefined") return;
  try {
    // Limit to latest 30 messages for memory safety
    const sliced = messages.slice(-30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
  } catch {
    // Ignore
  }
}

export function clearSessionMessages(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
