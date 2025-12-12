// GET /api/posts/:slug
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'
export default defineEventHandler(async (event) => {
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const blobStorage = blob

  if (!identifier) {
    throw createError({
      statusCode: 400,
      message: 'Post identifier is required',
    })
  }

  let userId = null
  try {
    const session = await getUserSession(event) // (optional - for private projects)
    if (session && session.user) { userId = session.user.id }
  } catch (error) { /* No session, continue as anonymous user */ }

  const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)

  if (!apiPost) {
    throw createError({
      statusCode: 404,
      message: `Post "${identifier}" not found`
    })
  }

  if (apiPost.status !== "published" && apiPost.user_id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'You are not authorized to view this post',
    })
  }

  // Fetch tags from join table
  const tagRows = await db
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, apiPost.id))
    .orderBy(sql`post_tags.rowid ASC`)

  const articleBlob = await blobStorage.get(apiPost.blob_path as string)
  const article = await articleBlob?.text() ?? ''
  const post = convertApiToPost(apiPost, {
    tags: tagRows.map((row: any) => row.tag),
    article,
    userAvatar: (apiPost as any).user_avatar,
    userName: (apiPost as any).user_name,
  })

  try {
    await db
      .update(schema.posts)
      .set({ metrics_views: sql`${schema.posts.metrics_views} + 1` })
      .where(eq(schema.posts.id, apiPost.id))
      .run()
  } catch (error) {
    console.error(`Failed to update view count for post ${apiPost.id}:`, error)
  }

  return post
})