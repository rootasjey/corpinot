// GET /api/debug/health
import { db, schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  try {
    const postsRes = await db.select({ count: sql`COUNT(*)` }).from(schema.posts)
    const tagsRes = await db.select({ count: sql`COUNT(*)` }).from(schema.tags)

    const postsCount = Number(postsRes?.[0]?.count ?? 0)
    const tagsCount = Number(tagsRes?.[0]?.count ?? 0)

    return { ok: true, postsCount, tagsCount }
  } catch (err: any) {
    // Return error details for debugging (do not expose in public production environments)
    return { ok: false, error: String(err?.message ?? err), stack: err?.stack }
  }
})
