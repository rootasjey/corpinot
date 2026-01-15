import { eq, and, count } from 'drizzle-orm'
import { z } from 'zod'
import { blob } from 'hub:blob'
import { db } from 'hub:db'
import { renderOgHtml } from '~~/server/utils/og'
import { serveImageUrl } from '~~/server/utils/serveImageUrl'
import { posts, users, tags, post_tags } from '~~/server/db/schema' 

/**
 * OG Image Generator Route
 * 
 * Generates Open Graph images dynamically using Cloudflare Browser Rendering.
 * Supports: home, post, author, tag pages.
 * 
 * URLs:
 * - /og-home-default.png
 * - /og-post-{slug}.png
 * - /og-author-{authorName}.png
 * - /og-tag-{tagName}.png
 * 
 * Images are cached in R2 at og/{type}/{slug} and served with strong cache headers.
 */
export default defineEventHandler(async (event) => {
  // Get route params
  const type = getRouterParam(event, 'type')
  const slug = getRouterParam(event, 'slug')
  
  if (!type || !slug) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing type or slug parameter',
    })
  }

  // Validate type
  if (!['home', 'post', 'author', 'tag'].includes(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid OG type. Must be: home, post, author, or tag',
    })
  }

  // Validate slug format (should end with .png)
  if (!/\.png$/.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid slug format. Must end with .png',
    })
  }

  // Remove .png extension from slug
  const slugWithoutExt = slug.replace(/\.png$/, '')
  const styleVersion = useRuntimeConfig().public.ogStyleVersion || '1'

  // Fetch OG data early for use during generation
  const data = await fetchOgData(type, slugWithoutExt)

  // Deterministic cache key (overwrite on updates)
  const cacheKey = `og/v${styleVersion}/${type}/${slug}`

  try {
    // Check if image exists in R2 cache
    const cachedImage = await blob.head(cacheKey)
    
    // Serve cached image if it exists and is fresh (< 7 days)
    if (cachedImage) {
      const cacheAge = Date.now() - new Date(cachedImage.uploadedAt).getTime()
      const maxAge = 7 * 24 * 60 * 60 * 1000 // 7 days
      
      if (cacheAge < maxAge) {
        return blob.serve(event, cacheKey)
      }
    }

    // Generate new OG image
    const imageBuffer = await generateOgImage(type, slugWithoutExt, data)

    // Store in R2
    await blob.put(cacheKey, imageBuffer, {
      contentType: 'image/png',
    })

    // Serve the image (short TTL to allow cache-busting on update)
    setHeader(event, 'Content-Type', 'image/png')
    setHeader(event, 'Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return imageBuffer
  } catch (error) {
    console.error('OG image generation error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { message: errorMessage, stack: errorStack })
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to generate OG image: ${errorMessage}`,
      data: { originalError: errorMessage }
    })
  }
})

/**
 * Generate OG image buffer using Cloudflare Browser Rendering
 */
async function generateOgImage(type: string, slug: string, dataParam?: any): Promise<Buffer> {
  // Use provided data if available (we may have already fetched it to compute cache keys)
  const data = dataParam ?? await fetchOgData(type, slug)
  
  // Render HTML template
  const html = renderOgHtml(type, data) 

  try {
    // Use Cloudflare Browser to screenshot
    const { browser, page } = await hubBrowser({ keepAlive: 30 })
    
    try {
      await page.setViewport({ width: 1200, height: 630 })
      await page.setContent(html, { waitUntil: 'networkidle0' })
      
      const screenshot = await page.screenshot({
        type: 'png',
        clip: { x: 0, y: 0, width: 1200, height: 630 }
      })

      return Buffer.from(screenshot)
    } finally {
      await page.close().catch(() => {})
      browser.disconnect()
    }
  } catch (browserError) {
    console.error('Browser rendering failed, using fallback:', browserError)
    // In dev mode, if browser fails, return a simple placeholder
    if (import.meta.dev) {
      return generateFallbackImage(type, data)
    }
    throw browserError
  }
}

/**
 * Generate a simple fallback OG image (for dev when browser isn't available)
 */
async function generateFallbackImage(type: string, data: any): Promise<Buffer> {
  // Dynamically import Jimp and handle ESM/CJS differences safely
  const jimpModule = await import('jimp') as any
  const Jimp = jimpModule.default ?? jimpModule.Jimp ?? jimpModule
  
  // Create 1200x630 image with gradient-like effect (dark background)
  const image = new Jimp(1200, 630, 0x0b1220ff)
  
  // Load font
  const font = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE)
  const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE)
  
  let title = ''
  let subtitle = ''
  
  switch (type) {
    case 'home':
      // For home fallback, keep minimal footer: only post count + site
      title = 'corpinot.cc'
      subtitle = 'Blogging at the edge of the world'
      break
    case 'post':
      title = data.title || 'Post'
      subtitle = data.description || ''
      break
    case 'author':
      title = data.name || 'Author'
      subtitle = data.biography || ''
      break
    case 'tag':
      title = `#${data.name || 'Tag'}`
      subtitle = data.description || ''
      break
  }
  
  // Add text
  if (type === 'home') {
    const postCountLabel = (data?.postCount || 0) + ' posts'
    image.print(fontSmall, 80, 520, postCountLabel, 1040)
    image.print(fontSmall, 80, 560, 'corpinot.cc', 1040)
    if (title) image.print(font, 80, 200, title, 1040)
    if (subtitle) image.print(fontSmall, 80, 320, subtitle, 1040)
  } else {
    if (title) image.print(font, 80, 200, title, 1040)
    if (subtitle) image.print(fontSmall, 80, 320, subtitle, 1040)
    image.print(fontSmall, 80, 550, 'corpinot.cc', 1040)
  }
  
  return image.getBufferAsync(Jimp.MIME_PNG)
}

/**
 * Fetch data for OG image generation based on type and slug
 */
async function fetchOgData(type: string, slug: string): Promise<any> {
  switch (type) {
    case 'home': {
      // Get total published posts count
      const postCountResult = await db
        .select({ count: count() })
        .from(posts)
        .where(eq(posts.status, 'published'))
      
      return {
        title: 'Corpinot',
        description: 'Personal thoughts shared openly',
        postCount: postCountResult[0]?.count || 0,
      }
    }

    case 'post': {
      // Fetch post with author and tags (include image and updated_at)
      const post = await db
        .select({
          id: posts.id,
          name: posts.name,
          description: posts.description,
          publishedAt: posts.published_at,
          authorName: users.name,
          authorAvatar: users.avatar,
          imageSrc: posts.image_src,
          updatedAt: posts.updated_at,
        })
        .from(posts)
        .innerJoin(users, eq(posts.user_id, users.id))
        .where(eq(posts.slug, slug))
        .limit(1)

      if (!post.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Post not found',
        })
      }

      // Fetch tags for this post
      const postTags = await db
        .select({ name: tags.name })
        .from(post_tags)
        .innerJoin(tags, eq(post_tags.tag_id, tags.id))
        .where(eq(post_tags.post_id, post[0].id))
        .limit(4)

      // Build absolute cover URL with resize modifiers (1200x630)
      const coverSrc = post[0].imageSrc || undefined
      const coverUrlRaw = coverSrc ? serveImageUrl(coverSrc) : undefined
      const coverUrl = coverUrlRaw
        ? (coverUrlRaw.includes('?') ? (coverUrlRaw + '&w=1200&h=630&fit=cover') : (coverUrlRaw + '?w=1200&h=630&fit=cover'))
        : undefined

      return {
        title: post[0].name,
        description: post[0].description || '',
        author: {
          name: post[0].authorName,
          avatar: post[0].authorAvatar || undefined,
        },
        publishedAt: post[0].publishedAt || undefined,
        tags: postTags.map((t: { name: string }) => t.name),
        cover: coverUrl,
        updatedAt: post[0].updatedAt || undefined,
      }
    }

    case 'author': {
      // Fetch author by name (slug is author name)
      const author = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          biography: users.biography,
          job: users.job,
          location: users.location,
        })
        .from(users)
        .where(eq(users.name, slug))
        .limit(1)

      if (!author.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Author not found',
        })
      }

      // Count author's published posts
      const postCountResult = await db
        .select({ count: count() })
        .from(posts)
        .where(and(
          eq(posts.user_id, author[0].id),
          eq(posts.status, 'published')
        ))

      return {
        name: author[0].name,
        avatar: author[0].avatar || undefined,
        biography: author[0].biography,
        job: author[0].job || undefined,
        location: author[0].location || undefined,
        postCount: postCountResult[0]?.count || 0,
      }
    }

    case 'tag': {
      // Fetch tag by name
      const tag = await db
        .select({
          id: tags.id,
          name: tags.name,
          description: tags.description,
          category: tags.category,
        })
        .from(tags)
        .where(eq(tags.name, slug))
        .limit(1)

      if (!tag.length) {
        throw createError({
          statusCode: 404,
          statusMessage: 'Tag not found',
        })
      }

      // Count posts with this tag
      const postCountResult = await db
        .select({ count: count() })
        .from(post_tags)
        .innerJoin(posts, eq(post_tags.post_id, posts.id))
        .where(and(
          eq(post_tags.tag_id, tag[0].id),
          eq(posts.status, 'published')
        ))

      return {
        name: tag[0].name,
        description: tag[0].description,
        category: tag[0].category,
        postCount: postCountResult[0]?.count || 0,
      }
    }

    default:
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid OG type',
      })
  }
}
