// POST /api/posts/:id/tags
// Body: { tagIds: number[] }

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const db = hubDatabase()
  const identifier = getRouterParam(event, 'identifier') || ''

  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: 'Post identifier (id or slug) is required' })
  }

  const body = await readBody(event)

  if (!Array.isArray(body?.tagIds)) {
    throw createError({ statusCode: 400, statusMessage: 'tagIds is required' })
  }

  // Resolve post by numeric id or slug
  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) {
    throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  }

  if (post.user_id !== userId) {
    throw createError({ statusCode: 403, statusMessage: 'You are not authorized to modify tags on this post' })
  }

  // Remove all existing tags for this post (use numeric post id)
  await db.prepare('DELETE FROM post_tags WHERE post_id = ?1').bind(post.id).run()

  // Insert new tags
  for (const tagId of body.tagIds) {
    await db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?1, ?2)').bind(post.id, tagId).run()
  }

  // Return updated tags
  const sql = `SELECT t.* FROM tags t
    INNER JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?1
    ORDER BY t.name ASC`

  const stmt = db.prepare(sql).bind(post.id)

  const tags = await stmt.all()
  return tags.results
})