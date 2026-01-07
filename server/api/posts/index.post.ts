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
    category: z.string().max(50).optional(),
    description: z.string().max(500).optional(),
  })).max(20).optional(),
})

export default defineEventHandler(async (event) => {
  try {
    const session = await requireUserSession(event)
    const blobStorage = blob
    
    let body
    try {
      body = await readValidatedBody(event, createPostSchema.parse)
    } catch (validationError: any) {
      console.error('[POST /api/posts] Validation error:', validationError)
      throw createError({ 
        statusCode: 400, 
        message: `Invalid request data: ${validationError.message || 'Validation failed'}` 
      })
    }

    const userId = session.user.id
    const postData = createPostData(body, userId)
    
    // Ensure slug is unique to avoid DB constraint errors
    try {
      postData.slug = await generateUniqueSlug(db, postData.slug)
    } catch (slugError: any) {
      console.error('[POST /api/posts] Failed to generate unique slug:', slugError)
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to generate post slug. Please try again.' 
      })
    }

    // Insert post without blob_path first
    let result
    try {
      result = await db.insert(schema.posts).values({
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
    } catch (dbError: any) {
      console.error('[POST /api/posts] Database insert failed:', dbError)
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to create post in database. Please try again.' 
      })
    }

    const insertedId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)

    if (!insertedId) {
      console.error('[POST /api/posts] No insertedId returned from database')
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to retrieve created post ID.' 
      })
    }

    const createdApiPostRow = await db.query.posts.findFirst({ where: eq(schema.posts.id, insertedId) })

    if (!createdApiPostRow) {
      console.error('[POST /api/posts] Failed to fetch created post with ID:', insertedId)
      throw createError({ 
        statusCode: 500, 
        message: 'Post created but could not be retrieved. Please refresh the page.' 
      })
    }

    const createdApiPost = createdApiPostRow as ApiPost

    // Now create the article blob using the post's ID
    const article = createArticle()
    const blob_path = `posts/${createdApiPost.id}/article.json`
    
    try {
      await blobStorage.put(blob_path, JSON.stringify(article))
    } catch (blobError: any) {
      console.error('[POST /api/posts] Blob storage failed:', blobError)
      // Try to clean up the created post
      await db.delete(schema.posts).where(eq(schema.posts.id, createdApiPost.id as number)).run().catch(() => {})
      throw createError({ 
        statusCode: 500, 
        message: 'Failed to create article content. Please try again.' 
      })
    }

    try {
      await db.update(schema.posts).set({ blob_path }).where(eq(schema.posts.id, createdApiPost.id as number)).run()
    } catch (updateError: any) {
      console.error('[POST /api/posts] Failed to update blob_path:', updateError)
      // Non-critical error, we can continue
    }

    createdApiPost.blob_path = blob_path

    // --- TAGS: Process tags after post insert ---
    let createdTags: ApiTag[] = []
    if (Array.isArray(body.tags)) {
      try {
        createdTags = await upsertPostTags(db, createdApiPost.id, body.tags)
      } catch (tagsError: any) {
        console.error('[POST /api/posts] Failed to process tags:', tagsError)
        // Non-critical error, we can continue without tags
      }
    }

    const post = convertApiToPost(createdApiPost, {
      tags: createdTags,
      article: JSON.stringify(article),
      userName: session.user.name,
    })

    return post
  } catch (error: any) {
    // If it's already a createError, rethrow it
    if (error.statusCode) {
      throw error
    }
    
    // Log unexpected errors with full details
    console.error('[POST /api/posts] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })
    
    throw createError({ 
      statusCode: 500, 
      message: 'An unexpected error occurred while creating the post. Please try again or contact support if the problem persists.' 
    })
  }
})