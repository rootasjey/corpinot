import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const idParam = getRouterParam(event, 'id')
    const id = Number(idParam)
    if (!Number.isFinite(id)) {
      return apiError(event, 400, 'BAD_REQUEST', 'Invalid author ID')
    }

    const rows = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        slug: schema.users.slug,
        avatar: schema.users.avatar,
        biography: schema.users.biography,
        job: schema.users.job,
        location: schema.users.location,
        socials: schema.users.socials,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1)

    if (!rows.length) {
      return apiError(event, 404, 'NOT_FOUND', `Author with ID "${id}" not found`)
    }

    const author = {
      ...rows[0],
      socials: safeParseJson(rows[0].socials),
    }

    return apiSuccess(event, author)
  } catch (err: any) {
    console.error('[API v1] GET /authors/:id error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch author')
  }
})

function safeParseJson(val: string | null | undefined) {
  if (!val) return []
  try {
    const parsed = JSON.parse(val)
    return Array.isArray(parsed) ? parsed : parsed ?? []
  } catch {
    return []
  }
}
