-- Migration: Add avatar column to users table
-- Date: 2025-10-30
-- Description: Adds avatar field to store user profile pictures

-- Add avatar column to users table
ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT "";

-- Optional: Create an index if you plan to query by avatar frequently
-- CREATE INDEX IF NOT EXISTS idx_users_avatar ON users (avatar);
