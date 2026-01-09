import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { and, eq, or } from 'drizzle-orm'
type Database = typeof db
/**
 * Walk a tiptap-like node tree and collect referenced image filenames and stored paths
 */
const collectImageSrcs = (node: any, setFiles: Set<string>, setPaths: Set<string>) => {
  const isObject = (v: any) => typeof v === 'object' && v !== null

  if (!isObject(node)) return
  if (Array.isArray(node)) return node.forEach((n) => collectImageSrcs(n, setFiles, setPaths))

  const addFilename = (candidate: string | undefined) => {
    const name = (candidate || '').split('/').pop()?.split('?')[0] ?? ''
    if (name) setFiles.add(name)
  }

  const handleImagesPrefix = (src: string) => {
    const [pathPart, query] = src.split('?')
    addFilename(pathPart)
    if (!query) return

    try {
      const params = Object.fromEntries(new URLSearchParams(query)) as Record<string, string>
      if (params.relatedTo && params.slug) {
        const stored = `${params.relatedTo}/${params.slug}/${(pathPart || '').split('/').pop() || ''}`
        setPaths.add(stored.replace(/^\/+/, ''))
      }
    } catch (e) {
      // Ignore malformed query strings — still keep collected filenames
    }
  }

  const handlePostsPrefix = (src: string) => {
    const stored = src.replace(/^\/+/, '')
    setPaths.add(stored)
    addFilename(stored)
  }

  // Process current node: images and videos (video has src and optional poster)
  if ((node.type === 'image' || node.type === 'video') && node.attrs) {
    // Handle node src
    const src = String(node.attrs?.src || '').trim()
    if (src) {
      if (src.startsWith('/images/')) {
        handleImagesPrefix(src)
      } else if (src.startsWith('/posts/')) {
        handlePostsPrefix(src)
      } else {
        addFilename(src)
      }
    }

    // If video has a poster attribute, also collect that
    const poster = String(node.attrs?.poster || '').trim()
    if (poster) {
      if (poster.startsWith('/images/')) {
        handleImagesPrefix(poster)
      } else if (poster.startsWith('/posts/')) {
        handlePostsPrefix(poster)
      } else {
        addFilename(poster)
      }
    }
  }

  // Recurse through object or array children
  for (const value of Object.values(node)) {
    if (isObject(value) || Array.isArray(value)) collectImageSrcs(value, setFiles, setPaths)
  }
}

/**
 * Cleanup orphan images stored under posts/<id>/images.
 *
 * - Marks `in_use` flags in `post_images` table
 * - Deletes blobs from storage that are no longer referenced by the given article body
 * - Removes DB rows for deleted blobs
 *
 * @param database - Database instance (hub:db)
 * @param postId - numeric post id
 * @param articleJSON - the article JSON body to inspect for references
 */
export async function cleanupOrphanPostImages(database: Database, postId: number | string, articleJSON: any) {
  const referencedFiles = new Set<string>()
  const referencedPaths = new Set<string>()
  collectImageSrcs(articleJSON, referencedFiles, referencedPaths)

  const postIdNumber = Number(postId)
  if (!Number.isFinite(postIdNumber)) {
    return { deleted: 0, preserved: 0 }
  }

  try {
    await database
      .update(schema.post_images)
      .set({ in_use: false })
      .where(eq(schema.post_images.post_id, postIdNumber))
      .run()
  } catch (err) {
    // non-fatal — keep going
  }

  // Also reset any video in_use flags — we'll re-mark videos that are referenced later
  try {
    await database
      .update(schema.post_videos)
      .set({ in_use: false })
      .where(eq(schema.post_videos.post_id, postIdNumber))
      .run()
  } catch (err) {
    // non-fatal — keep going
  }

  const prefix = `posts/${postId}/images`
  const results = { deleted: 0, preserved: 0 }

  // Helpers: small, testable units so the main loop stays readable
  const markImageInUse = async (pathname: string, filename: string) => {
    try {
      await database
        .update(schema.post_images)
        .set({ in_use: true })
        .where(
          and(
            eq(schema.post_images.post_id, postIdNumber),
            or(eq(schema.post_images.pathname, `/${pathname}`), eq(schema.post_images.filename, filename))
          )
        )
        .run()
    } catch (err) {
      // non-fatal — keep going
    }
  }

  const deleteBlobAndRecord = async (pathname: string, filename: string) => {
    try {
      console.log('Deleting orphan image blob:', `/${pathname}`)
      await blob.del(pathname)
      // await blobClient.delete(`/${pathname}`)
      results.deleted += 1
      // Also cleanup DB record if present
      try {
        await database
          .delete(schema.post_images)
          .where(
            and(
              eq(schema.post_images.post_id, postIdNumber),
              or(eq(schema.post_images.pathname, `/${pathname}`), eq(schema.post_images.filename, filename))
            )
          )
          .run()
      } catch (err) {
        // non-fatal — we deleted the blob, but DB cleanup failed
        console.warn('postImages: failed to delete DB record for', pathname, err)
      }
    } catch (err) {
      console.warn('Failed to delete orphan image', `/${pathname}`, err)
    }
  }

  try {
    const list = await blob.list({ prefix })
    for (const blobItem of list.blobs) {
      const pathname = blobItem.pathname.replace(/^\/+/, '')
      const filename = pathname.split('/').pop() || ''
      const isReferenced = referencedPaths.has(pathname) || referencedFiles.has(filename)

      if (isReferenced) {
        results.preserved += 1
        await markImageInUse(pathname, filename)
        continue
      }

      await deleteBlobAndRecord(pathname, filename)
    }
  } catch (err) {
    console.warn('Failed to list post images for cleanup', err)
  }

  // Now handle video blobs under posts/<id>/videos in the same way, marking post_videos.in_use or deleting
  const videosPrefix = `posts/${postId}/videos`
  const markVideoInUse = async (pathname: string, filename: string) => {
    try {
      await database
        .update(schema.post_videos)
        .set({ in_use: true })
        .where(
          and(
            eq(schema.post_videos.post_id, postIdNumber),
            or(eq(schema.post_videos.pathname, `/${pathname}`), eq(schema.post_videos.filename, filename))
          )
        )
        .run()
    } catch (err) {
      // non-fatal — keep going
    }
  }

  const deleteVideoBlobAndRecord = async (pathname: string, filename: string) => {
    try {
      console.log('Deleting orphan video blob:', `/${pathname}`)
      await blob.del(pathname)
      results.deleted += 1
      try {
        await database
          .delete(schema.post_videos)
          .where(
            and(
              eq(schema.post_videos.post_id, postIdNumber),
              or(eq(schema.post_videos.pathname, `/${pathname}`), eq(schema.post_videos.filename, filename))
            )
          )
          .run()
      } catch (err) {
        console.warn('postVideos: failed to delete DB record for', pathname, err)
      }
    } catch (err) {
      console.warn('Failed to delete orphan video', `/${pathname}`, err)
    }
  }

  try {
    const list = await blob.list({ prefix: videosPrefix })
    for (const blobItem of list.blobs) {
      const pathname = blobItem.pathname.replace(/^\/+/, '')
      const filename = pathname.split('/').pop() || ''
      const isReferenced = referencedPaths.has(pathname) || referencedFiles.has(filename)

      if (isReferenced) {
        results.preserved += 1
        await markVideoInUse(pathname, filename)
        continue
      }

      await deleteVideoBlobAndRecord(pathname, filename)
    }
  } catch (err) {
    console.warn('Failed to list post videos for cleanup', err)
  }

  return results
}

export default cleanupOrphanPostImages
