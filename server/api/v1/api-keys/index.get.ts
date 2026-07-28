import { db, schema } from 'hub:db'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    return apiError(event, 403, 'FORBIDDEN', 'Admin access required')
  }

  try {
    const rows = await db
      .select({
        id: schema.api_keys.id,
        name: schema.api_keys.name,
        prefix: schema.api_keys.prefix,
        created_at: schema.api_keys.created_at,
        last_used_at: schema.api_keys.last_used_at,
        revoked_at: schema.api_keys.revoked_at,
      })
      .from(schema.api_keys)
      .orderBy(desc(schema.api_keys.created_at))

    return apiSuccess(event, rows)
  } catch (err: any) {
    console.error('[API v1] GET /api-keys error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch API keys')
  }
})
