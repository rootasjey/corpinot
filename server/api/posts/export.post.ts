import { zip } from 'fflate'
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { convertApiToPost, getPostByIdentifier } from '~~/server/utils/post'

const collectImageUrls = (obj: any, out = new Set<string>()) => {
  if (!obj || typeof obj !== 'object') return out
  for (const key of Object.keys(obj)) {
    const val = (obj as any)[key]
    if (typeof val === 'string') {
      if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(val) || val.startsWith('/') || val.startsWith('http')) {
        out.add(val)
      }
    } else if (Array.isArray(val)) {
      for (const v of val) collectImageUrls(v, out)
    } else if (typeof val === 'object') {
      collectImageUrls(val, out)
    }
  }
  return out
}

const sanitizePath = (p: string) => {
  const clean = p.replace(/^[\\/]+/, '')
    .split('/')
    .filter(Boolean)
    .filter((seg) => seg !== '..')
    .join('/')
  return clean || 'asset'
}

const guessContentType = (urlOrName: string, fetchedType?: string | null) => {
  if (fetchedType) return fetchedType
  const ext = (urlOrName.split('?')[0].split('.').pop() || '').toLowerCase()
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
  }
  return map[ext] ?? 'application/octet-stream'
}

const makeUniquePath = (candidate: string, existing: Set<string>) => {
  if (!existing.has(candidate)) {
    existing.add(candidate)
    return candidate
  }
  let counter = 1
  let current = candidate
  while (existing.has(current)) {
    const extIdx = current.lastIndexOf('.')
    if (extIdx > -1) {
      const name = current.substring(0, extIdx)
      const ext = current.substring(extIdx)
      current = `${name}-${counter}${ext}`
    } else {
      current = `${candidate}-${counter}`
    }
    counter += 1
  }
  existing.add(current)
  return current
}

const exportBodySchema = z.object({
  identifiers: z.array(z.string().min(1)).min(1),
  format: z.enum(['zip', 'json']).optional().default('zip'),
  includeAssets: z.boolean().optional().default(true),
})

type ExportedPost = {
  apiPost: any
  post: any
}

type ManifestEntry = { path: string; size: number; contentType: string }

type CanExportArgs = { apiPost: any; session: any; isAdmin: boolean }

