-- Add a description field to tags for richer metadata
ALTER TABLE tags ADD COLUMN description TEXT NOT NULL DEFAULT '';

-- Ensure legacy rows have a non-null description
UPDATE tags SET description = '' WHERE description IS NULL;
