-- Migration for Clcocloud AI Chatbot Rate Limiting & Logs
create table bot_usage_quota (
  id              uuid primary key default gen_random_uuid(),
  client_hash     char(64) not null,
  used_count      int not null default 0,
  quota_date      date not null,                  -- KST date
  last_used_at    timestamptz default now(),
  unique (client_hash, quota_date)
);

create table bot_messages (
  id              uuid primary key default gen_random_uuid(),
  client_hash     char(64) not null,
  role            text not null,                  -- 'user' | 'assistant'
  content         text not null,
  tokens_in       int,
  tokens_out      int,
  blocked_reason  text,                           -- null | 'off_topic' | 'injection' | 'rate_limit'
  created_at      timestamptz default now()
);

create index on bot_messages (client_hash, created_at desc);
