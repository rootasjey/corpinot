import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiTag } from '~~/shared/types/tags'
import { ApiPost } from '~~/shared/types/post'
import { convertApiToPost, createArticle, createPostData, generateUniqueSlug } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'
import { unzipSync } from 'fflate'

const importPostSchema = z.object({
  name: z.string().min(1),
  description: z.string().max(1000).optional(),
  tags: z.array(z.object({ name: z.string().min(1).max(50), category: z.string().max(50).optional(), description: z.string().max(500).optional() })).max(20).optional(),
  image: z.object({ src: z.string().optional(), alt: z.string().optional() }).optional(),
  article: z.any().optional(),
  language: z.string().optional(),
  status: z.enum(['draft','published','archived']).optional(),
})

// Wrappers accepted during import
const singleWrapperSchema = z.object({ exportedAt: z.string().optional(), post: importPostSchema })
const multiWrapperSchema = z.object({ exportedAt: z.string().optional(), posts: z.array(z.union([importPostSchema, singleWrapperSchema])).min(1) })
const importPayloadSchema = z.union([
  importPostSchema,
  singleWrapperSchema,
  multiWrapperSchema,
  z.array(z.union([importPostSchema, singleWrapperSchema]))
])

type ImportCandidate = {
  postBody: z.infer<typeof importPostSchema>
  manifest?: Record<string, any> | null
  baseFolder: string
  assets: Record<string, Uint8Array>
}

const normalizeKey = (key: string) => key.replace(/^\.+\/?/, '').replace(/^\//, '')
const sanitizeFilename = (key: string) => {
  const parts = key.split('/').filter(Boolean)
  return parts[parts.length - 1] || 'asset'
}

const unwrapPost = (value: any) => (value && typeof value === 'object' && 'post' in value ? (value as any).post : value)

const normalizePayloadToArray = (raw: any) => {
  const parsed = importPayloadSchema.parse(raw)
  if (Array.isArray(parsed)) return parsed.map(unwrapPost)
  if ((parsed as any)?.posts) return (parsed as any).posts.map(unwrapPost)
  return [unwrapPost(parsed)]
}

const replaceUrlsRec = (obj: any, urlMap: Record<string, string>) => {
  if (!obj || typeof obj !== 'object') return
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key]
    if (typeof val === 'string') {
      for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
        if (val.includes(oldUrl)) (obj as any)[key] = val.split(oldUrl).join(newUrl)
      }
    } else if (Array.isArray(val)) {
      for (const item of val) replaceUrlsRec(item, urlMap)
    } else if (typeof val === 'object') {
      replaceUrlsRec(val, urlMap)
    }
  }
}

