import { describe, expect, it, beforeEach } from 'vitest'
import { eq } from 'drizzle-orm'
import type { TestDb } from '../helpers/db'
import { createTestDbSeeded } from '../helpers/db'

let testDb: TestDb

beforeEach(() => {
  testDb = createTestDbSeeded()
})

describe('tags DB queries', () => {
  it('lists all tags', async () => {
    const rows = await testDb.db.select().from(testDb.schema.tags).orderBy(testDb.schema.tags.name)
    expect(rows).toHaveLength(3)
    expect(rows[0].name).toBe('design')
  })

  it('filters tags by category', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.tags)
      .where(eq(testDb.schema.tags.category, 'framework'))
      .orderBy(testDb.schema.tags.name)

    expect(rows).toHaveLength(2)
    expect(rows.map(r => r.name)).toEqual(['nuxt', 'vue'])
  })

  it('searches tags by name', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.tags)
      .where(eq(testDb.schema.tags.name, 'vue'))

    expect(rows).toHaveLength(1)
    expect(rows[0].category).toBe('framework')
  })
})

describe('posts DB queries', () => {
  it('lists only published posts', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.posts)
      .where(eq(testDb.schema.posts.status, 'published'))

    expect(rows).toHaveLength(2)
  })

  it('returns post with tags via join', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.posts)
      .innerJoin(testDb.schema.post_tags, eq(testDb.schema.post_tags.post_id, testDb.schema.posts.id))
      .innerJoin(testDb.schema.tags, eq(testDb.schema.tags.id, testDb.schema.post_tags.tag_id))
      .where(eq(testDb.schema.posts.slug, 'hello-world'))

    expect(rows).toHaveLength(2)
    expect(rows.map((r: any) => r.tags.name).sort()).toEqual(['nuxt', 'vue'])
  })

  it('filters posts by language', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.posts)
      .where(eq(testDb.schema.posts.language, 'fr'))

    expect(rows).toHaveLength(1)
    expect(rows[0].slug).toBe('bonjour-le-monde')
  })

  it('filters posts by tag', async () => {
    const rows = await testDb.db
      .select()
      .from(testDb.schema.posts)
      .innerJoin(testDb.schema.post_tags, eq(testDb.schema.post_tags.post_id, testDb.schema.posts.id))
      .innerJoin(testDb.schema.tags, eq(testDb.schema.tags.id, testDb.schema.post_tags.tag_id))
      .where(eq(testDb.schema.tags.name, 'vue'))

    expect(rows).toHaveLength(1)
    expect(rows[0].posts.name).toBe('Hello World')
  })
})
