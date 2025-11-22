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

  // Process current node, if it's an image
  if (node.type === 'image' && node.attrs && node.attrs.src) {
    const src = String(node.attrs.src).trim()
    if (!src) {
      // nothing to do
    } else if (src.startsWith('/images/')) {
      handleImagesPrefix(src)
    } else if (src.startsWith('/posts/')) {
      handlePostsPrefix(src)
    } else {
      // external URL or other source — just capture filename
      addFilename(src)
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
 * - Deletes blobs from hubBlob that are no longer referenced by the given article body
 * - Removes DB rows for deleted blobs
 *
 * @param db - Database instance (hubDatabase())
 * @param postId - numeric post id
 * @param articleJSON - the article JSON body to inspect for references
 * @param hb - optional hubBlob instance (if you prefer to pass one)
 */
export async function cleanupOrphanPostImages(db: any, postId: number | string, articleJSON: any) {
  const referencedFiles = new Set<string>()
  const referencedPaths = new Set<string>()
  collectImageSrcs(articleJSON, referencedFiles, referencedPaths)

  try {
    await db.prepare(`UPDATE post_images SET in_use = 0 WHERE post_id = ?`).bind(postId).run()
  } catch (err) {
    // non-fatal — keep going
  }

  const blobClient = hubBlob()
  const prefix = `posts/${postId}/images`
  const results = { deleted: 0, preserved: 0 }

  // Helpers: small, testable units so the main loop stays readable
  const markImageInUse = async (pathname: string, filename: string) => {
    try {
      await db.prepare(`UPDATE post_images SET in_use = 1 WHERE (pathname = ? OR filename = ?) AND post_id = ?`).bind(`/${pathname}`, filename, postId).run()
    } catch (err) {
      // non-fatal — keep going
    }
  }

  const deleteBlobAndRecord = async (pathname: string, filename: string) => {
    try {
      console.log('Deleting orphan image blob:', `/${pathname}`)
      await blobClient.delete(pathname)
      // await blobClient.delete(`/${pathname}`)
      results.deleted += 1
      // Also cleanup DB record if present
      try {
        await db.prepare(`DELETE FROM post_images WHERE (pathname = ? OR filename = ?) AND post_id = ?`).bind(`/${pathname}`, filename, postId).run()
      } catch (err) {
        // non-fatal — we deleted the blob, but DB cleanup failed
        console.warn('postImages: failed to delete DB record for', pathname, err)
      }
    } catch (err) {
      console.warn('Failed to delete orphan image', `/${pathname}`, err)
    }
  }

  try {
    const list = await blobClient.list({ prefix })
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

    try {
      await db.prepare(`UPDATE post_images SET in_use = 0 WHERE post_id = ? AND (in_use IS NULL OR in_use = 0)`).bind(postId).run()
    } catch (err) {
      // ignore
    }
  } catch (err) {
    console.warn('Failed to list post images for cleanup', err)
  }

  return results
}

export default cleanupOrphanPostImages
