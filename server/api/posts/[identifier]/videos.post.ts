// POST /api/posts/[identifier]/videos
// Upload videos used inside the article/editor. Stored under posts/<id>/videos/
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import type { ApiPost } from '~~/shared/types/post'
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const hb = blob

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const post: ApiPost | null = await getPostByIdentifier(database, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  if (post.user_id !== userId) throw createError({ statusCode: 403, message: 'You are not authorized to upload videos for this post' })

  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg']
  const allowedPosterTypes = ['image/png', 'image/jpeg', 'image/webp']

  try {
    const formData = await readMultipartFormData(event)
    const filePart = formData?.find(item => item.name === 'file')
    const posterPart = formData?.find(item => item.name === 'poster')

    if (!filePart || !filePart.data || !filePart.filename || !filePart.type) {
      throw createError({ statusCode: 400, message: 'Missing file upload' })
    }

    const type = filePart.type.toString()
    if (!allowedTypes.includes(type)) {
      throw createError({ statusCode: 400, message: 'Unsupported file type' })
    }

    // Sanitize filename and make it unique
    const originalName = filePart.filename.toString()
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-')
    const timestamp = Date.now()
    const pathnameFile = `${timestamp}-${safeName}`

    const videosFolder = `posts/${post.id}/videos`

    // Create a blob and upload the video
    const buffer = filePart.data as ArrayBuffer | Uint8Array | Buffer
    const blobFile = new Blob([new Uint8Array(buffer as any)], { type })

    const stored = await hb.put(`${videosFolder}/${pathnameFile}`, blobFile, { addRandomSuffix: true })

    const storedPath = stored.pathname.replace(/^\/+/, '')
    const parts = storedPath.split('/')
    const filename = parts[parts.length - 1]

    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${post.id}/videos`)}`

    // Optional poster upload
    let posterServingUrl: string | null = null
    let posterStoredPath: string | null = null
    let posterFilename: string | null = null

    if (posterPart && posterPart.data && posterPart.filename && posterPart.type) {
      const pType = posterPart.type.toString()
      if (allowedPosterTypes.includes(pType)) {
        const originalPosterName = posterPart.filename.toString()
        const safePosterName = originalPosterName.replace(/[^a-zA-Z0-9._-]/g, '-')
        const posterPathnameFile = `${timestamp}-${safePosterName}`
        const posterBuffer = posterPart.data as ArrayBuffer | Uint8Array | Buffer
        const posterBlobFile = new Blob([new Uint8Array(posterBuffer as any)], { type: pType })
        const storedPoster = await hb.put(`${videosFolder}/${posterPathnameFile}`, posterBlobFile, { addRandomSuffix: true })
        posterStoredPath = storedPoster.pathname.replace(/^\/+/, '')
        const posterParts = posterStoredPath.split('/')
        posterFilename = posterParts[posterParts.length - 1]
        posterServingUrl = `/images/${encodeURIComponent(posterFilename)}?relatedTo=posts&slug=${encodeURIComponent(`${post.id}/videos`)}`
      }
    }

    // Persist metadata about this inline video so we can list and clean up later
    let videoRowId: number | null = null
    try {
      const size = (buffer as any)?.byteLength ?? null
      const insertResult: any = await database.insert(schema.post_videos).values({
        post_id: post.id,
        pathname: `/${storedPath}`,
        filename,
        content_type: type,
        size,
        poster_path: posterStoredPath,
        poster_filename: posterFilename,
        in_use: false,
      }).run()

      // The DB client may return numeric IDs as BigInt; ensure we return a JSON-serializable value
      const rawId = insertResult?.lastInsertRowid ?? insertResult?.meta?.last_row_id ?? null
      if (rawId != null) {
        // Convert BigInt to number safely (row ids are small) or coerce other numeric-like values
        if (typeof rawId === 'bigint') {
          videoRowId = Number(rawId)
        } else {
          videoRowId = Number(rawId)
        }
      } else {
        videoRowId = null
      }
    } catch (err) {
      console.warn('Failed to persist post_videos metadata:', err)
    }

    return {
      success: true,
      video: {
        // keep both canonical stored path and serving URL
        storedPath: `/${storedPath}`,
        id: videoRowId,
        src: servingUrl,
        posterSrc: posterServingUrl ?? null,
      },
    }
  } catch (error) {
    console.error('Failed to upload post video', error)
    throw createError({ statusCode: 500, message: 'Failed to upload video' })
  }
})
