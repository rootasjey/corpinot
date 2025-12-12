// POST /api/posts/create
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiTag } from '~~/shared/types/tags'
import { ApiPost } from '~~/shared/types/post'
import { convertApiToPost, createArticle, createPostData, generateUniqueSlug } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'

const createPostSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  tags: z.array(z.object({
    name: z.string().min(1).max(50),
    category: z.string().max(50).optional()
  })).max(20).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const blobStorage = blob
  const body = await readValidatedBody(event, createPostSchema.parse)

  const userId = session.user.id
  const postData = createPostData(body, userId)
  // Ensure slug is unique to avoid DB constraint errors
  postData.slug = await generateUniqueSlug(db, postData.slug)

  // Insert post without blob_path first
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

  const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

  const createdApiPostRow = insertedId
    ? await db.query.posts.findFirst({ where: eq(schema.posts.id, insertedId) })
    : null

  if (!createdApiPostRow) { 
    throw createError({ statusCode: 500, message: 'Failed to fetch created post.' }) 
  }

  const createdApiPost = createdApiPostRow as ApiPost

  // Now create the article blob using the post's ID
  const article = createArticle()
  const blob_path = `posts/${createdApiPost.id}/article.json`
  await blobStorage.put(blob_path, JSON.stringify(article))

  await db.update(schema.posts).set({ blob_path }).where(eq(schema.posts.id, createdApiPost.id as number)).run()

  createdApiPost.blob_path = blob_path

  // --- TAGS: Process tags after post insert ---
  let createdTags: ApiTag[] = []
  if (Array.isArray(body.tags)) {
    createdTags = await upsertPostTags(db, createdApiPost.id, body.tags)
  }

  const post = convertApiToPost(createdApiPost, {
    tags: createdTags,
    article: JSON.stringify(article),
    userName: session.user.name,
  })

  return post
})