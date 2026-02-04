import { sql, eq } from 'drizzle-orm'
import { schema } from 'hub:db'
import { ApiPost, Post } from "~~/shared/types/post"

/**
 * Creates a new post data object with default values for SQLite storage.
 *
 * @param body - The request body containing the post data.
 * @param userId - The ID of the user creating the post.
 * @returns A new post data object with default values.
 */
function sanitizeSlug(name: string) {
  // Normalize, remove accent marks, convert to lower-case, keep letters/numbers and hyphens
  // Collapse whitespace and punctuation into single hyphens and trim
  return name
    .toString()
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export const createPostData = (body: any, userId: number) => {
  const name = body?.name || "New Post"
  const slugBase = sanitizeSlug(name)
  return {
    blob_path: "",
    description: body?.description ?? "",
    image_src: "",
    image_alt: "",
    language: "en",
    links: JSON.stringify([]),
    metrics_comments: 0,
    metrics_likes: 0,
    metrics_views: 0,
    name,
    slug: slugBase || 'post',
    user_id: userId,
    status: body?.status ?? "draft",
  }
}

/**
 * Creates a new article in JSON format.
 *
 * @returns A JSON string representing the post content.
 */
export const createArticle = () => {
  return {
    "type": "doc",
    "content": [
      {
        "type": "paragraph",
        "content": [
          {
            "type": "text",
            "text": "«It's your place in the world; it's your life. Go on and do all you can with it, and make it the life you want to live.» — Mae Jemison"
          },
        ],
      },
    ],
  }
}

/**
 * Retrieve a post by numeric ID or slug.
 * @param db - The database instance.
 * @param identifier - The post ID (number or numeric string) or slug (string).
 * @returns The post object or null if not found.
 */
export async function getPostByIdentifier(db: any, identifier: string | number) {
  const isNumericId = typeof identifier === "number" || /^\d+$/.test(String(identifier))

  // If numeric id, query by id directly
  if (isNumericId) {
    const rows = await db
      .select({ post: schema.posts, user_avatar: schema.users.avatar, user_name: schema.users.name, user_slug: schema.users.slug })
      .from(schema.posts)
      .innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
      .where(eq(schema.posts.id, Number(identifier)))
      .limit(1)

    const row = (rows as any[])[0]
    if (!row) return null

    return {
      ...(row.post as ApiPost),
      user_avatar: row.user_avatar,
      user_name: row.user_name,
      user_slug: row.user_slug,
    }
  }

  // Try exact slug match first
  let rows = await db
    .select({ post: schema.posts, user_avatar: schema.users.avatar, user_name: schema.users.name, user_slug: schema.users.slug })
    .from(schema.posts)
    .innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
    .where(eq(schema.posts.slug, String(identifier)))
    .limit(1)

  let row = (rows as any[])[0]

  // If not found, try a sanitized slug fallback (handles punctuation/diacritics differences)
  if (!row) {
    const normalized = sanitizeSlug(String(identifier))
    if (normalized && normalized !== String(identifier)) {
      rows = await db
        .select({ post: schema.posts, user_avatar: schema.users.avatar, user_name: schema.users.name, user_slug: schema.users.slug })
        .from(schema.posts)
        .innerJoin(schema.users, eq(schema.users.id, schema.posts.user_id))
        .where(eq(schema.posts.slug, normalized))
        .limit(1)

      row = (rows as any[])[0]
    }
  }

  if (!row) return null

  // Merge post fields with optional user info to match previous shape
  return {
    ...(row.post as ApiPost),
    user_avatar: row.user_avatar,
    user_name: row.user_name,
    user_slug: row.user_slug,
  }
}

/**
 * Converts an API post object to a Post type.
 * @param apiPost - The API post object to convert.
 * @param options - Optional parameters for additional data.
 * @param options.tags - Array of tags to associate with the post.
 * @param options.article - JSON string of the article content.
 * @param options.userName - Name of the user who created the post.
 * @param options.userAvatar - Avatar URL of the user who created the post.
 * @returns - A Post object with the converted data.
 */
export function convertApiToPost(
  apiPost: ApiPost,
  options?: {
    tags?: Record<string, unknown>[]
    article?: string
    userName?: string
    userAvatar?: string
  }
): Post {
  return {
    article: JSON.parse(options?.article ?? JSON.stringify(createArticle())),
    blobPath: apiPost.blob_path ?? undefined,
    createdAt: apiPost.created_at,
    description: apiPost.description ?? "",
    id: apiPost.id,
    image: {
      alt: apiPost.image_alt ?? "",
      ext: apiPost.image_ext ?? "",
      src: apiPost.image_src ?? "",
    },
    language: apiPost.language,
    links: apiPost.links ? JSON.parse(apiPost.links) : [],
    metrics: {
      comments: apiPost.metrics_comments,
      likes: apiPost.metrics_likes,
      views: apiPost.metrics_views,
    },
    name: apiPost.name,
    publishedAt: apiPost.published_at ?? undefined,
    slug: apiPost.slug,
    status: apiPost.status,
    tags: (options?.tags || []).map(t => ({
      id: Number(t.id),
      name: String(t.name),
      category: typeof t.category === 'string' ? t.category : '',
      description: typeof (t as any).description === 'string' ? (t as any).description : '',
      created_at: t.created_at ? String(t.created_at) : '',
      updated_at: t.updated_at ? String(t.updated_at) : ''
    })),
    updatedAt: apiPost.updated_at,
    user: {
      id: apiPost.user_id,
      avatar: options?.userAvatar ?? "",
      name: options?.userName ?? "",
      slug: (apiPost as any).user_slug ?? undefined,
    },
  }
}

/**
 * Generate a unique slug by appending a numeric suffix if needed.
 * e.g. "my-slug", "my-slug-1", "my-slug-2"
 */
export async function generateUniqueSlug(db: any, baseSlug: string) {
  const base = (typeof baseSlug === 'string' ? sanitizeSlug(baseSlug) : '') || 'post'

  try {
    // Use LIKE on sanitized base (safe from SQL wildcard surprises)
    const rows = await db.select({ slug: schema.posts.slug }).from(schema.posts).where(sql`${schema.posts.slug} LIKE ${base + '%'} `)
    const existing = new Set<string>((rows as any[]).map((r: any) => String(r.slug)))
    if (!existing.has(base)) return base

    let max = 0
    for (const s of existing) {
      if (s === base) continue
      const m = s.match(new RegExp(`^${base.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')}-([0-9]+)$`))
      if (m) {
        const n = Number(m[1])
        if (!Number.isNaN(n) && n > max) max = n
      }
    }
    return `${base}-${max + 1}`
  } catch (err: any) {
    console.error('[generateUniqueSlug] Database error while checking existing slugs for base:', base, { message: err?.message, stack: err?.stack })
    throw err
  }
}
