-- Drop foreign key references to orders if any, or drop tables to recreate them cleanly.
DROP TABLE IF EXISTS public.alimtalk_logs CASCADE;
DROP TABLE IF EXISTS public.issued_api_keys CASCADE;
DROP TABLE IF EXISTS public.api_key_inventory CASCADE;
DROP TABLE IF EXISTS public.topup_inquiries CASCADE;
DROP TABLE IF EXISTS public.bundle_products CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 1. 주문 테이블 (잔액형 + 번들 통합 + 기존 컬럼 호환)
CREATE TABLE public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        text UNIQUE NOT NULL,             -- 'CLC-20260522-0001'
  product_kind    text NOT NULL,                    -- 'balance' | 'bundle' | 'topup_custom'
  product_code    text NOT NULL,                    -- 'STANDARD'|'PRO'|'ULTRA'|'BUNDLE_GEMINI'|...
  amount          int  NOT null,                    -- 결제금액(원)
  buyer_name      text NOT null,
  buyer_phone     text NOT null,                    -- 알림톡 발송용
  status          text NOT null DEFAULT 'pending',  -- pending|paid|paid_pending_key|failed|cancelled|refunded
  payapp_mul_no   text,
  pay_method      text,
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),

  -- 마이페이지 및 기존 연동용 호환 컬럼
  user_provider   text,
  user_provider_account_id text,
  user_email      text,
  contact_email   text,
  os_targets      text[]
);
CREATE INDEX idx_orders_status_created_at ON public.orders (status, created_at DESC);

-- 2. API 키 인벤토리 테이블
CREATE TABLE public.api_key_inventory (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fp_full           char(64) UNIQUE NOT null,
  fp16              char(16) NOT null,
  last4             char(4)  NOT null,
  raw_key_encrypted text NOT null,                  -- AES-256-GCM 암호화
  initial_balance   numeric(12,6) NOT null,
  product_code      text NOT null,                  -- 'STANDARD'|'PRO'|'ULTRA'|'CUSTOM'|'BUNDLE_*'
  status            text NOT null DEFAULT 'available', -- available | reserved | issued | revoked
  reserved_at       timestamptz,
  reserved_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  issued_at         timestamptz,
  issued_order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now()
);
CREATE INDEX idx_api_key_inv_code_status ON public.api_key_inventory (product_code, status);

-- 3. 발급된 API 키 매핑 테이블
CREATE TABLE public.issued_api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  inventory_id    uuid REFERENCES public.api_key_inventory(id) ON DELETE SET NULL,
  fp_full         char(64) NOT null,
  fp16            char(16) NOT null,
  last4           char(4)  NOT null,
  initial_balance numeric(12,6) NOT null,
  issued_at       timestamptz DEFAULT now()
);

-- 4. AI플랜 번들 상품 테이블
CREATE TABLE public.bundle_products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code      text UNIQUE NOT null,           -- 'BUNDLE_GEMINI'|'BUNDLE_GPT'|'BUNDLE_PERPLEXITY'
  display_name      text NOT null,                  -- '클코클라우드 × Gemini'
  ai_partner        text NOT null,                  -- 'gemini'|'gpt'|'perplexity'
  description       text,
  period_months     int,                            -- null이면 '준비 중'
  included_balance  numeric(12,6),                  -- 결합되는 잔액
  price_krw         int,                            -- null이면 '준비 중'
  original_price_krw int,                           -- strikethrough 표시용
  is_featured       boolean DEFAULT false,
  is_active         boolean DEFAULT true,
  sort_order        int DEFAULT 0,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- 5. 잔액충전 문의 테이블
CREATE TABLE public.topup_inquiries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_no      text UNIQUE NOT null,             -- 'INQ-20260522-0001'
  desired_usd     int  NOT null,                    -- 1000~5000, step 100
  amount_krw      int  NOT null,                    -- desired_usd * 400
  buyer_name      text NOT null,
  buyer_phone     text NOT null,
  memo            text,
  status          text NOT null DEFAULT 'open',     -- open|contacted|completed|closed
  created_at      timestamptz DEFAULT now()
);

-- 6. 알림톡 발송 로그 테이블
CREATE TABLE public.alimtalk_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  inquiry_id      uuid REFERENCES public.topup_inquiries(id) ON DELETE SET NULL,
  template_code   text NOT null,
  recipient       text NOT null,                    -- 'buyer' | 'operator'
  phone           text NOT null,
  payload         jsonb,
  result          text,                             -- 'success'|'failed'
  barti_message_id text,
  sent_at         timestamptz DEFAULT now()
);

