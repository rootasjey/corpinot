import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '../../../server/db/schema'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

export type TestDb = {
  sqlite: Database.Database
  db: ReturnType<typeof drizzle<typeof schema>>
  schema: typeof schema
}

export function createTestDb(): TestDb {
  const sqlite = new Database(':memory:')
  const db = drizzle(sqlite, { schema })
  return { sqlite, db, schema }
}

export function applyMigrations(sqlite: Database.Database, migrationsDir: string) {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    sqlite.exec(sql)
  }
}

export function seedTestData(t: TestDb) {
  t.sqlite.exec(`INSERT INTO users (id, email, name, password, role, slug)
    VALUES (1, 'admin@test.com', 'Admin', 'hashed_pw', 'admin', 'admin')`)

  t.sqlite.exec(`INSERT INTO tags (id, name, category) VALUES (1, 'vue', 'framework')`)
  t.sqlite.exec(`INSERT INTO tags (id, name, category) VALUES (2, 'nuxt', 'framework')`)
  t.sqlite.exec(`INSERT INTO tags (id, name, category) VALUES (3, 'design', 'general')`)

  t.sqlite.exec(`INSERT INTO posts (id, name, slug, status, user_id, language, description)
    VALUES (1, 'Hello World', 'hello-world', 'published', 1, 'en', 'First post')`)
  t.sqlite.exec(`INSERT INTO posts (id, name, slug, status, user_id, language, description)
    VALUES (2, 'Bonjour le monde', 'bonjour-le-monde', 'published', 1, 'fr', 'Premier article')`)
  t.sqlite.exec(`INSERT INTO posts (id, name, slug, status, user_id, language, description)
    VALUES (3, 'Draft Post', 'draft-post', 'draft', 1, 'en', 'Not published yet')`)

  t.sqlite.exec(`INSERT INTO post_tags (post_id, tag_id) VALUES (1, 1)`)
  t.sqlite.exec(`INSERT INTO post_tags (post_id, tag_id) VALUES (1, 2)`)
  t.sqlite.exec(`INSERT INTO post_tags (post_id, tag_id) VALUES (2, 3)`)
}

export function createTestDbSeeded(): TestDb {
  const testDb = createTestDb()
  const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), '../../../server/db/migrations')
  applyMigrations(testDb.sqlite, migrationsDir)
  seedTestData(testDb)
  return testDb
}
