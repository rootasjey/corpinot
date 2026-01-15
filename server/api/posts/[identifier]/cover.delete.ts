// DELETE /api/posts/[slug]/cover
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { ApiPost } from '~~/shared/types/post'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')

  let post: ApiPost | null = await getPostByIdentifier(database, identifier)

  handleErrors({ post, userId })
  post = post as ApiPost

  try {
    // image_src now stores a full file path like "/posts/1/cover/original.jpeg"
    // We want to delete the whole cover folder. Strip filename and leading slash.
    const imageSrc = (post.image_src || '').toString()
    const folderPrefix = imageSrc
      .replace(/^\/+/, '')           // remove leading '/'
      .replace(/\/[^\/]+$/, '')     // remove trailing filename
    const prefix = folderPrefix
    const blobList = await blob.list({ prefix })
    
    for (const blobItem of blobList.blobs) {
      await blob.del(blobItem.pathname)
    }

    await database
      .update(schema.posts)
      .set({ image_src: '', image_alt: '', image_ext: '', updated_at: new Date().toISOString() })
      .where(eq(schema.posts.id, post.id))
      .run()

    // Invalidate OG cache for this post (delete any cached OG images referencing this post slug)
    try {
      const { blobs } = await blob.list({ prefix: 'og/', limit: 1000 })
      for (const blobItem of blobs) {
        if (blobItem.pathname.includes(`/post/${post.slug}`) || blobItem.pathname.includes(`/post/${post.id}`)) {
          await blob.delete(blobItem.pathname)
        }
      }
    } catch (err) {
      console.warn('[cover.delete] Failed to invalidate OG cache for post:', post.id, err)
    }

    // Trigger synchronous OG regeneration to avoid first-request latency
    try {
      const baseUrl = useRuntimeConfig().public.siteUrl
      await $fetch(`${baseUrl}/og/post/${encodeURIComponent(post.slug)}.png`)
    } catch (err) {
      console.warn('[cover.delete] Failed to regenerate OG image for post:', post.id, err)
    }

    return { 
      success: true,
      message: 'Image removed successfully',
      post,
    }
  } catch (error) {
    console.log(error)
    return {
      error,
      success: false,
      message: 'Failed to remove image',
      post,
    }
  }
})

type HandleErrorsProps = {
  post: ApiPost | null
  userId: number
}

const handleErrors = ({ post, userId }: HandleErrorsProps) => {
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

  if (!post.image_src) {
    throw createError({
      statusCode: 400,
      message: 'Post does not have an image',
    })
  }
}