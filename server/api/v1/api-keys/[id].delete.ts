import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    return apiError(event, 403, 'FORBIDDEN', 'Admin access required')
  }

  try {
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isFinite(id)) {
      return apiError(event, 400, 'BAD_REQUEST', 'Invalid key ID')
    }

    await db
      .update(schema.api_keys)
      .set({ revoked_at: new Date().toISOString() })
      .where(eq(schema.api_keys.id, id))
      .run()

    return apiSuccess(event, { id, revoked: true })
  } catch (err: any) {
    console.error('[API v1] DELETE /api-keys/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to revoke API key')
  }
})
