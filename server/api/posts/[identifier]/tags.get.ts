// GET /api/posts/:id/tags

export default defineEventHandler(async (event) => {
  const identifier = getRouterParam(event, 'identifier') || ''

  if (!identifier) {
    throw createError({ statusCode: 400, statusMessage: 'Post identifier (id or slug) is required' })
  }

  const db = hubDatabase()

  // If a slug was provided find the numeric post id
  let postId: number | string = identifier
  if (!/^\d+$/.test(String(identifier))) {
    const apiPost: ApiPost | null = await getPostByIdentifier(db, identifier)
    if (!apiPost) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    postId = apiPost.id
  }

  const sql = `SELECT t.* FROM tags t
    INNER JOIN post_tags pt ON pt.tag_id = t.id
    WHERE pt.post_id = ?1
    ORDER BY t.name ASC`

  const stmt = db.prepare(sql).bind(postId)
  const tags = await stmt.all()
  return tags.results
})