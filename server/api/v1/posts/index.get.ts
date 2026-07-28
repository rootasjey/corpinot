import { db, schema } from 'hub:db'
import { and, desc, eq, like, or, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const search = query.search as string
    const tag = query.tag as string
    const author = query.author as string
    const exclude = query.exclude as string
    const language = query.language as string

    const { page, limit, offset } = parsePagination(query, 50)

    const conditions = [eq(schema.posts.status, 'published')]

    if (language && ['en', 'fr', 'es', 'de', 'it'].includes(language)) {
      conditions.push(eq(schema.posts.language, language))
    }

    const excludedTags = exclude
      ? exclude.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
      : []

    if (excludedTags.length) {
      const placeholders = excludedTags.map(t => sql`${t}`)
      conditions.push(sql`NOT EXISTS (
        SELECT 1 FROM ${schema.post_tags}
        INNER JOIN ${schema.tags} ON ${schema.tags.id} = ${schema.post_tags.tag_id}
        WHERE ${schema.post_tags.post_id} = ${schema.posts.id}
          AND LOWER(${schema.tags.name}) IN (${sql.join(placeholders, sql`, `)})
      )`)
    }

    if (search && search.trim()) {
      const pattern = `%${search.trim()}%`
      conditions.push(or(like(schema.posts.name, pattern), like(schema.posts.description, pattern)) as any)
    }

    const countResult = await db
      .select({ total: sql`COUNT(DISTINCT ${schema.posts.id})` })
      .from(schema.posts)
      .leftJoin(schema.post_tags, eq(schema.post_tags.post_id, schema.posts.id))
      .leftJoin(schema.tags, eq(schema.tags.id, schema.post_tags.tag_id))
      .where(and(...conditions))

    const total = Number((countResult as any[])[0]?.total ?? 0)

    const baseQuery = db
      .select({ post: schema.posts })
      .from(schema.posts)

    const hasTagFilter = Boolean(tag && tag.trim())

    const queryWithJoins = hasTagFilter
      ? baseQuery
          .innerJoin(schema.post_tags, eq(schema.post_tags.post_id, schema.posts.id))
          .innerJoin(schema.tags, eq(schema.tags.id, schema.post_tags.tag_id))
      : baseQuery

    const finalWhere = hasTagFilter
      ? and(...conditions, sql`LOWER(${schema.tags.name}) = LOWER(${tag!.trim()})`)
      : and(...conditions)

    let finalQuery: any = queryWithJoins
    let finalWhereClause: any = finalWhere

    const a = author && author.trim()
    if (a) {
      if (/^\d+$/.test(a)) {
        finalWhereClause = and(finalWhere, eq(schema.posts.user_id, Number(a)))
      } else {
        finalQuery = finalQuery.innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
        finalWhereClause = and(
          finalWhere,
          sql`(LOWER(${schema.users.slug}) = LOWER(${a}) OR LOWER(${schema.users.name}) = LOWER(${a}))`
        )
      }
    }

    const results = await finalQuery
      .where(finalWhereClause)
      .orderBy(desc(schema.posts.created_at))
      .limit(limit)
      .offset(offset)

    const rows = (results as any[]).map((row: any) => row.post)

    const posts = await Promise.all(rows.map(async (apiPost: any) => {
      const tagRows = await db
        .select({ tag: schema.tags })
        .from(schema.tags)
        .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
        .where(eq(schema.post_tags.post_id, apiPost.id))
        .orderBy(sql`post_tags.rowid ASC`)

      const tags = tagRows.map((r: any) => r.tag)
      return convertApiToPost(apiPost, { tags })
    }))

    return apiSuccess(event, posts, buildMeta(page, limit, total))
  } catch (err: any) {
    console.error('[API v1] GET /posts error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch posts')
  }
})
