# 클코클라우드 Apple급 마케팅 페이지

Next.js 14 App Router 기반의 클코클라우드 판매 페이지입니다. 페이지는 13개 시퀀스로 구성되어 있으며, `Apple 구조 + Anthropic 톤`을 기준으로 3D API 카드, sticky dashboard, horizontal compare, count-up, FAQ accordion을 포함합니다.

## 이미지 자산 슬롯

- `public/images/workspace-dark.avif`: `Sequence07PhotoBreak`의 풀블리드 작업공간 사진
- `public/images/beige-macro.avif`: `Sequence10TextureBreak`의 베이지 매크로 텍스처
- `public/images/dashboard-blur.webp`: `StickyDashboard`의 대시보드 fallback/placeholder 슬롯
- `public/images/api-card-fallback.webp`: `FloatingApiCard` 모바일 fallback 슬롯
- `public/images/og-clcocloud.webp`: `app/layout.tsx` Open Graph 이미지

현재 이미지는 기존 배포 자산에서 만든 placeholder입니다. 실제 런칭 전 GPT-Image-2 또는 촬영 자산으로 교체해야 합니다.

## 진짜 데이터로 교체할 placeholder

- 대시보드 샘플 잔액, usage, token, 최근 요청 10건
- 실제 지원 모델명과 모델별 제한
- 가격 카드 CTA의 실제 결제 링크
- 로그인 링크
- 디스코드/문의 채널 링크
- 이용약관/개인정보처리방침/환불정책 링크

## 다음 단계 To-Do

- 결제 링크 또는 결제 API 연동
- Supabase 또는 별도 DB로 API 키 발급/잔액/사용량 스키마 설계
- 실제 대시보드 데이터 연동
- 실제 이미지 5장 교체 및 `next/image` blur placeholder 생성
- Lighthouse 기준 Performance 92+, Accessibility 100 검수
