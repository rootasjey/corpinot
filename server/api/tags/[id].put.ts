// PUT /api/tags/:id
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const idParam = event.context.params?.id
  const body = await readBody(event)
  if (!idParam || !body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Tag id and name are required' })
  }
  const id = Number(idParam)
  const name = body.name.trim()
  const category = body.category?.trim() || 'general'
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  const result = await db.update(schema.tags).set({ name, category, description }).where(eq(schema.tags.id, id)).run()
  const rowsWritten = Number((result as any)?.rowsAffected ?? (result as any)?.meta?.changes ?? (result as any)?.meta?.rows_written ?? 0)

  if (!rowsWritten) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const tag = await db.query.tags.findFirst({ where: eq(schema.tags.id, id) })
  return tag
})