import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    await requireWriteAccess(event)
    const id = Number(getRouterParam(event, 'id'))
    if (!Number.isFinite(id)) return apiError(event, 400, 'BAD_REQUEST', 'Invalid tag ID')

    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    if (!name) return apiError(event, 400, 'VALIDATION_ERROR', 'Tag name is required')

    const category = String(body?.category || 'general').trim()
    const description = String(body?.description || '').trim()

    const result = await db.update(schema.tags).set({ name, category, description }).where(eq(schema.tags.id, id)).run()
    const rowsWritten = Number((result as any)?.rowsAffected ?? 0)
    if (!rowsWritten) return apiError(event, 404, 'NOT_FOUND', 'Tag not found')

    const tag = await db.query.tags.findFirst({ where: eq(schema.tags.id, id) })
    return apiSuccess(event, tag)
  } catch (err: any) {
    console.error('[API v1] PUT /tags/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to update tag')
  }
})
