"use client";

interface RecentChatsProps {
  onSelectSession: (sessionId: string) => void;
}

export function RecentChats({ onSelectSession }: RecentChatsProps) {
  // 사용자의 요구사항에 따라 최근 대화 목록 UI는 노출하지 않습니다.
  return null;
}
