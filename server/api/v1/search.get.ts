import { db, schema } from 'hub:db'
import { and, desc, eq, like, or, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const q = (query.q as string || '').trim()

    if (!q || q.length < 2) {
      return apiError(event, 400, 'BAD_REQUEST', 'Search query must be at least 2 characters')
    }

    const { page, limit, offset } = parsePagination(query, 50)
    const pattern = `%${q}%`

    const conditions = [
      eq(schema.posts.status, 'published'),
      or(like(schema.posts.name, pattern), like(schema.posts.description, pattern)) as any,
    ]

    if (query.language && ['en', 'fr', 'es', 'de', 'it'].includes(query.language as string)) {
      conditions.push(eq(schema.posts.language, query.language as string))
    }

    const countResult = await db
      .select({ total: sql`COUNT(*)` })
      .from(schema.posts)
      .where(and(...conditions))

    const total = Number((countResult as any[])[0]?.total ?? 0)

    const rows = await db
      .select({ post: schema.posts })
      .from(schema.posts)
      .where(and(...conditions))
      .orderBy(desc(schema.posts.created_at))
      .limit(limit)
      .offset(offset)

    const apiPosts = (rows as any[]).map((r: any) => r.post)

    const posts = await Promise.all(apiPosts.map(async (apiPost: any) => {
      const tagRows = await db
        .select({ tag: schema.tags })
        .from(schema.tags)
        .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
        .where(eq(schema.post_tags.post_id, apiPost.id))

      return convertApiToPost(apiPost, { tags: tagRows.map((r: any) => r.tag) })
    }))

    return apiSuccess(event, posts, buildMeta(page, limit, total))
  } catch (err: any) {
    console.error('[API v1] GET /search error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to search posts')
  }
})
