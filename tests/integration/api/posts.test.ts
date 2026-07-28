import { describe, expect, it, beforeEach } from 'vitest'
import { eq, and, desc, like, sql } from 'drizzle-orm'
import type { TestDb } from '../helpers/db'
import { createTestDbSeeded } from '../helpers/db'

let t: TestDb

beforeEach(() => {
  t = createTestDbSeeded()
})

describe('posts DB queries (published posts with filters)', () => {
  it('lists published posts only', async () => {
    const rows = await t.db
      .select()
      .from(t.schema.posts)
      .where(eq(t.schema.posts.status, 'published'))

    expect(rows).toHaveLength(2)
    expect(rows.every((r: any) => r.status === 'published')).toBe(true)
  })

  it('filters by language', async () => {
    const rows = await t.db
      .select()
      .from(t.schema.posts)
      .where(and(eq(t.schema.posts.status, 'published'), eq(t.schema.posts.language, 'fr')))

    expect(rows).toHaveLength(1)
    expect(rows[0].slug).toBe('bonjour-le-monde')
  })

  it('filters by tag via join', async () => {
    const rows = await t.db
      .select({ post: t.schema.posts })
      .from(t.schema.posts)
      .innerJoin(t.schema.post_tags, eq(t.schema.post_tags.post_id, t.schema.posts.id))
      .innerJoin(t.schema.tags, eq(t.schema.tags.id, t.schema.post_tags.tag_id))
      .where(and(
        eq(t.schema.posts.status, 'published'),
        sql`LOWER(${t.schema.tags.name}) = LOWER('Vue')`,
      ))

    expect(rows).toHaveLength(1)
    expect(rows[0].post.name).toBe('Hello World')
  })

  it('excludes posts with specific tags', async () => {
    const rows = await t.db
      .select()
      .from(t.schema.posts)
      .where(and(
        eq(t.schema.posts.status, 'published'),
        sql`NOT EXISTS (
          SELECT 1 FROM post_tags
          INNER JOIN tags ON tags.id = post_tags.tag_id
          WHERE post_tags.post_id = posts.id
            AND LOWER(tags.name) IN ('vue')
        )`,
      ))
      .orderBy(desc(t.schema.posts.created_at))

    expect(rows).toHaveLength(1)
    expect(rows[0].slug).toBe('bonjour-le-monde')
  })

  it('searches by name with LIKE', async () => {
    const pattern = '%world%'
    const rows = await t.db
      .select()
      .from(t.schema.posts)
      .where(and(
        eq(t.schema.posts.status, 'published'),
        like(t.schema.posts.name, pattern),
      ))

    expect(rows).toHaveLength(1)
    expect(rows[0].slug).toBe('hello-world')
  })

  it('paginates results', async () => {
    const rows = await t.db
      .select()
      .from(t.schema.posts)
      .where(eq(t.schema.posts.status, 'published'))
      .limit(1)
      .offset(0)

    expect(rows).toHaveLength(1)
  })

  it('returns tags for a post via post_tags join', async () => {
    const rows = await t.db
      .select({ tag: t.schema.tags })
      .from(t.schema.tags)
      .innerJoin(t.schema.post_tags, eq(t.schema.post_tags.tag_id, t.schema.tags.id))
      .where(eq(t.schema.post_tags.post_id, 1))

    expect(rows.map((r: any) => r.tag.name).sort()).toEqual(['nuxt', 'vue'])
  })
})
