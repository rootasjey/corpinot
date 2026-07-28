import { db, schema } from 'hub:db'
import { and, eq, ne, sql } from 'drizzle-orm'
import { upsertPostTags } from '~~/server/utils/tags'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
    if (!identifier) return apiError(event, 400, 'BAD_REQUEST', 'Post identifier is required')

    const body = await readBody(event)
    const apiPost: any = await getPostByIdentifier(db, identifier)
    if (!apiPost) return apiError(event, 404, 'NOT_FOUND', 'Post not found')
    if (apiPost.user_id !== user.id && user.role !== 'admin') return apiError(event, 403, 'FORBIDDEN', 'Not authorized')

    if (body.slug && body.slug !== apiPost.slug) {
      const slugExists = await db.query.posts.findFirst({
        where: and(eq(schema.posts.slug, body.slug), ne(schema.posts.id, apiPost.id)),
        columns: { id: true },
      })
      if (slugExists) return apiError(event, 409, 'CONFLICT', `Slug "${body.slug}" already exists`)
    }

    const updateData: Record<string, any> = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.language !== undefined) updateData.language = body.language
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'published' && apiPost.status !== 'published') {
        updateData.published_at = new Date().toISOString()
      } else if (body.status !== 'published' && apiPost.status === 'published') {
        updateData.published_at = null
      }
    }

    if (!Object.keys(updateData).length) return apiSuccess(event, { message: 'No changes to update' })

    updateData.updated_at = new Date().toISOString()
    await db.update(schema.posts).set(updateData).where(and(eq(schema.posts.id, apiPost.id), eq(schema.posts.user_id, user.id))).run()

    if (body.tags !== undefined) {
      await upsertPostTags(db, apiPost.id, body.tags)
    }

    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const updatedPost = await db.query.posts.findFirst({ where: eq(schema.posts.id, apiPost.id) })
    if (!updatedPost) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to load updated post')

    const post = convertApiToPost(updatedPost as any, {
      tags: tagRows.map((r: any) => r.tag),
      userName: user.name,
    })

    return apiSuccess(event, post)
  } catch (err: any) {
    console.error('[API v1] PUT /posts/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to update post')
  }
})
