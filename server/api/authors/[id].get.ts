import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const params = getRouterParams(event)
  const id = Number(params.id)
  if (!Number.isFinite(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid author id' })
  }

  const row = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      avatar: schema.users.avatar,
      biography: schema.users.biography,
      job: schema.users.job,
      location: schema.users.location,
      socials: schema.users.socials,
    })
    .from(schema.users)
    .where(eq(schema.users.id, id))
    .get()

  if (!row) {
    throw createError({ statusCode: 404, statusMessage: 'Author not found' })
  }

  return {
    ...row,
    socials: safeParseJson(row.socials),
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
