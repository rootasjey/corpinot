ALTER TABLE posts ADD COLUMN translation_group_id TEXT DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_translation_group_id ON posts (translation_group_id);
