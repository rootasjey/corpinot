// GET /api/posts/slug/check?slug=some-slug&excludeId=123 (excludeId optional)
import { z } from 'zod'

const querySchema = z.object({
  slug: z.string().min(1).max(255),
  excludeId: z.coerce.number().optional(),
})

export default defineEventHandler(async (event) => {
  const db = hubDatabase()
  const query = getQuery(event)
  const validated = querySchema.safeParse(query)

  if (!validated.success) {
    throw createError({ statusCode: 400, message: 'Invalid query' })
  }

  const { slug, excludeId } = validated.data

  // Check if slug exists in posts table for a different post id
  const row: { id?: number } | null = await db
    .prepare('SELECT id FROM posts WHERE slug = ? LIMIT 1')
    .bind(slug)
    .first()

  const exists = !!row && (excludeId ? row.id !== excludeId : true)

  return { exists, id: row?.id ?? null }
})
