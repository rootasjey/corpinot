-- Add table for inline post audios
CREATE TABLE IF NOT EXISTS post_audios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  in_use INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_audios_post_id ON post_audios(post_id);
CREATE INDEX IF NOT EXISTS idx_post_audios_in_use ON post_audios(in_use);
