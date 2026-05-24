-- Migration for Clcocloud AI Assistant Rate Limiting, Session, Messages & Feedback
-- Created: 2026-05-23

CREATE TABLE IF NOT EXISTS assistant_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_hash text NOT NULL,
  os text NOT NULL CHECK (os IN ('macos','powershell','cmd','linux')),
  usecase text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_active_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assistant_messages (
  id bigserial PRIMARY KEY,
  session_id uuid REFERENCES assistant_sessions(id) ON DELETE CASCADE,
  role text CHECK (role IN ('user','assistant')),
  content text,
  has_image boolean DEFAULT false,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS assistant_usage_quota (
  client_hash text NOT NULL,
  quota_date date NOT NULL,
  used_count int DEFAULT 0,
  last_used_at timestamptz DEFAULT now(),
  PRIMARY KEY (client_hash, quota_date)
);

CREATE TABLE IF NOT EXISTS assistant_feedback (
  message_id bigint REFERENCES assistant_messages(id) ON DELETE CASCADE,
  rating smallint CHECK (rating IN (-1, 1)),
  reason text,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (message_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_assistant_sessions_client ON assistant_sessions (client_hash);
CREATE INDEX IF NOT EXISTS idx_assistant_messages_session ON assistant_messages (session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_assistant_usage_quota_client ON assistant_usage_quota (client_hash, quota_date);
