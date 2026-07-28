import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const identifier = decodeURIComponent(getRouterParam(event, 'slug') ?? '')
    if (!identifier) {
      return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')
    }

    const session = await getUserSession(event).catch(() => null)
    const userId = session?.user?.id ?? null

    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) {
      return apiError(event, 404, 'NOT_FOUND', `Post "${identifier}" not found`)
    }

    if (apiPost.status !== 'published' && apiPost.user_id !== userId) {
      return apiError(event, 403, 'FORBIDDEN', 'You are not authorized to view this post')
    }

    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const articleBlob = await blob.get(apiPost.blob_path as string)
    const article = await articleBlob?.text() ?? ''

    const post = convertApiToPost(apiPost, {
      tags: tagRows.map((r: any) => r.tag),
      article,
      userName: apiPost.user_name,
      userAvatar: apiPost.user_avatar,
    })

    try {
      await db
        .update(schema.posts)
        .set({ metrics_views: sql`${schema.posts.metrics_views} + 1` })
        .where(eq(schema.posts.id, apiPost.id))
        .run()
    } catch { }

    return apiSuccess(event, post)
  } catch (err: any) {
    console.error('[API v1] GET /posts/:slug error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch post')
  }
})
