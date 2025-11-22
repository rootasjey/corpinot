// DELETE /api/posts/[identifier]/images
// Accepts query ?id=<imageRowId> or ?filename=<filename> to remove a single inline image
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const db = hubDatabase()
  const hb = hubBlob()

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  if (post.user_id !== userId) throw createError({ statusCode: 403, message: 'You are not authorized to delete this post image' })

  const query = getQuery(event)
  const id = query.id ? Number(query.id) : null
  const filename = typeof query.filename === 'string' ? query.filename : null

  if (!id && !filename) {
    throw createError({ statusCode: 400, message: 'Provide id or filename' })
  }

  try {
    let record: any = null

    if (id) {
      record = await db.prepare(`SELECT * FROM post_images WHERE id = ? LIMIT 1`).bind(id).first()
    } else if (filename) {
      record = await db.prepare(`SELECT * FROM post_images WHERE filename = ? AND post_id = ? LIMIT 1`).bind(filename, post.id).first()
    }

    if (!record) {
      throw createError({ statusCode: 404, message: 'Image not found' })
    }

    // Ensure record belongs to this post
    if (record.post_id !== post.id) {
      throw createError({ statusCode: 403, message: 'Image belongs to a different post' })
    }

    // Delete blob
    try {
      const pathname = record.pathname.replace(/^\/+/, '')
      await hb.delete(pathname)
    } catch (err) {
      console.warn('Failed to delete blob for inline image', err)
    }

    // Delete DB record
    await db.prepare(`DELETE FROM post_images WHERE id = ?`).bind(record.id).run()

    return { success: true }
  } catch (err: any) {
    console.error('Failed to delete inline image', err)
    throw createError({ statusCode: 500, message: err?.message || 'Failed to delete image' })
  }
})
