// GET /api/posts
import { Post, ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string
  const tag = query.tag as string
  // Pagination
  const pageRaw = query.page as string
  const limitRaw = query.limit as string
  let page = Number.parseInt(pageRaw || '1', 10)
  let limit = Number.parseInt(limitRaw || '25', 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(limit) || limit < 1) limit = 25
  // Hard cap to avoid abuse
  if (limit > 50) limit = 50
  const offset = (page - 1) * limit
  const db = hubDatabase()

  let sql = `
    SELECT DISTINCT posts.* FROM posts
  `
  const params: any[] = []

  // If filtering by tag, join with tags tables
  if (tag && tag.trim()) {
    sql += `
      JOIN post_tags pt ON pt.post_id = posts.id
      JOIN tags t ON t.id = pt.tag_id
    `
  }

  sql += ` WHERE posts.status = 'published'`

  if (search && search.trim()) {
    sql += ` AND (posts.name LIKE ? OR posts.description LIKE ?)`
    const searchPattern = `%${search.trim()}%`
    params.push(searchPattern, searchPattern)
  }

  if (tag && tag.trim()) {
    sql += ` AND LOWER(t.name) = LOWER(?)`
    params.push(tag.trim())
  }

  sql += ` ORDER BY posts.created_at DESC LIMIT ${limit} OFFSET ${offset}`

  const postQuery = await db
    .prepare(sql)
    .bind(...params)
    .all()
  
  const posts: Post[] = []
  for (const apiPost of postQuery.results as ApiPost[]) {
    const tagQuery = await db.prepare(`
      SELECT t.* FROM tags t
      JOIN post_tags pt ON pt.tag_id = t.id
      WHERE pt.post_id = ?
      ORDER BY pt.rowid ASC
    `).bind(apiPost.id).all()
    
    const post = convertApiToPost(apiPost, {
      tags: tagQuery.results,
    })

    posts.push(post)
  }
  
  return posts
})