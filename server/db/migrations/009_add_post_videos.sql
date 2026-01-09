-- Add table for inline post videos
CREATE TABLE IF NOT EXISTS post_videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  pathname TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size INTEGER,
  poster_path TEXT,
  poster_filename TEXT,
  in_use BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_videos_post_id ON post_videos(post_id);
CREATE INDEX IF NOT EXISTS idx_post_videos_in_use ON post_videos(in_use);
