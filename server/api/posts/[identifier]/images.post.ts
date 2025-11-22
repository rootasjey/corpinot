// POST /api/posts/[identifier]/images
// Upload images used inside the article/editor. Stored under posts/<id>/images/
export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const db = hubDatabase()
  const hb = hubBlob()

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  const post: ApiPost | null = await getPostByIdentifier(db, identifier)
  if (!post) throw createError({ statusCode: 404, message: 'Post not found' })
  if (post.user_id !== userId) throw createError({ statusCode: 403, message: 'You are not authorized to upload images for this post' })

  const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp']

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

    const imagesFolder = `posts/${post.id}/images`

    // Create a blob and upload
    const buffer = filePart.data as ArrayBuffer | Uint8Array | Buffer
    const blob = new Blob([new Uint8Array(buffer as any)], { type })

    const stored = await hb.put(`${imagesFolder}/${pathnameFile}`, blob, { addRandomSuffix: true })

    // stored.pathname should be like 'posts/<id>/images/<filename>'
    const storedPath = stored.pathname.replace(/^\/+/, '')
    const parts = storedPath.split('/')
    const filename = parts[parts.length - 1]

    // Return a URL that the frontend can fetch via the existing /images route.
    // Example: /images/<filename>?relatedTo=posts&slug=1/images
    const servingUrl = `/images/${encodeURIComponent(filename)}?relatedTo=posts&slug=${encodeURIComponent(`${post.id}/images`)}`

    // Persist metadata about this inline image so we can list and clean up later
    let imageRowId: number | null = null
    try {
      const size = (buffer as any)?.byteLength ?? null
      const insertResult: any = await db.prepare(`
        INSERT INTO post_images (post_id, pathname, filename, content_type, size, in_use)
        VALUES (?, ?, ?, ?, ?, 0)
      `).bind(post.id, `/${storedPath}`, filename, type, size).run()
      imageRowId = insertResult?.meta?.last_row_id ?? null
    } catch (err) {
      // Non-fatal — we still consider the upload successful even if metadata insert fails
      console.warn('Failed to persist post_images metadata:', err)
    }

    return {
      success: true,
      image: {
        alt: originalName,
        // keep both the canonical stored path and the serving URL to be safe
        storedPath: `/${storedPath}`,
        id: imageRowId,
        src: servingUrl,
      },
    }
  } catch (error) {
    console.error('Failed to upload post image', error)
    throw createError({ statusCode: 500, message: 'Failed to upload image' })
  }
})
