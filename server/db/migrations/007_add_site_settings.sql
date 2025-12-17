CREATE TABLE IF NOT EXISTS site_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(value)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings (key);

CREATE TRIGGER IF NOT EXISTS trg_site_settings_updated_at
AFTER UPDATE ON site_settings
FOR EACH ROW
BEGIN
  UPDATE site_settings SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
END;
