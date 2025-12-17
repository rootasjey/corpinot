-- Track which provider handled each AI request
ALTER TABLE ai_requests ADD COLUMN provider TEXT NOT NULL DEFAULT 'cloudflare';

CREATE INDEX IF NOT EXISTS idx_ai_requests_provider ON ai_requests(provider);
