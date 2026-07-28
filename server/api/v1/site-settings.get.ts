import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  try {
    const rows = await db.select().from(schema.site_settings)

    const settings: Record<string, any> = {}
    for (const row of rows) {
      try {
        settings[row.key] = JSON.parse(row.value)
      } catch {
        settings[row.key] = row.value
      }
    }

    return apiSuccess(event, settings)
  } catch (err: any) {
    console.error('[API v1] GET /site-settings error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch site settings')
  }
})
