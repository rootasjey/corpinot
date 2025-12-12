import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiTag } from '~~/shared/types/tags'
import { ApiPost } from '~~/shared/types/post'
import { convertApiToPost, createArticle, createPostData, generateUniqueSlug } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'
import { unzipSync } from 'fflate'

const importPostSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(1000).optional(),
  tags: z.array(z.object({ name: z.string().min(1).max(50), category: z.string().max(50).optional() })).max(20).optional(),
  image: z.object({ src: z.string().optional(), alt: z.string().optional() }).optional(),
  article: z.any().optional(),
  language: z.string().optional(),
  status: z.enum(['draft','published','archived']).optional(),
})

// Allow either a direct post shape or an export wrapper like { exportedAt, post }
const importPayloadSchema = z.union([importPostSchema, z.object({ exportedAt: z.string().optional(), post: importPostSchema })])

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const blobStorage = blob

  // Detect multipart form-data (ZIP upload) or JSON payload
  const contentType = String(event.node.req.headers['content-type'] || '')
  let postBody: any
  let uploadedZipEntries: Record<string, Uint8Array> | null = null
  let parsedManifest: Record<string, any> | null = null
  if (contentType.startsWith('multipart/form-data')) {
    const form = await readFormData(event)
    const f = form.get('file') as any
    if (!f) throw createError({ statusCode: 400, message: 'Missing file in form data' })
    const arr = await f.arrayBuffer()
    const entries = unzipSync(new Uint8Array(arr))
    uploadedZipEntries = entries
    // Find post.json in entries
    const postEntryKey = Object.keys(entries).find(k => k.toLowerCase().endsWith('post.json'))
    if (!postEntryKey) throw createError({ statusCode: 400, message: 'ZIP does not include post.json' })
    const decoder = new TextDecoder()
    const rawPost = JSON.parse(decoder.decode(entries[postEntryKey]))
    // Parse manifest if present to get mapping from original URLs to zip paths
    const manifestKey = Object.keys(entries).find(k => k.toLowerCase().endsWith('manifest.json'))
    if (manifestKey) {
      try {
        parsedManifest = JSON.parse(decoder.decode(entries[manifestKey]))
      } catch (e) {
        console.warn('Failed to parse manifest.json from zip', e)
      }
    }
    const payload = rawPost && rawPost.post ? rawPost.post : rawPost
    postBody = importPostSchema.parse(payload)
  } else {
    const body = await readValidatedBody(event, importPayloadSchema.parse)
    const raw = body as any
    const payload = raw && raw.post ? raw.post : raw
    postBody = importPostSchema.parse(payload)
  }

  const userId = session.user.id
  const postData = createPostData(postBody, userId)
  // Ensure slug is unique to avoid DB constraint errors
  postData.slug = await generateUniqueSlug(db, postData.slug)

  // If image is provided in body, set it
  if (postBody.image?.src) {
    postData.image_src = postBody.image.src
    postData.image_alt = postBody.image?.alt ?? ''
  }
  if (postBody.language) postData.language = postBody.language
  if (typeof postBody.status === 'string') postData.status = postBody.status as any

  // Insert post without blob_path first
  let result: any
  try {
    result = await db.insert(schema.posts).values({
    description: postData.description,
    image_src: postData.image_src,
    image_alt: postData.image_alt,
    language: postData.language,
    links: postData.links,
    metrics_comments: postData.metrics_comments,
    metrics_likes: postData.metrics_likes,
    metrics_views: postData.metrics_views,
    name: postData.name,
    slug: postData.slug,
    user_id: postData.user_id,
    status: postData.status,
    }).run()
  } catch (e: any) {
    // Handle unique slug constraint gracefully
    if (e?.message && String(e.message).includes('UNIQUE') || String(e?.message || '').toLowerCase().includes('constraint')) {
      throw createError({ statusCode: 409, message: 'A post with that slug already exists' })
    }
    throw e
  }

  const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

  const createdApiPostRow = insertedId
    ? await db.query.posts.findFirst({ where: eq(schema.posts.id, insertedId) })
    : null

  if (!createdApiPostRow) {
    throw createError({ statusCode: 500, message: 'Failed to create post during import.' })
  }

  const createdApiPost = createdApiPostRow as ApiPost

  // Create the article blob using the post's ID if provided
  const article = postBody.article ?? createArticle()
  const blob_path = `posts/${createdApiPost.id}/article.json`
  await blobStorage.put(blob_path, typeof article === 'string' ? article : JSON.stringify(article))

  await db.update(schema.posts).set({ blob_path }).where(eq(schema.posts.id, createdApiPost.id as number)).run()
  createdApiPost.blob_path = blob_path

  // If ZIP entries were uploaded, store assets and rewrite article URLs
  if (uploadedZipEntries) {
    const urlMap: Record<string, string> = {}
    const decoder = new TextDecoder()
    for (const [zipKey, u8] of Object.entries(uploadedZipEntries)) {
      const lower = zipKey.toLowerCase()
      if (lower.endsWith('post.json') || lower.endsWith('manifest.json')) continue
      // Determine filename and create a safe blob path
      const parts = zipKey.split('/').filter(Boolean)
      const filename = parts[parts.length - 1]
      const safePath = `posts/${createdApiPost.slug}/${filename}`
      await blobStorage.put(safePath, u8)
      // Reconstruct a public URL that matches internal paths used in posts
      const newUrl = `/posts/${createdApiPost.slug}/${filename}`
      // When the original URL was inside a manifest, manifest maps src->zip path; otherwise use zipKey itself
      // If manifest maps original URLs to this zipKey path, use that mapping
      if (parsedManifest?.files) {
        for (const [origUrl, info] of Object.entries(parsedManifest.files)) {
          const zipPathInManifest = String((info as any).path || '')
          if (zipPathInManifest === zipKey || zipPathInManifest === `assets/${zipKey}` || zipPathInManifest === zipKey.replace(/^assets\//, '')) {
            urlMap[origUrl] = newUrl
          }
        }
      }
      // Always add sensible fallbacks
      urlMap[zipKey] = newUrl
      urlMap[`/${zipKey}`] = newUrl
      urlMap[filename] = newUrl
      urlMap[`assets/${zipKey}`] = newUrl
    }

    // Update article object by replacing old URLs with new ones
    const replaceUrlsRec = (obj: any) => {
      if (!obj || typeof obj !== 'object') return
      for (const key of Object.keys(obj)) {
        const val = obj[key]
        if (typeof val === 'string') {
          for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
            if (val.includes(oldUrl)) obj[key] = val.split(oldUrl).join(newUrl)
          }
        } else if (Array.isArray(val)) {
          for (const item of val) replaceUrlsRec(item)
        } else if (typeof val === 'object') {
          replaceUrlsRec(val)
        }
      }
    }

    try {
      const articleObj = typeof article === 'string' ? JSON.parse(article) : article
      replaceUrlsRec(articleObj)
      await blobStorage.put(blob_path, JSON.stringify(articleObj))
    } catch (err) {
      console.warn('Failed to rewrite article asset URLs after import', err)
    }
  }
  // Tags
  let createdTags: ApiTag[] = []
  if (Array.isArray(postBody.tags)) {
    createdTags = await upsertPostTags(db, createdApiPost.id, postBody.tags)
  }

  const post = convertApiToPost(createdApiPost, {
    tags: createdTags,
    article: typeof article === 'string' ? article : JSON.stringify(article),
    userName: session.user.name,
  })

  return post
})
