import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    await requireWriteAccess(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isFinite(id)) return apiError(event, 400, 'BAD_REQUEST', 'Invalid tag ID')

    const result = await db.delete(schema.tags).where(eq(schema.tags.id, id)).run()
    const rowsDeleted = Number((result as any)?.rowsAffected ?? 0)
    if (!rowsDeleted) return apiError(event, 404, 'NOT_FOUND', 'Tag not found')

    return apiSuccess(event, { id, deleted: true })
  } catch (err: any) {
    console.error('[API v1] DELETE /tags/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to delete tag')
  }
})
