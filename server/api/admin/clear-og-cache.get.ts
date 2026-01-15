import { blob } from 'hub:blob'

/**
 * Public GET admin endpoint to clear OG cache.
 *
 * Usage (in browser):
 * GET /api/admin/clear-og-cache?key=SECRET
 * Optional query params: type=home|post|author|tag  and slug={slug-without-.png}
 *
 * The endpoint checks runtime config `ogCacheResetKey` (set from env NUXT_OG_CACHE_RESET_KEY).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event) as Record<string, string | undefined>
  const providedKey = query.key || ''
  const type = query.type
  const slug = query.slug

  const config = useRuntimeConfig()
  const secret = config.ogCacheResetKey || ''

  if (!secret) {
    // Safety: if secret not configured, disallow clearing via GET in public environments
    throw createError({ statusCode: 403, statusMessage: 'OG cache reset not enabled' })
  }

  if (!providedKey || providedKey !== secret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or missing key' })
  }

  try {
    let deletedCount = 0

    if (type && slug) {
      const cacheKey = `og/${type}/${slug}.png`
      await blob.delete(cacheKey)
      deletedCount = 1
      console.log(`Cleared OG cache for: ${cacheKey}`)
    } else if (type) {
      const prefix = `og/${type}/`
      const { blobs } = await blob.list({ prefix, limit: 1000 })
      for (const blobItem of blobs) {
        await blob.delete(blobItem.pathname)
        deletedCount++
      }
      console.log(`Cleared ${deletedCount} OG images for type: ${type}`)
    } else {
      const { blobs } = await blob.list({ prefix: 'og/', limit: 1000 })
      for (const blobItem of blobs) {
        await blob.delete(blobItem.pathname)
        deletedCount++
      }
      console.log(`Cleared all ${deletedCount} OG images`)
    }

    return {
      success: true,
      message: `Cleared ${deletedCount} cached OG image(s)`,
      deletedCount,
    }
  } catch (error) {
    console.error('Error clearing OG cache:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to clear OG cache',
      data: { error: error instanceof Error ? error.message : String(error) }
    })
  }
})
