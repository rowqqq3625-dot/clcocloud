-- Migration for Clcocloud AI Assistant Sanitize Logs
-- Created: 2026-05-24

CREATE TABLE IF NOT EXISTS assistant_sanitize_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES assistant_sessions(id) ON DELETE SET NULL,
  client_hash text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('injection', 'sanitize_proxy', 'sanitize_identity', 'sanitize_secrets', 'sanitize_system_prompt')),
  triggered_pattern text,
  created_at timestamptz DEFAULT now()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_assistant_sanitize_logs_client ON assistant_sanitize_logs (client_hash, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assistant_sanitize_logs_event ON assistant_sanitize_logs (event_type, created_at DESC);
