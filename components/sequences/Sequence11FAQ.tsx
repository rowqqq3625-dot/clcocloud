"use client";

import { motion } from "framer-motion";
import { AccordionFaq } from "@/components/ui/AccordionFaq";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";

const faqs: ReadonlyArray<readonly [string, string]> = [
  ["공식 클로드코드와 호환되나요?", "클로드코드 CLI, VS Code, Cursor, Open Code 등 커스텀 엔드포인트를 지원하는 클라이언트에서\n\nAPI 키를 설정하여 사용할 수 있습니다."],
  ["API 키는 바로 발급되나요?", "현재는 자동 실시간 발송이 아니라 주문 확인 후 수동 발급됩니다.\n\n결제 확인 후 API 키를 빠르게 전달합니다."],
  ["잔액은 만료되나요?", "잔액이 남아있는 동안 기간 만료 없이 사용할 수 있도록 운영합니다.\n\n외부 API 제공 정책 변경 시 사전 안내합니다."],
  ["환불 정책이 어떻게 되나요?", "API 키가 사용 불가로 판단될 경우 교체 또는 환불을 지원합니다.\n\nAPI 키 발급 후 잔액을 일부라도 사용한 경우 환불이 불가합니다."],
  ["Anthropic 공식 서비스인가요?", "클코클라우드는 Anthropic 공식 서비스가 아닙니다.\n\n공식 클로드코드와 호환되는 별도 API 키 발급/잔액 관리 서비스입니다."],
  ["일일 제한이나 채팅 대기가 있나요?", "구독형 서비스의 채팅 대기나 일일 메시지 제한과 다른 구조입니다.\n\n실제 잔액과 키 상태에 따라 API 사용량이 관리됩니다."],
  ["어떤 모델을 사용할 수 있나요?", "현재 페이지의 샘플 모델은 sonnet, opus, haiku 계열입니다.\n\n실제 지원 모델 범위는 발급 시점 정책에 따라 안내합니다."],
  ["결제 방식은 무엇인가요?", "월 구독이 아니라 1회성 충전 방식입니다.\n\n원하는 잔액 플랜을 결제하고 잔액이 남아있는 동안 계속 사용합니다."]
];

export function Sequence11FAQ() {
  return (
    <section id="faq" className="bg-cream py-32">
      <div className="container-cinematic max-w-5xl">
        <SplitHeading
          as="h2"
          className="section-display text-[clamp(48px,6vw,88px)] font-semibold"
          lines={["구매 전에", "필요한 답만 명확하게."]}
        />
        <AccordionFaq items={faqs} />
      </div>
    </section>
  );
}
