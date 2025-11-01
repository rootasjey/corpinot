// server/utils/tags.ts
// Utility to upsert tags and update post_tags join table
import type { ApiTag } from '~~/shared/types/tags'

/**
 * Upsert tags and update post_tags join table for a post.
 * @param db - Database instance
 * @param postId - The post's ID
 * @param tags - Array of { name, category? }
 */
export async function upsertPostTags(
  db: any,
  postId: number,
  tags: Array<{ name: string; category?: string }>
) {
  const tagIds: number[] = []
  const createdTags: Array<ApiTag> = []

  for (const tag of tags) {
    // Try to find tag by name
    let dbTag = await db.prepare('SELECT * FROM tags WHERE name = ? LIMIT 1').bind(tag.name).first()
    let isNew = false

    if (!dbTag) {
      // Insert new tag
      await db.prepare('INSERT INTO tags (name, category, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .bind(tag.name, tag.category || '', new Date().toISOString(), new Date().toISOString())
        .run()
      dbTag = await db.prepare('SELECT * FROM tags WHERE name = ? LIMIT 1').bind(tag.name).first()
      isNew = true
    }

    if (dbTag && typeof dbTag.id === 'number') {
      tagIds.push(dbTag.id)
      if (isNew) {
        createdTags.push({ 
          id: dbTag.id,
          name: dbTag.name,
          category: dbTag.category,
          created_at: dbTag.created_at,
          updated_at: dbTag.updated_at
        })
      }
    }
  }

  // Remove all previous post_tags
  await db.prepare('DELETE FROM post_tags WHERE post_id = ?').bind(postId).run()
  // Insert new post_tags
  for (const tagId of tagIds) {
    await db.prepare('INSERT INTO post_tags (post_id, tag_id) VALUES (?, ?)').bind(postId, tagId).run()
  }

  return createdTags
}
