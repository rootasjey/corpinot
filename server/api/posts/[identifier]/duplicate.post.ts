// POST /api/posts/[identifier]/duplicate.post.ts
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost, createArticle, createPostData, getPostByIdentifier } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const database = db

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) {
    throw createError({ statusCode: 400, message: 'Post identifier is required' })
  }

  // Get source post
  const source = await getPostByIdentifier(database, identifier) as ApiPost | null
  if (!source) throw createError({ statusCode: 404, message: 'Source post not found' })

  const currentUser = session.user
  if (source.user_id !== currentUser.id && currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'You are not authorized to duplicate this post' })
  }

  // Create new post data (stored as draft by default for safety)
  const newName = `${source.name} (Copy)`
  // generate a unique slug by appending '-copy', '-copy-2' etc
  const baseSlug = `${source.slug}-copy`
  let newSlug = baseSlug
  let suffix = 1
  while (await database.query.posts.findFirst({ where: eq(schema.posts.slug, newSlug), columns: { id: true } })) {
    suffix += 1
    newSlug = `${baseSlug}-${suffix}`
  }

  const insertData: any = {
    name: newName,
    description: source.description ?? '',
    image_src: '',
    image_alt: source.image_alt ?? '',
    image_ext: source.image_ext ?? '',
    language: source.language ?? 'en',
    links: source.links ?? JSON.stringify([]),
    metrics_comments: 0,
    metrics_likes: 0,
    metrics_views: 0,
    slug: newSlug,
    status: 'draft',
    user_id: session.user.id,
  }

  const result = await database.insert(schema.posts).values(insertData).run()
  const newId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

  if (!newId) throw createError({ statusCode: 500, message: 'Failed to create duplicate post' })

  // Fetch source tags explicitly (getPostByIdentifier doesn't return tags)
  const sourceTagRows = await database
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, source.id))
    .orderBy(sql`post_tags.rowid ASC`)
  const sourceTags = sourceTagRows.map((r: any) => r.tag)

  // Copy blobs from source prefix `posts/<sourceId>/` to new `posts/<newId>/` (if present)
  try {
    const prefix = `posts/${source.id}/`
    const listResult = await blob.list({ prefix })
    for (const item of listResult.blobs) {
      const srcPath = item.pathname
      // map to new path
      const newPath = srcPath.replace(`posts/${source.id}/`, `posts/${newId}/`)
      const blobData = await blob.get(srcPath)
      if (!blobData) continue
      const bytes = await blobData.arrayBuffer()
      await blob.put(newPath, bytes)

      // If this blob matches the source image_src, set the new image_src to the new path
      if (source.image_src && typeof source.image_src === 'string' && srcPath === source.image_src) {
        await database.update(schema.posts).set({ image_src: newPath, image_alt: source.image_alt, image_ext: source.image_ext }).where(eq(schema.posts.id, newId)).run()
      }
    }

    // Copy article blob if present (source.blob_path) and rewrite internal src references
    if (source.blob_path) {
      const articlePath = source.blob_path
      const articleBlob = await blob.get(articlePath)
      if (articleBlob) {
        const articleText = await articleBlob.text()
        // Parse article JSON
        let articleJSON: any
        try {
          articleJSON = JSON.parse(articleText)
        } catch (err) {
          // Fallback: copy raw article if parsing fails
          const newArticlePath = `posts/${newId}/article.json`
          const articleBytes = await articleBlob.arrayBuffer()
          await blob.put(newArticlePath, articleBytes)
          await database.update(schema.posts).set({ blob_path: newArticlePath }).where(eq(schema.posts.id, newId)).run()
          articleJSON = null
        }

        if (articleJSON) {
          // Walk article and rewrite any internal src paths from posts/<source.id>/ to posts/<newId>/
          const oldPrefix = `posts/${source.id}/`
          const newPrefix = `posts/${newId}/`

          const walkAndRewrite = (node: any) => {
            if (!node || typeof node !== 'object') return
            if (node.attrs && typeof node.attrs.src === 'string' && node.attrs.src.includes(oldPrefix)) {
              node.attrs.src = node.attrs.src.replace(oldPrefix, newPrefix)
            }
            if (node.attrs && typeof node.attrs.srcset === 'string' && node.attrs.srcset.includes(oldPrefix)) {
              node.attrs.srcset = node.attrs.srcset.split(oldPrefix).join(newPrefix)
            }
            // Children
            if (Array.isArray(node.content)) {
              for (const child of node.content) walkAndRewrite(child)
            }
          }

          // Top-level article content
          walkAndRewrite(articleJSON)

          const rewritten = JSON.stringify(articleJSON)
          const newArticlePath = `posts/${newId}/article.json`
          await blob.put(newArticlePath, rewritten)
          await database.update(schema.posts).set({ blob_path: newArticlePath }).where(eq(schema.posts.id, newId)).run()
        }
      }
    }
  } catch (err) {
    console.error('Error copying blobs for duplicate post:', err)
    // Rollback: remove created DB record and any copied blobs for this new post
    try {
      const deleteResult = await database.delete(schema.posts).where(eq(schema.posts.id, newId)).run()
      const prefixToDelete = `posts/${newId}/`
      const listAfter = await blob.list({ prefix: prefixToDelete })
      for (const b of listAfter.blobs) {
        await blob.del(b.pathname)
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup after duplicate error', cleanupErr)
    }
    throw createError({ statusCode: 500, message: 'Failed to duplicate post resources' })
  }

  // Duplicate tags
  const tagsToCopy = sourceTags || []
  if (Array.isArray(tagsToCopy) && tagsToCopy.length > 0) {
    await upsertPostTags(database, newId, tagsToCopy.map(t => ({ name: t.name, category: (t as any).category })))
  }

  // Fetch new post and return
  const createdApiPost = await database.query.posts.findFirst({ where: eq(schema.posts.id, newId) })
  if (!createdApiPost) throw createError({ statusCode: 500, message: 'Failed to fetch created duplicate post' })

  // Fetch tags for this post
  const tagRows = await database
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, newId))
    .orderBy(sql`post_tags.rowid ASC`)

  const post = convertApiToPost(createdApiPost as ApiPost, {
    tags: tagRows.map((row: any) => row.tag),
    userName: session.user.name,
  })

  return post
})
