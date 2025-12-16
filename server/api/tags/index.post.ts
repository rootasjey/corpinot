// POST /api/tags
import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.name) {
    throw createError({ statusCode: 400, statusMessage: 'Tag name is required' })
  }
  
  const name = body.name.trim()
  const category = body.category?.trim() || 'general'
  const description = typeof body.description === 'string' ? body.description.trim() : ''

  try {
    const exists = await db.query.tags.findFirst({
      where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)),
    })

    if (exists) {
      throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
    }

    const result = await db.insert(schema.tags).values({ name, category, description }).run()
    const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

    const tag = insertedId
      ? await db.query.tags.findFirst({ where: eq(schema.tags.id, insertedId) })
      : await db.query.tags.findFirst({ where: and(eq(schema.tags.name, name), eq(schema.tags.category, category)) })

    return tag
  } catch (e: any) {
    if (e.statusCode) {
      throw e
    }
    if (e.message && e.message.includes('UNIQUE')) {
      throw createError({ statusCode: 409, statusMessage: 'Tag already exists' })
    }
    throw createError({ statusCode: 500, statusMessage: 'Failed to create tag' })
  }
})