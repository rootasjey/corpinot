import { db, schema } from 'hub:db'
import { and, eq, like } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const whereClauses = [] as any[]

    if (query.category) {
      whereClauses.push(eq(schema.tags.category, String(query.category)))
    } else if (query.search) {
      whereClauses.push(like(schema.tags.name, `%${query.search}%`))
    }

    const rows = await db
      .select()
      .from(schema.tags)
      .where(whereClauses.length ? and(...whereClauses) : undefined)
      .orderBy(schema.tags.name)

    return apiSuccess(event, rows)
  } catch (err: any) {
    console.error('[API v1] GET /tags error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch tags')
  }
})
