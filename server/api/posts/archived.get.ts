// GET /api/posts/archived
import { db, schema } from 'hub:db'
import { and, desc, eq, sql } from 'drizzle-orm'
import type { ApiPost, Post } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const query = getQuery(event)
  const search = query.search as string
  const userId = session.user.id

  const conditions = [eq(schema.posts.user_id, userId), eq(schema.posts.status, 'archived')]
  if (search && search.trim()) {
    const searchPattern = `%${search.trim()}%`
    conditions.push(sql`(posts.name LIKE ${searchPattern} OR COALESCE(posts.description, '') LIKE ${searchPattern})`)
  }

  const resultRows = await db
    .select({ post: schema.posts })
    .from(schema.posts)
    .where(and(...conditions))
    .orderBy(desc(schema.posts.created_at))
    .limit(25)

  // Optional tag filter: ?tag=project or ?tag=project&tag=featured%20project
  const tagQuery = query.tag as string | string[] | undefined
  const requestedTags = tagQuery ? (Array.isArray(tagQuery) ? tagQuery : [tagQuery]) : null

  const archivedPosts: Post[] = []
  for (const { post: apiPost } of resultRows as Array<{ post: ApiPost }>) {
    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const tags = tagRows.map((row: any) => row.tag)

    // If a tag filter was supplied, skip posts that don't have any of the requested tags
    if (requestedTags && !tags.some((t: any) => requestedTags.includes(t.name))) continue

    const archivedPost = convertApiToPost(apiPost, {
      tags,
      userName: session.user.name,
    })

    archivedPosts.push(archivedPost)
  }

  return archivedPosts
})