const canExportPost = ({ apiPost, session, isAdmin }: CanExportArgs) => {
  if (apiPost.status === 'published') return true
  if (!session?.user) return false
  if (isAdmin) return true
  return session.user.id === apiPost.user_id
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, exportBodySchema.parse)
  const session = await getUserSession(event)
  const isAdmin = session?.user?.role === 'admin'

  const identifiers = Array.from(new Set((body.identifiers || []).map((id) => decodeURIComponent(id))))
  if (identifiers.length === 0) {
    throw createError({ statusCode: 400, message: 'No post identifiers provided' })
  }

  const postsToExport: ExportedPost[] = []
  for (const identifier of identifiers) {
    const apiPost = await getPostByIdentifier(db, identifier)
    if (!apiPost) {
      throw createError({ statusCode: 404, message: `Post "${identifier}" not found` })
    }

    if (!canExportPost({ apiPost, session, isAdmin })) {
      throw createError({ statusCode: 403, message: `Not authorized to export post "${identifier}"` })
    }

    const articleBlob = apiPost.blob_path ? await blob.get(apiPost.blob_path as string) : null
    const article = await (articleBlob?.text?.() ?? '')

    const tagRows = await db
      .select({ tag: schema.tags })
      .from(schema.tags)
      .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
      .where(eq(schema.post_tags.post_id, apiPost.id))
      .orderBy(sql`post_tags.rowid ASC`)

    const post = convertApiToPost(apiPost, {
      tags: tagRows.map((row: any) => row.tag),
      article,
      userAvatar: (apiPost as any).user_avatar,
      userName: (apiPost as any).user_name,
    })

    postsToExport.push({ apiPost, post })
  }

  if (postsToExport.length === 0) {
    throw createError({ statusCode: 404, message: 'No posts available to export' })
  }

  const exportedAt = new Date().toISOString()

  if (body.format === 'json') {
    return {
      exportedAt,
      count: postsToExport.length,
      posts: postsToExport.map(({ post }) => ({
        ...post,
        article: post.article,
      })),
    }
  }

  // ZIP export path
  const res = event.node.res
  const filename = `posts-export-${exportedAt.replace(/[:.]/g, '-')}.zip`
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

  const files: Record<string, Uint8Array | string> = {}
  const assetBuffers: Record<string, Uint8Array> = {}
  const encoder = new TextEncoder()

  const globalManifest: { exportedAt: string; formatVersion: number; count: number; posts: Array<{ slug: string; id: number; path: string; manifest: string | null }> } = {
    exportedAt,
    formatVersion: 1,
    count: postsToExport.length,
    posts: [],
  }

  for (const { post } of postsToExport) {
    const slug = post.slug || `post-${post.id}`
    const postDir = `posts/${slug}`
    const postPath = `${postDir}/post.json`
    files[postPath] = JSON.stringify({ exportedAt, post }, null, 2)

    const manifestFiles: Record<string, ManifestEntry> = {}
    const existingPaths = new Set<string>()

    if (body.includeAssets) {
      const urls = new Set<string>()
      if (post.image?.src) urls.add(post.image.src)
      const imgs = collectImageUrls(post.article)
      for (const u of imgs) urls.add(u)

      for (const u of urls) {
        if (!u) continue
        if (u.startsWith('data:')) continue

        try {
          let blobPath = ''
          if (u.startsWith('/')) {
            const parsed = new URL(u, useRuntimeConfig().public.siteUrl)
            const pathname = parsed.pathname
            const search = parsed.searchParams
            if (pathname.startsWith('/images/')) {
              const filename = pathname.split('/').pop() || ''
              const relatedTo = search.get('relatedTo') || ''
              const slugParam = search.get('slug') || ''
              blobPath = `${relatedTo}/${slugParam}/${filename}`
            } else if (pathname.startsWith('/posts/') || pathname.startsWith('/projects/')) {
              const parts = pathname.split('/').filter(Boolean)
              const category = parts[0]
              const filename = parts[parts.length - 1]
              const slugParts = parts.slice(1, parts.length - 1)
              const slugFromUrl = slugParts.join('/')
              blobPath = `${category}/${slugFromUrl}/${filename}`
            }
          } else {
            const parsed = new URL(u)
            const pathname = parsed.pathname
            const search = parsed.searchParams
            if (pathname.startsWith('/images/')) {
              const filename = pathname.split('/').pop() || ''
              const relatedTo = search.get('relatedTo') || ''
              const slugParam = search.get('slug') || ''
              blobPath = `${relatedTo}/${slugParam}/${filename}`
            } else if (pathname.startsWith('/posts/') || pathname.startsWith('/projects/')) {
              const parts = pathname.split('/').filter(Boolean)
              const category = parts[0]
              const filename = parts[parts.length - 1]
              const slugParts = parts.slice(1, parts.length - 1)
              const slugFromUrl = slugParts.join('/')
              blobPath = `${category}/${slugFromUrl}/${filename}`
            }
          }

          let buffer: Uint8Array | null = null
          let contentType = ''
          if (blobPath) {
            try {
              const b = await blob.get(blobPath)
              const maybeArrayBuffer = await (b?.arrayBuffer?.() ? b.arrayBuffer() : b?.text?.())
              let buf: Buffer
              if (maybeArrayBuffer instanceof ArrayBuffer) buf = Buffer.from(maybeArrayBuffer)
              else buf = Buffer.from(String(maybeArrayBuffer))
              buffer = Uint8Array.from(buf as any)
              contentType = guessContentType(blobPath)
            } catch (err) {
              buffer = null
            }
          }

          if (!buffer) {
            try {
              const fetched = await fetch(u)
              if (!fetched.ok) continue
              const arr = await fetched.arrayBuffer()
              buffer = Uint8Array.from(new Uint8Array(arr as any))
              contentType = fetched.headers.get('content-type') ?? ''
            } catch (e) {
              console.warn('export: failed to fetch asset', u, e)
              continue
            }
          }

          if (!buffer) continue

          const suggested = sanitizePath(blobPath || new URL(u, useRuntimeConfig().public.siteUrl).pathname)
          const baseName = (suggested.split('/').pop() || `asset-${slug}`)
          const uniquePath = makeUniquePath(`${postDir}/assets/${baseName}`, existingPaths)
          assetBuffers[uniquePath] = buffer
          manifestFiles[u] = { path: uniquePath, size: buffer.length, contentType: guessContentType(baseName, contentType) }
        } catch (e) {
          console.warn('export: failed to process asset', u, e)
        }
      }

      files[`${postDir}/manifest.json`] = JSON.stringify({
        files: manifestFiles,
        meta: {
          id: post.id,
          title: post.name,
          description: post.description,
          slug: post.slug,
          exportedAt,
        },
      }, null, 2)
    }

    globalManifest.posts.push({ slug: post.slug, id: post.id, path: postPath, manifest: body.includeAssets ? `${postDir}/manifest.json` : null })
  }

  files['manifest.json'] = JSON.stringify(globalManifest, null, 2)

  for (const [zipPath, u8] of Object.entries(assetBuffers)) {
    files[zipPath] = u8
  }

  const finalFiles: Record<string, Uint8Array | string> = {}
  for (const k of Object.keys(files)) {
    const v = (files as any)[k]
    if (!k || typeof k !== 'string') continue
    if (typeof v === 'string') finalFiles[k] = encoder.encode(v)
    else if (v instanceof Uint8Array) finalFiles[k] = v
  }

  zip(finalFiles as any, { level: 6 }, (err: any, data: Uint8Array) => {
    if (err) {
      console.error('Failed to create zip', err)
      try { res.statusCode = 500 } catch (_e) { /* ignore */ }
      res.end()
      return
    }
    res.end(Buffer.from(data))
  })
})
