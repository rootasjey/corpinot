import { db, schema } from 'hub:db'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (session.user.role !== 'admin') {
    return apiError(event, 403, 'FORBIDDEN', 'Admin access required')
  }

  try {
    const body = await readBody(event)
    const name = String(body?.name || '').trim()
    if (!name || name.length > 100) {
      return apiError(event, 400, 'VALIDATION_ERROR', 'Name is required (max 100 characters)')
    }

    const { raw, hash, prefix } = await generateApiKey()

    await db.insert(schema.api_keys).values({ user_id: session.user.id, name, hash, prefix }).run()

    return apiCreated(event, {
      name,
      prefix,
      key: raw,
      message: 'Save this key — it will not be shown again',
    })
  } catch (err: any) {
    console.error('[API v1] POST /api-keys error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create API key')
  }
})
