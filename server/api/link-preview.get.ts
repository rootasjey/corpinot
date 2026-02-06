import { defineEventHandler, getQuery, createError } from 'h3'

function extractMeta(html: string) {
  const result: any = {}
  const ogTitle = /<meta[^>]+property=["']og:title["'][^>]*content=["']([^"']+)["']/i.exec(html)
  const ogImage = /<meta[^>]+property=["']og:image["'][^>]*content=["']([^"']+)["']/i.exec(html)
  const ogDesc = /<meta[^>]+property=["']og:description["'][^>]*content=["']([^"']+)["']/i.exec(html)
  const metaDesc = /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i.exec(html)
  const titleTag = /<title>([^<]+)<\/title>/i.exec(html)

  if (ogTitle) result.title = ogTitle[1]
  else if (titleTag) result.title = titleTag[1]

  if (ogImage) result.image = ogImage[1]
  if (ogDesc) result.description = ogDesc[1]
  else if (metaDesc) result.description = metaDesc[1]

  return result
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const url = (q.url as string) ?? ''
  if (!url) throw createError({ statusCode: 400, statusMessage: 'Missing url' })

  // Basic validation
  try {
    new URL(url)
  } catch (e) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid url' })
  }

  try {
    const res = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'Corpinot/LinkPreview (+https://example.com)' } })
    if (!res.ok) return { title: null, description: null, image: null }
    const text = await res.text()
    const meta = extractMeta(text)
    return { title: meta.title ?? null, description: meta.description ?? null, image: meta.image ?? null }
  } catch (e) {
    // If fetch failed, return nulls to allow graceful degrade on client
    return { title: null, description: null, image: null }
  }
})
