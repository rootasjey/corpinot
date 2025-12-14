import { db, schema } from 'hub:db'

export default defineEventHandler(async () => {
  const rows = await db
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
    .orderBy(schema.users.name)

  return rows.map((row) => ({
    ...row,
    socials: safeParseJson(row.socials),
  }))
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
