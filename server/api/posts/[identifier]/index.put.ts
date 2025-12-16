// PUT /api/posts/[identifier]/index.put.ts
import { db, schema } from 'hub:db'
import { and, eq, ne, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'

// Local type to represent the API post merged with a few optional user fields
type ApiPostWithUser = ApiPost & {
  user_avatar?: string | null
  user_name?: string | null
  user_slug?: string | null
}

const updatePostSchema = z.object({
  // Allow partial updates — make `name` optional for metadata-only updates
  // (e.g. updating just the slug). Creating a post still requires a name, but
  // updates should permit changing any subset of fields.
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  tags: z.array(z.object({
    name: z.string().min(1).max(50),
    category: z.string().max(50).optional(),
    description: z.string().max(500).optional(),
  })).max(20).optional(),
  language: z.enum(['en', 'fr', 'es', 'de', 'it']).optional(),
  slug: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const database = db

  if (!identifier) {
    throw createError({
      statusCode: 400,
      message: 'Post identifier is required',
    })
  }

  const validatedBody = await readValidatedBody(event, updatePostSchema.parse)
  const apiPost: ApiPostWithUser | null = await getPostByIdentifier(database, identifier)

  handlePostErrors(apiPost, userId)

  // Check for slug uniqueness if slug is being updated
  if (validatedBody.slug && validatedBody.slug !== apiPost.slug) {
    const slugExists = await database.query.posts.findFirst({
      where: and(eq(schema.posts.slug, validatedBody.slug), ne(schema.posts.id, apiPost.id)),
      columns: { id: true },
    })

    if (slugExists) {
      throw createError({
        statusCode: 409,
        statusMessage: `Slug "${validatedBody.slug}" already exists for another post.`,
      })
    }
  }

  // Prepare update data
  const updateData: Record<string, any> = {}

  // Handle each field that might be updated
  if (validatedBody.name !== undefined) {
    updateData.name = validatedBody.name
  }

  if (validatedBody.description !== undefined) {
    updateData.description = validatedBody.description
  }

  if (validatedBody.language !== undefined) {
    updateData.language = validatedBody.language
  }

  if (validatedBody.slug !== undefined) {
    updateData.slug = validatedBody.slug
  }

  if (validatedBody.status !== undefined) {
    updateData.status = validatedBody.status

    if (validatedBody.status === 'published' && apiPost.status !== 'published') {
      updateData.published_at = new Date().toISOString()
    } else if (validatedBody.status !== 'published' && apiPost.status === 'published') {
      updateData.published_at = null
    }
  }

  if (!Object.keys(updateData).length) {
    return {
      success: true,
      message: 'No changes to update',
      post: apiPost,
    }
  }

  updateData.updated_at = new Date().toISOString()

  const updateResult = await database.update(schema.posts)
    .set(updateData)
    .where(and(eq(schema.posts.id, apiPost.id), eq(schema.posts.user_id, userId)))
    .run()

  const updatedRows = Number((updateResult as any)?.rowsAffected ?? (updateResult as any)?.meta?.changes ?? (updateResult as any)?.meta?.rows_written ?? 0)
  if (!updatedRows) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update post',
    })
  }

  // --- TAGS: Process tags after post update ---
  if (validatedBody.tags !== undefined) {
    await upsertPostTags(database, apiPost.id, validatedBody.tags)
  }

  // Fetch ALL tags for the post (not just created ones)
  const tagRows = await database
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, apiPost.id))
    .orderBy(sql`post_tags.rowid ASC`)

  const updatedPost = await database.query.posts.findFirst({
    where: eq(schema.posts.id, apiPost.id),
  })

  if (!updatedPost) {
    throw createError({ statusCode: 500, message: 'Failed to update post' })
  }

  const post = convertApiToPost(updatedPost as ApiPost, {
    tags: tagRows.map((row: any) => row.tag),
    userName: session.user.name,
  })

  return {
    message: 'Post updated successfully',
    post,
    success: true,
  }
})

function handlePostErrors(post: ApiPost | null, userId?: number): asserts post is ApiPost {
  if (!post) {
    throw createError({
      statusCode: 404,
      message: 'Post not found',
    })
  }
 
  if (post.user_id !== userId) {
    throw createError({
      statusCode: 403,
      message: 'You are not authorized to update this post',
    })
  }
}