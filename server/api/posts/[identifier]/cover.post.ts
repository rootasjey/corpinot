// POST /api/posts/[slug]/cover
import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { Jimp } from "jimp"
import type { ApiPost } from '~~/shared/types/post'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const userId = session.user.id
  const database = db
  const hb = blob

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  const formData = await readMultipartFormData(event)
  
  const file = formData?.find(item => item.name === 'file')?.data
  const fileName = formData?.find(item => item.name === 'fileName')?.data.toString()
  const type = formData?.find(item => item.name === 'type')?.data.toString()

  if (!identifier || !file || !fileName || !type) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields',
    })
  }

  // Check if the file is an image
  if (type !== 'image/jpeg' && type !== 'image/png' && type !== 'image/bmp' 
    && type !== 'image/tiff' && type !== 'image/x-ms-bmp' && type !== 'image/gif') {
    throw createError({
      statusCode: 400,
      message: 'File must be an image',
    })
  }

  const post: ApiPost | null = await getPostByIdentifier(database, identifier)

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

  const extension = type.split('/')[1]
  const coverFolder = `posts/${post.id}/cover`

  // Process the original image with Jimp
  const originalImage = await Jimp.fromBuffer(file)

  const sizes = [
    { width: 160, suffix: 'xxs' },
    { width: 320, suffix: 'xs' },
    { width: 640, suffix: 'sm' },
    { width: 1024, suffix: 'md' },
    { width: 1920, suffix: 'lg' },
    // Original size will be stored as 'original'
  ]
  
  // Store all generated pathnames
  const generatedVariants = []

  // Upload original image
  const fileBlob = new Blob([new Uint8Array(file)], { type })
  const originalBlob = await hb.put(`original.${extension}`, fileBlob, {
    prefix: coverFolder,
  })

  generatedVariants.push({
    size: 'original',
    width: originalImage.width,
    height: originalImage.height,
    pathname: originalBlob.pathname
  })

  // Generate and upload resized versions
  for (const size of sizes) {
    const resized = originalImage.clone().resize({ w: size.width })
    const buffer = await resized.getBuffer(type)
    const resizedBlob = new Blob([new Uint8Array(buffer)], { type })
    const response = await hb
      .put(`${coverFolder}/${size.suffix}.${extension}`, resizedBlob, {
        addRandomSuffix: false,
      })

    generatedVariants.push({
      size: size.suffix,
      width: resized.width,
      height: resized.height,
      pathname: response.pathname
    })
  }

  // Persist the canonical image path (point to the original variant)
  const originalPath = `/${originalBlob.pathname.replace(/^\/+/, '')}`

  await database.update(schema.posts)
    .set({
      image_src: originalPath,
      image_alt: fileName,
      image_ext: extension,
      updated_at: new Date().toISOString(),
    })
    .where(eq(schema.posts.id, post.id))
    .run()

  // Invalidate any legacy OG blobs for this post, then trigger immediate regeneration
  try {
    const { blobs } = await hb.list({ prefix: 'og/', limit: 1000 })
    for (const blobItem of blobs) {
      if (blobItem.pathname.includes(`/post/${post.slug}`) || blobItem.pathname.includes(`/post/${post.id}`)) {
        await hb.delete(blobItem.pathname)
      }
    }
  } catch (err) {
    console.warn('[cover.post] Failed to invalidate OG cache for post:', post.id, err)
  }

  // Trigger synchronous OG regeneration to avoid first-request latency
  try {
    const baseUrl = useRuntimeConfig().public.siteUrl
    await $fetch(`${baseUrl}/og/post/${encodeURIComponent(post.slug)}.png`)
  } catch (err) {
    console.warn('[cover.post] Failed to regenerate OG image for post:', post.id, err)
  }

  return { 
    image: {
      alt: fileName,
      src: originalPath,
    },
    success: true, 
  }
})