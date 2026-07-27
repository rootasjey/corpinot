import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'
import { getPostByIdentifier } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const body = await readBody(event)
  const targetId = Number(body?.postId)
  if (!targetId) throw createError({ statusCode: 400, message: 'Target post ID is required' })

  const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!apiPost) throw createError({ statusCode: 404, message: 'Post not found' })

  const currentUser = session.user
  if (apiPost.user_id !== currentUser.id && currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'You are not authorized to modify this post' })
  }

  await db.update(schema.posts).set({ translation_group_id: null }).where(eq(schema.posts.id, targetId)).run()

  return { success: true }
})
