import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
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
      .orderBy(schema.users.name)

    const authors = rows.map((row: any) => ({
      ...row,
      socials: safeParseJson(row.socials),
    }))

    return apiSuccess(event, authors)
  } catch (err: any) {
    console.error('[API v1] GET /authors error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch authors')
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
