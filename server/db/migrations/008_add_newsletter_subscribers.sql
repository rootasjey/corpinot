CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  user_id INTEGER,
  status TEXT NOT NULL DEFAULT 'subscribed' CHECK (status IN ('subscribed','unsubscribed','pending','bounced')),
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  confirmed_at DATETIME,
  resend_message_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(metadata)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON newsletter_subscribers (email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON newsletter_subscribers (status);

CREATE TRIGGER IF NOT EXISTS trg_newsletter_subscribers_updated_at
AFTER UPDATE ON newsletter_subscribers
FOR EACH ROW
BEGIN
  UPDATE newsletter_subscribers SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