-- 7. 리뷰 테이블 재정의 (foreign key 참조용)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT null REFERENCES public.orders(id) ON DELETE CASCADE,
  user_provider text NOT null,
  user_provider_account_id text NOT null,
  rating integer NOT null CHECK (rating BETWEEN 1 AND 5),
  body text NOT null CHECK (char_length(body) BETWEEN 10 AND 600),
  display_name text NOT null CHECK (char_length(display_name) BETWEEN 1 AND 40),
  masked_name text NOT null,
  status text NOT null DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  bonus_status text NOT null DEFAULT 'pending' CHECK (bonus_status IN ('none', 'pending', 'paid')),
  created_at timestamptz NOT null DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(order_id)
);

-- Row Level Security (RLS) 설정
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alimtalk_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 서비스 역할(service_role)에 전체 읽기/쓰기 권한 부여
CREATE POLICY service_role_all_policy ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.api_key_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.issued_api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.bundle_products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.topup_inquiries FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.alimtalk_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_policy ON public.reviews FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 일반 로그인 사용자 조회용 RLS 정책 추가 (마이페이지 및 세션 조회 연동)
CREATE POLICY select_own_orders ON public.orders FOR SELECT TO authenticated
  USING (user_provider = auth.jwt() ->> 'sub' OR user_provider_account_id = auth.jwt() ->> 'sub');
CREATE POLICY select_own_reviews ON public.reviews FOR SELECT TO authenticated
  USING (user_provider = auth.jwt() ->> 'sub' OR user_provider_account_id = auth.jwt() ->> 'sub');

-- 8. API 키 인벤토리 예약 plpgsql 함수
CREATE OR REPLACE FUNCTION public.reserve_api_key(p_product_code text, p_order_id uuid)
RETURNS uuid AS $$
DECLARE
  v_key_id uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.reserve_api_key_v2(p_product_code text, p_order_id uuid)
RETURNS uuid AS $$
DECLARE
  v_key_id uuid;
BEGIN
  SELECT id INTO v_key_id
  FROM public.api_key_inventory
  WHERE product_code = p_product_code AND status = 'available'
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_key_id IS NOT NULL THEN
    UPDATE public.api_key_inventory
    SET status = 'reserved',
        reserved_order_id = p_order_id,
        reserved_at = now()
    WHERE id = v_key_id;
  END IF;

  RETURN v_key_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. API 키 인벤토리 해제 plpgsql 함수
CREATE OR REPLACE FUNCTION public.release_api_key(p_order_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.api_key_inventory
  SET status = 'available',
      reserved_order_id = null,
      reserved_at = null
  WHERE reserved_order_id = p_order_id AND status = 'reserved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. API 키 인벤토리 발급 plpgsql 함수
CREATE OR REPLACE FUNCTION public.issue_api_key(p_order_id uuid)
RETURNS TABLE (
  inventory_id uuid,
  fp_full char(64),
  fp16 char(16),
  last4 char(4),
  initial_balance numeric(12,6)
) AS $$
DECLARE
  v_inventory_id uuid;
  v_fp_full char(64);
  v_fp16 char(16);
  v_last4 char(4);
  v_initial_balance numeric(12,6);
BEGIN
  SELECT id, fp_full, fp16, last4, initial_balance 
  INTO v_inventory_id, v_fp_full, v_fp16, v_last4, v_initial_balance
  FROM public.api_key_inventory
  WHERE reserved_order_id = p_order_id AND status = 'reserved'
  LIMIT 1
  FOR UPDATE;

  IF v_inventory_id IS NOT NULL THEN
    UPDATE public.api_key_inventory
    SET status = 'issued',
        issued_order_id = p_order_id,
        issued_at = now()
    WHERE id = v_inventory_id;

    INSERT INTO public.issued_api_keys (order_id, inventory_id, fp_full, fp16, last4, initial_balance)
    VALUES (p_order_id, v_inventory_id, v_fp_full, v_fp16, v_last4, v_initial_balance);
  END IF;

  RETURN QUERY 
  SELECT v_inventory_id, v_fp_full, v_fp16, v_last4, v_initial_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

