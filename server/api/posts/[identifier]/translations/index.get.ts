import { db, schema } from 'hub:db'
import { eq, and, sql } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { getPostByIdentifier } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!apiPost) throw createError({ statusCode: 404, message: 'Post not found' })

  const groupId = apiPost.translation_group_id
  if (!groupId) return []

  const rows = await db
    .select({ post: schema.posts, user_name: schema.users.name, user_slug: schema.users.slug })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
    .where(
      and(
        eq(schema.posts.translation_group_id, groupId),
        sql`${schema.posts.id} != ${apiPost.id}`
      )
    )
    .orderBy(schema.posts.language)

  return rows.map((row: any) => ({
    id: (row.post as ApiPost).id,
    name: (row.post as ApiPost).name,
    slug: (row.post as ApiPost).slug,
    language: (row.post as ApiPost).language,
    status: (row.post as ApiPost).status,
    publishedAt: (row.post as ApiPost).published_at,
    authorName: row.user_name,
  }))
})
