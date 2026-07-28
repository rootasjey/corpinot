import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertPostTags } from '~~/server/utils/tags'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireWriteAccess(event)
    const body = await readBody(event)

    const name = String(body?.name || '').trim()
    if (!name) return apiError(event, 400, 'VALIDATION_ERROR', 'Post name is required')

    const postData = createPostData(body, user.id)
    postData.slug = await generateUniqueSlug(db, postData.slug)

    const result = await db.insert(schema.posts).values({
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

    const insertedId = Number((result as any)?.lastInsertRowid ?? 0)
    if (!insertedId) return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create post')

    const article = createArticle()
    const blobPath = `posts/${insertedId}/article.json`
    await blob.put(blobPath, JSON.stringify(article))
    await db.update(schema.posts).set({ blob_path: blobPath }).where(eq(schema.posts.id, insertedId)).run()

    let createdTags: any[] = []
    if (Array.isArray(body?.tags)) {
      createdTags = await upsertPostTags(db, insertedId, body.tags)
    }

    const post = convertApiToPost({ ...postData, id: insertedId, blob_path: blobPath, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as any, {
      tags: createdTags,
      article: JSON.stringify(article),
      userName: user.name,
    })

    return apiCreated(event, post)
  } catch (err: any) {
    console.error('[API v1] POST /posts error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to create post')
  }
})
