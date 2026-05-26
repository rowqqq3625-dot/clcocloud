-- Drop existing tables to recreate them cleanly with the required schema
DROP TABLE IF EXISTS public.notification_logs CASCADE;
DROP TABLE IF EXISTS public.issued_api_keys CASCADE;
DROP TABLE IF EXISTS public.api_key_inventory CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- 1. Orders table
CREATE TABLE public.orders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        text UNIQUE NOT NULL,
  product_code    text NOT NULL,
  buyer_name      text NOT NULL,
  buyer_phone     text NOT NULL,
  amount          int NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'paid_pending_key', 'failed', 'refunded')),
  payapp_mul_no   text UNIQUE, -- UNIQUE constraint required for PG webhook idempotency
  issued_key_id   uuid,
  paid_at         timestamptz,
  created_at      timestamptz DEFAULT now(),

  -- Backward compatibility columns
  product_kind    text,
  user_provider   text,
  user_provider_account_id text,
  user_email      text,
  contact_email   text,
  os_targets      text[],
  pay_method      text
);

CREATE INDEX idx_orders_order_no ON public.orders (order_no);
CREATE INDEX idx_orders_status ON public.orders (status);

-- 2. API Key Inventory table
CREATE TABLE public.api_key_inventory (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code      text NOT NULL,
  key_value         text NOT NULL,
  status            text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'issued', 'revoked')),
  issued_at         timestamptz,
  issued_order_no   text REFERENCES public.orders(order_no) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now(),

  -- Backward compatibility columns
  fp_full           char(64),
  fp16              char(16),
  last4             char(4),
  raw_key_encrypted text,
  initial_balance   numeric(12,6),
  reserved_at       timestamptz,
  reserved_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  issued_order_id   uuid REFERENCES public.orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_api_key_inv_code_status ON public.api_key_inventory (product_code, status);

-- Update orders reference constraint for issued_key_id
ALTER TABLE public.orders ADD CONSTRAINT fk_orders_issued_key FOREIGN KEY (issued_key_id) REFERENCES public.api_key_inventory(id) ON DELETE SET NULL;

-- 3. Issued API Keys mapping table
CREATE TABLE public.issued_api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        text NOT NULL REFERENCES public.orders(order_no) ON DELETE CASCADE,
  key_id          uuid NOT NULL REFERENCES public.api_key_inventory(id) ON DELETE SET NULL,
  issued_at       timestamptz DEFAULT now()
);

-- 4. Notification Logs table
CREATE TABLE public.notification_logs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no        text NOT NULL REFERENCES public.orders(order_no) ON DELETE CASCADE,
  type            text NOT NULL CHECK (type IN ('PAY_DONE_KEY_DELIVERY', 'ADMIN_PAY_DONE', 'ADMIN_LOW_STOCK', 'PAY_FAIL_LOGGED')),
  ok              boolean NOT NULL,
  status_code     int,
  response_body   text, -- Truncated to 500 characters
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_notification_logs_order_no_type ON public.notification_logs (order_no, type);

-- Row Level Security (RLS) policies
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issued_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow full access to service_role (backend server operations)
CREATE POLICY service_role_all_orders ON public.orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_inventory ON public.api_key_inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_issued ON public.issued_api_keys FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all_notification ON public.notification_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated users to view their own orders
CREATE POLICY select_own_orders ON public.orders FOR SELECT TO authenticated
  USING (user_provider = auth.jwt() ->> 'sub' OR user_provider_account_id = auth.jwt() ->> 'sub');

-- 5. API Key Inventory reservation function
CREATE OR REPLACE FUNCTION public.reserve_api_key_v2(p_product_code text, p_order_id uuid)
RETURNS uuid AS $$
DECLARE
  v_key_id uuid;
BEGIN
  -- Find one available key for the product_code using SKIP LOCKED
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

-- 6. API Key Inventory release function
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

-- 7. issue_api_key PL/pgSQL function
CREATE OR REPLACE FUNCTION public.issue_api_key(p_order_no text)
RETURNS TABLE (
  api_key text,
  key_id uuid,
  product_name text
) AS $$
DECLARE
  v_order_id uuid;
  v_product_code text;
  v_key_id uuid;
  v_key_value text;
  v_product_name text;
BEGIN
  -- Retrieve order details
  SELECT id, product_code INTO v_order_id, v_product_code
  FROM public.orders
  WHERE order_no = p_order_no;

  IF v_order_id IS NULL THEN
    RETURN;
  END IF;

  -- First, try to claim the key that was pre-reserved for this order
  SELECT id, key_value INTO v_key_id, v_key_value
  FROM public.api_key_inventory
  WHERE reserved_order_id = v_order_id AND status = 'reserved'
  LIMIT 1
  FOR UPDATE;

  -- If no pre-reserved key is found, try to claim any available key on-the-fly
  IF v_key_id IS NULL THEN
    SELECT id, key_value INTO v_key_id, v_key_value
    FROM public.api_key_inventory
    WHERE product_code = v_product_code AND status = 'available'
    LIMIT 1
    FOR UPDATE SKIP LOCKED;
  END IF;

  -- If we got a key (either pre-reserved or on-the-fly), issue it
  IF v_key_id IS NOT NULL THEN
    UPDATE public.api_key_inventory
    SET status = 'issued',
        issued_order_no = p_order_no,
        issued_at = now(),
        issued_order_id = v_order_id,
        reserved_order_id = null,
        reserved_at = null
    WHERE id = v_key_id;

    -- Insert into issued_api_keys mapping
    INSERT INTO public.issued_api_keys (order_no, key_id, issued_at)
    VALUES (p_order_no, v_key_id, now());

    -- Determine friendly product name
    v_product_name := CASE v_product_code
      WHEN 'STANDARD' THEN 'STANDARD 잔액형 키'
      WHEN 'PRO' THEN 'PRO 잔액형 키'
      WHEN 'ULTRA' THEN 'ULTRA 잔액형 키'
      ELSE v_product_code || ' 잔액형 키'
    END;

    RETURN QUERY SELECT v_key_value, v_key_id, v_product_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
