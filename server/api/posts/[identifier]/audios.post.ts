// POST /api/posts/[identifier]/audios
// Upload audios used inside the article/editor. Stored under posts/<id>/audios/
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
  if (post.user_id !== userId) throw createError({ statusCode: 403, message: 'You are not authorized to upload audios for this post' })

  const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/mp4', 'audio/m4a']

  try {
    const formData = await readMultipartFormData(event)
    const filePart = formData?.find(item => item.name === 'file')

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

    const audiosFolder = `posts/${post.id}/audios`

    // Create a blob and upload the audio
    const buffer = filePart.data as ArrayBuffer | Uint8Array | Buffer
    const blobFile = new Blob([new Uint8Array(buffer as any)], { type })

    const stored = await hb.put(`${audiosFolder}/${pathnameFile}`, blobFile, { addRandomSuffix: true })

    const storedPath = stored.pathname.replace(/^\/+/, '')
    const parts = storedPath.split('/')
    const filename = parts[parts.length - 1]

    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${post.id}/audios`)}`

    // Persist metadata about this inline audio so we can list and clean up later
    let audioRowId: number | null = null
    try {
      const size = (buffer as any)?.byteLength ?? null
      const insertResult: any = await database.insert(schema.post_audios).values({
        post_id: post.id,
        pathname: `/${storedPath}`,
        filename,
        content_type: type,
        size,
        in_use: false,
      }).run()

      const rawId = insertResult?.lastInsertRowid ?? insertResult?.meta?.last_row_id ?? null
      if (rawId != null) {
        if (typeof rawId === 'bigint') {
          audioRowId = Number(rawId)
        } else {
          audioRowId = Number(rawId)
        }
      } else {
        audioRowId = null
      }
    } catch (err) {
      console.warn('Failed to persist post_audios metadata:', err)
    }

    return {
      success: true,
      audio: {
        storedPath: `/${storedPath}`,
        id: audioRowId,
        src: servingUrl,
      },
    }
  } catch (error) {
    console.error('Failed to upload post audio', error)
    throw createError({ statusCode: 500, message: 'Failed to upload audio' })
  }
})