async function persistImportedPost(params: {
  postBody: z.infer<typeof importPostSchema>
  assets: Record<string, Uint8Array>
  manifest?: Record<string, any> | null
  userId: number
  userName?: string
}) {
  const { postBody, assets, manifest, userId, userName } = params
  const blobStorage = blob

  const postData = createPostData(postBody, userId)
  postData.slug = await generateUniqueSlug(db, postData.slug)

  if (postBody.image?.src) {
    postData.image_src = postBody.image.src
    postData.image_alt = postBody.image?.alt ?? ''
  }
  if (postBody.language) postData.language = postBody.language
  if (typeof postBody.status === 'string') postData.status = postBody.status as any

  let insertResult: any
  try {
    insertResult = await db.insert(schema.posts).values({
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
    if (e?.message && String(e.message).includes('UNIQUE') || String(e?.message || '').toLowerCase().includes('constraint')) {
      throw createError({ statusCode: 409, message: 'A post with that slug already exists' })
    }
    throw e
  }

  const insertedId = Number((insertResult as any)?.lastInsertRowid ?? (insertResult as any)?.meta?.last_row_id ?? 0)
  const createdApiPostRow = insertedId
    ? await db.query.posts.findFirst({ where: eq(schema.posts.id, insertedId) })
    : null

  if (!createdApiPostRow) {
    throw createError({ statusCode: 500, message: 'Failed to create post during import.' })
  }

  const createdApiPost = createdApiPostRow as ApiPost

  const article = postBody.article ?? createArticle()
  const blobPath = `posts/${createdApiPost.slug}/article.json`
  await blobStorage.put(blobPath, typeof article === 'string' ? article : JSON.stringify(article))
  await db.update(schema.posts).set({ blob_path: blobPath }).where(eq(schema.posts.id, createdApiPost.id as number)).run()
  createdApiPost.blob_path = blobPath

  const urlMap: Record<string, string> = {}
  if (assets && Object.keys(assets).length > 0) {
    const zipPathToUrl: Record<string, string> = {}
    for (const [zipKey, u8] of Object.entries(assets)) {
      const lower = zipKey.toLowerCase()
      if (lower.endsWith('post.json') || lower.endsWith('manifest.json')) continue
      const filename = sanitizeFilename(zipKey)
      const safePath = `posts/${createdApiPost.slug}/${filename}`
      await blobStorage.put(safePath, u8)
      const newUrl = `/posts/${createdApiPost.slug}/${filename}`
      const normalized = normalizeKey(zipKey)
      zipPathToUrl[normalized] = newUrl
      urlMap[zipKey] = newUrl
      urlMap[`/${zipKey}`] = newUrl
      urlMap[filename] = newUrl
      urlMap[`assets/${zipKey}`] = newUrl
    }

    const manifestFiles = (manifest as any)?.files || {}
    for (const [origUrl, info] of Object.entries(manifestFiles)) {
      const pathInZip = normalizeKey(String((info as any).path || ''))
      const mapped = zipPathToUrl[pathInZip]
      if (mapped) urlMap[origUrl] = mapped
    }
  }

  let finalArticleObj: any
  try {
    finalArticleObj = typeof article === 'string' ? JSON.parse(article) : article
  } catch (err) {
    finalArticleObj = createArticle()
  }

  if (Object.keys(urlMap).length > 0) {
    replaceUrlsRec(finalArticleObj, urlMap)
    if (postBody.image?.src && urlMap[postBody.image.src]) {
      postData.image_src = urlMap[postBody.image.src]
    }
    await blobStorage.put(blobPath, JSON.stringify(finalArticleObj))
  }

  // Persist updated cover if it changed due to asset rewrite
  if (postData.image_src) {
    await db.update(schema.posts)
      .set({ image_src: postData.image_src, image_alt: postBody.image?.alt ?? '' })
      .where(eq(schema.posts.id, createdApiPost.id))
      .run()
    createdApiPost.image_src = postData.image_src
    createdApiPost.image_alt = postBody.image?.alt ?? ''
  }

  // Tags
  let createdTags: ApiTag[] = []
  if (Array.isArray(postBody.tags)) {
    createdTags = await upsertPostTags(db, createdApiPost.id, postBody.tags)
  }

  const post = convertApiToPost(createdApiPost, {
    tags: createdTags,
    article: JSON.stringify(finalArticleObj),
    userName,
  })

  try {
    await db
      .update(schema.posts)
      .set({ metrics_views: sql`${schema.posts.metrics_views} + 0` })
      .where(eq(schema.posts.id, createdApiPost.id))
      .run()
  } catch (_err) {
    // No-op: avoid failing imports due to metrics update issues
  }

  return post
}

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const contentType = String(event.node.req.headers['content-type'] || '')

  let candidates: ImportCandidate[] = []

  if (contentType.startsWith('multipart/form-data')) {
    const form = await readFormData(event)
    const f = form.get('file') as any
    if (!f) throw createError({ statusCode: 400, message: 'Missing file in form data' })
    const arr = await f.arrayBuffer()
    const entries = unzipSync(new Uint8Array(arr))
    const decoder = new TextDecoder()

    const postKeys = Object.keys(entries).filter(k => k.toLowerCase().endsWith('post.json'))
    if (postKeys.length === 0) throw createError({ statusCode: 400, message: 'ZIP does not include post.json files' })

    const manifestByFolder: Record<string, any> = {}
    for (const key of Object.keys(entries)) {
      if (!key.toLowerCase().endsWith('manifest.json')) continue
      try {
        const base = key.split('/').slice(0, -1).join('/')
        manifestByFolder[base] = JSON.parse(decoder.decode(entries[key]))
      } catch (e) {
        console.warn('Failed to parse manifest.json from zip', e)
      }
    }

    candidates = postKeys.map((key) => {
      const baseFolder = key.split('/').slice(0, -1).join('/')
      const payload = JSON.parse(decoder.decode(entries[key]))
      const parsedPost = importPostSchema.parse(unwrapPost(payload))
      const manifest = manifestByFolder[baseFolder] || manifestByFolder[''] || null
      return { postBody: parsedPost, manifest, baseFolder, assets: {} }
    })

    const assetEntries = Object.entries(entries).filter(([k]) => {
      const lower = k.toLowerCase()
      return !lower.endsWith('post.json') && !lower.endsWith('manifest.json')
    })

    const findCandidateIndex = (path: string) => {
      let bestIdx = -1
      let bestLen = -1
      for (const [idx, c] of candidates.entries()) {
        if (c.baseFolder && path.startsWith(`${c.baseFolder}/`)) {
          if (c.baseFolder.length > bestLen) {
            bestLen = c.baseFolder.length
            bestIdx = idx
          }
        }
      }
      if (bestIdx === -1 && candidates.length === 1) return 0
      return bestIdx
    }

    for (const [zipKey, u8] of assetEntries) {
      const idx = findCandidateIndex(zipKey)
      if (idx === -1) continue
      candidates[idx].assets[zipKey] = u8
    }
  } else {
    const body = await readValidatedBody(event, importPayloadSchema.parse)
    const posts = normalizePayloadToArray(body)
    candidates = posts.map((p: z.infer<typeof importPostSchema>) => ({ postBody: importPostSchema.parse(p), manifest: null, baseFolder: '', assets: {} }))
  }

  if (candidates.length === 0) {
    throw createError({ statusCode: 400, message: 'No posts found in import payload' })
  }

  const created: any[] = []
  for (const candidate of candidates) {
    const post = await persistImportedPost({
      postBody: candidate.postBody,
      assets: candidate.assets,
      manifest: candidate.manifest,
      userId: session.user.id,
      userName: session.user.name,
    })
    created.push(post)
  }

  if (created.length === 1) return created[0]
  return { posts: created, count: created.length }
})
