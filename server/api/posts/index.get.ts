// GET /api/posts
import { db, schema } from 'hub:db'
import { and, desc, eq, like, or, sql } from 'drizzle-orm'
import { Post, ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string
  const tag = query.tag as string
  const author = query.author as string
  const exclude = query.exclude as string
  // Pagination
  const pageRaw = query.page as string
  const limitRaw = query.limit as string
  let page = Number.parseInt(pageRaw || '1', 10)
  let limit = Number.parseInt(limitRaw || '25', 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(limit) || limit < 1) limit = 25
  // Hard cap to avoid abuse
  if (limit > 50) limit = 50
  const offset = (page - 1) * limit
  const conditions = [eq(schema.posts.status, 'published')]

  const excludedTags = exclude
    ? exclude
        .split(',')
        .map(tagName => tagName.trim().toLowerCase())
        .filter(Boolean)
    : []

  if (excludedTags.length) {
    const placeholders = excludedTags.map(tagName => sql`${tagName}`)
    const exclusion = sql`NOT EXISTS (
      SELECT 1 FROM ${schema.post_tags}
      INNER JOIN ${schema.tags} ON ${schema.tags.id} = ${schema.post_tags.tag_id}
      WHERE ${schema.post_tags.post_id} = ${schema.posts.id}
        AND LOWER(${schema.tags.name}) IN (${sql.join(placeholders, sql`, `)})
    )`
    conditions.push(exclusion)
  }

  if (search && search.trim()) {
    const pattern = `%${search.trim()}%`
    const nameLike = like(schema.posts.name, pattern)
    const descriptionLike = like(schema.posts.description, pattern)
    const searchCondition = descriptionLike ? or(nameLike, descriptionLike) : nameLike
    conditions.push(searchCondition as unknown as ReturnType<typeof sql>)
  }

  const hasTagFilter = Boolean(tag && tag.trim())
  const baseQuery = db
    .select({ post: schema.posts })
    .from(schema.posts)

  const withJoins = hasTagFilter
    ? baseQuery
        .innerJoin(schema.post_tags, eq(schema.post_tags.post_id, schema.posts.id))
        .innerJoin(schema.tags, eq(schema.tags.id, schema.post_tags.tag_id))
    : baseQuery

  const where = hasTagFilter
    ? and(...conditions, sql`LOWER(${schema.tags.name}) = LOWER(${tag!.trim()})`)
    : and(...conditions)

  // Filter by author: numeric id, slug, or name
  const a = author && author.trim()
  let finalQuery: any = withJoins
  let finalWhere = where
  if (a) {
    if (/^\d+$/.test(a)) {
      // filter by user id
      finalWhere = and(where, eq(schema.posts.user_id, Number(a)))
    } else {
      // join users table and filter by name (case-insensitive)
      finalQuery = finalQuery.innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
      finalWhere = and(
        where,
        sql`(LOWER(${schema.users.slug}) = LOWER(${a}) OR LOWER(${schema.users.name}) = LOWER(${a}))`
      )
    }
  }

  // Use finalQuery and finalWhere for selection
   const results = await finalQuery
     .where(finalWhere)
     .orderBy(desc(schema.posts.created_at))
     .limit(limit)
     .offset(offset)

  const rows = results.map((row: any) => row.post as ApiPost)
  const posts: Post[] = []

  for (const apiPost of rows) {
    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const tags = tagRows.map((row: any) => row.tag)
    const post = convertApiToPost(apiPost, { tags })
    posts.push(post)
  }

  return posts
})