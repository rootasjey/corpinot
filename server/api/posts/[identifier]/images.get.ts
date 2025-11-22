// GET /api/posts/[identifier]/images
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const db = hubDatabase()

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  if (post.user_id !== userId) throw createError({ statusCode: 403, message: 'You are not authorized to view this post images' })

  const rows = await db.prepare(`SELECT id, pathname, filename, content_type, size, in_use, created_at FROM post_images WHERE post_id = ? ORDER BY created_at DESC`).bind(post.id).all()

  return {
    success: true,
    images: rows.results ?? rows ?? [],
  }
})
