import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    await requireWriteAccess(event)
    const body = await readBody(event)

    const name = String(body?.name || '').trim()
    if (!name) return apiError(event, 400, 'VALIDATION_ERROR', 'Tag name is required')

    const category = String(body?.category || 'general').trim()
    const description = String(body?.description || '').trim()

    const exists = await db.query.tags.findFirst({
      where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)),
    })
    if (exists) return apiError(event, 409, 'CONFLICT', 'Tag already exists')

    const result = await db.insert(schema.tags).values({ name, category, description }).run()
    const insertedId = Number((result as any)?.lastInsertRowid ?? 0)

    const tag = insertedId
      ? await db.query.tags.findFirst({ where: eq(schema.tags.id, insertedId) })
      : await db.query.tags.findFirst({ where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)) })

    return apiCreated(event, tag)
  } catch (err: any) {
    if (err.message?.includes('UNIQUE')) return apiError(event, 409, 'CONFLICT', 'Tag already exists')
    console.error('[API v1] POST /tags error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create tag')
  }
})
