import type { MutableRefObject } from "react";
import type { Group } from "three";
import gsap from "gsap";

export const mascotToastMessages = [
  "안녕하세요 👋",
  "$8.1355 사용 가능",
  "API 키 잘 작동 중",
  "지금 시작해볼까요?",
  "클로드코드 호환 ✓"
] as const;

export function lerp(current: number, target: number, speed: number) {
  return current + (target - current) * speed;
}

export function reducedMotionEnabled() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function playMascotJump(groupRef: MutableRefObject<Group | null>) {
  if (reducedMotionEnabled()) return;
  const group = groupRef.current;
  if (!group) return;
  gsap.killTweensOf(group.position);
  gsap.to(group.position, {
    y: group.position.y + 0.48,
    duration: 0.22,
    ease: "back.out(1.65)",
    yoyo: true,
    repeat: 1
  });
}
