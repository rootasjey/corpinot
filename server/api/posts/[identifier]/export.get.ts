// GET /api/posts/[identifier]/export.get.ts
// @ts-ignore: some runtimes may not have type defs yet (installed via dependencies)
import { zip } from 'fflate'
import { blob } from 'hub:blob'
import { db } from 'hub:db'
import { getPostByIdentifier, convertApiToPost } from '~~/server/utils/post'

// helper: walk JSON to collect image URLs
const collectImageUrls = (obj: any, out = new Set<string>()) => {
  if (!obj || typeof obj !== 'object') return out
  for (const key of Object.keys(obj)) {
    const val = obj[key]
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
  const clean = p.replace(/^[\\/]+/, '') // trim leading slashes
    .split('/')
    .filter(Boolean)
    .filter((seg) => seg !== '..') // remove traversal segments
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

export default defineEventHandler(async (event) => {
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const session = await getUserSession(event)

  const apiPost = await getPostByIdentifier(db, identifier)
  if (!apiPost) throw createError({ statusCode: 404, message: 'Post not found' })

  // Only author or a published post can be exported
  if (apiPost.status !== 'published' && (!session || session.user?.id !== apiPost.user_id)) {
    throw createError({ statusCode: 403, message: 'Not authorized to export this post' })
  }

  // Fetch article blob
  const articleBlob = await blob.get(apiPost.blob_path as string)
  const article = await (articleBlob?.text?.() ?? '')

  // Build the post object as returned by GET
  const post = convertApiToPost(apiPost, { article: article ?? JSON.stringify({}) })

  // Prepare files map to pass to `fflate.zip`.
  const filenameSlug = post.slug || `post-${post.id}`
  const res = event.node.res
  res.setHeader('Content-Type', 'application/zip')
  res.setHeader('Content-Disposition', `attachment; filename="${filenameSlug}.zip"`)

  const files: Record<string, Uint8Array | string> = {}
  files['post.json'] = JSON.stringify({ exportedAt: new Date().toISOString(), post }, null, 2)

  // Hold asset binaries before zipping
  const assetBuffers: Record<string, Uint8Array> = {}

  const encoder = new TextEncoder()

  // Collect assets
  const urls = new Set<string>()
  if (post.image?.src) urls.add(post.image.src)
  const imgs = collectImageUrls(post.article)
  for (const u of imgs) urls.add(u)

  const manifest: Record<string, { path: string; size: number; contentType: string }> = {}
  const existingPaths = new Set<string>()
  let idx = 0

  for (const u of urls) {
    if (!u) continue
    // Skip data URI images
    if (u.startsWith('data:')) continue

    // Determine if URL is site-internal or external
    try {
      let blobPath = ''
      if (u.startsWith('/')) {
        // e.g., /posts/slug/filename OR /images/filename?relatedTo=posts&slug=slug
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
          const slug = slugParts.join('/')
          blobPath = `${category}/${slug}/${filename}`
        } else {
          // Fallback: treat as external (we'll fetch)
          blobPath = ''
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
          const slug = slugParts.join('/')
          blobPath = `${category}/${slug}/${filename}`
        }
      }

      let fileNameInZip = ''
      if (blobPath) {
        // Attempt to read from blob storage
        try {
          const b = await blob.get(blobPath)
            const maybeArrayBuffer = await (b?.arrayBuffer?.() ? b.arrayBuffer() : b?.text?.())
            let buf: Buffer
            if (maybeArrayBuffer instanceof ArrayBuffer) buf = Buffer.from(maybeArrayBuffer)
            else buf = Buffer.from(String(maybeArrayBuffer))
          const zipPath = `assets/${sanitizePath(blobPath)}`
          // ensure unique name
          let uniquePath = zipPath
          let counter = 1
          while (existingPaths.has(uniquePath)) {
            const extIdx = uniquePath.lastIndexOf('.')
            if (extIdx > -1) {
              const name = uniquePath.substring(0, extIdx)
              const ext = uniquePath.substring(extIdx)
              uniquePath = `${name}-${counter}${ext}`
            } else {
              uniquePath = `${uniquePath}-${counter}`
            }
            counter += 1
          }
          existingPaths.add(uniquePath)
          const u8 = Uint8Array.from(buf as any)
          assetBuffers[uniquePath] = u8
          const size = u8.length
          const contentType = guessContentType(uniquePath)
          manifest[u] = { path: uniquePath, size, contentType }
        } catch (e) {
          // fallback to external fetch
          const fetched = await fetch(u)
          if (fetched.ok) {
            const arr = await fetched.arrayBuffer()
            const base = sanitizePath(new URL(u).pathname)
            let uniquePath = `assets/${base}`
            let counter = 1
            while (existingPaths.has(uniquePath)) {
              const extIdx = uniquePath.lastIndexOf('.')
              if (extIdx > -1) {
                const name = uniquePath.substring(0, extIdx)
                const ext = uniquePath.substring(extIdx)
                uniquePath = `${name}-${counter}${ext}`
              } else {
                uniquePath = `${uniquePath}-${counter}`
              }
              counter += 1
            }
            existingPaths.add(uniquePath)
            const buf2 = Uint8Array.from(new Uint8Array(arr as any))
            assetBuffers[uniquePath] = buf2
            const contentType = fetched.headers.get('content-type') ?? guessContentType(uniquePath)
            manifest[u] = { path: uniquePath, size: buf2.length, contentType }
          }
        }
      } else {
        // Try to fetch remote URL
        try {
          const fetched = await fetch(u)
          if (!fetched.ok) continue
          const arr = await fetched.arrayBuffer()
          const base = sanitizePath(new URL(u).pathname)
          let uniquePath = `assets/${base}`
          let counter = 1
          while (existingPaths.has(uniquePath)) {
            const extIdx = uniquePath.lastIndexOf('.')
            if (extIdx > -1) {
              const name = uniquePath.substring(0, extIdx)
              const ext = uniquePath.substring(extIdx)
              uniquePath = `${name}-${counter}${ext}`
            } else {
              uniquePath = `${uniquePath}-${counter}`
            }
            counter += 1
          }
          existingPaths.add(uniquePath)
          const buf3 = Uint8Array.from(new Uint8Array(arr as any))
          assetBuffers[uniquePath] = buf3
          const contentType = fetched.headers.get('content-type') ?? guessContentType(uniquePath)
          manifest[u] = { path: uniquePath, size: buf3.length, contentType }
        } catch (e) {
          console.warn('Failed to fetch remote asset', u, e)
        }
      }
    } catch (e) {
      console.warn('Failed to process asset', u, e)
    }
    idx += 1
  }

  // Add author metadata if present
  const meta = {
    id: post.id,
    title: post.name,
    description: post.description,
    slug: post.slug,
    exportedAt: new Date().toISOString(),
    author: post.user?.name ?? null,
  }

  // Attach manifest.json
  files['manifest.json'] = JSON.stringify({ files: manifest, meta }, null, 2)

  // Append assets into files map
  for (const [zipPath, u8] of Object.entries(assetBuffers)) {
    files[zipPath] = u8
  }

  // Normalize files so all values are string or Uint8Array (no nested objects)
  for (const k of Object.keys(files)) {
    const v = (files as any)[k]
    if (typeof v === 'string') continue
    if (v instanceof Uint8Array) continue
    // Convert Buffer to Uint8Array if present
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer(v)) {
      (files as any)[k] = Uint8Array.from(v as any)
      continue
    }
    // Fallback to JSON-stringify any object values and log for debugging
    console.warn(`export: normalizing non-binary file entry for zip: ${k} (type=${typeof v})`);
    (files as any)[k] = JSON.stringify(v);
  }

  // Debug: report file entry types to help diagnose zipping issues
  try {
    for (const k of Object.keys(files)) {
      const v = (files as any)[k]
      const isUint8 = v instanceof Uint8Array
        console.debug(`export: zip entry '${k}' type='${typeof v}' isUint8=${isUint8}`);
    }
  } catch (e) {
    console.debug('export: failed to dump files map for debug', e)
  }

  // Prune invalid entries (avoid nested objects or empty names) and prepare final files map
  const finalFiles: Record<string, Uint8Array | string> = {}
  for (const k of Object.keys(files)) {
    const v = (files as any)[k]
    if (!k || typeof k !== 'string') {
      console.warn('export: skipping invalid filename in zip:', k)
      continue
    }
    if (k.endsWith('/')) {
      console.warn('export: skipping directory-like entry in zip:', k)
      continue
    }
    if (typeof v === 'string') {
      finalFiles[k] = encoder.encode(v)
    } else if (v instanceof Uint8Array) {
      finalFiles[k] = v
    } else {
      console.warn('export: skipping non-string/binary file for zip:', k)
    }
  }

  // Generate ZIP bytes asynchronously and send
  zip(finalFiles as any, { level: 6 }, (err: any, data: Uint8Array) => {
    if (err) {
      console.error('Failed to create zip', err)
      try { res.statusCode = 500 } catch (e) { /* ignore */ }
      res.end()
      return
    }
    res.end(Buffer.from(data))
  })
})
