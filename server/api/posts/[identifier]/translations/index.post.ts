import { blob } from 'hub:blob'
import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { ApiPost } from '~~/shared/types/post'
import { convertApiToPost, getPostByIdentifier } from '~~/server/utils/post'
import { upsertPostTags } from '~~/server/utils/tags'

function generateGroupId() {
  return crypto.randomUUID()
}

const createTranslationSchema = z.object({
  language: z.enum(['en', 'fr', 'es', 'de', 'it']),
  name: z.string().min(1).max(255).optional(),
})

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const database = db

  const identifier = decodeURIComponent(getRouterParam(event, 'identifier') ?? '')
  if (!identifier) throw createError({ statusCode: 400, message: 'Post identifier is required' })

  let body: any
  try {
    body = await readValidatedBody(event, createTranslationSchema.parse)
  } catch (validationError: any) {
    throw createError({ statusCode: 400, message: `Invalid request data: ${validationError.message}` })
  }

  const source = await getPostByIdentifier(database, identifier) as ApiPost | null
  if (!source) throw createError({ statusCode: 404, message: 'Source post not found' })

  const currentUser = session.user
  if (source.user_id !== currentUser.id && currentUser.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'You are not authorized to translate this post' })
  }

  if (source.language === body.language) {
    throw createError({ statusCode: 400, message: `A translation in ${body.language} already exists for this post` })
  }

  const groupId = source.translation_group_id || generateGroupId()

  const targetLanguage = body.language
  const newName = body.name || `${source.name} (${targetLanguage})`

  let newSlug = `${source.slug}-${targetLanguage}`
  let suffix = 1
  while (await database.query.posts.findFirst({ where: eq(schema.posts.slug, newSlug), columns: { id: true } })) {
    suffix += 1
    newSlug = `${source.slug}-${targetLanguage}-${suffix}`
  }

  const insertData: any = {
    name: newName,
    description: source.description ?? '',
    image_src: source.image_src ?? '',
    image_alt: source.image_alt ?? '',
    image_ext: source.image_ext ?? '',
    language: targetLanguage,
    links: source.links ?? JSON.stringify([]),
    metrics_comments: 0,
    metrics_likes: 0,
    metrics_views: 0,
    slug: newSlug,
    status: 'draft',
    translation_group_id: groupId,
    user_id: session.user.id,
    published_at: null,
  }

  const result = await database.insert(schema.posts).values(insertData).run()
  const newId = Number((result as any)?.lastInsertRowid ?? (result as any)?.meta?.last_row_id ?? 0)
  if (!newId) throw createError({ statusCode: 500, message: 'Failed to create translation' })

  // Update source post with group ID if it didn't have one
  if (!source.translation_group_id) {
    await database.update(schema.posts).set({ translation_group_id: groupId }).where(eq(schema.posts.id, source.id)).run()
  }

  // Copy tags
  const sourceTagRows = await database
    .select({ tag: schema.tags })
    .from(schema.tags)
    .innerJoin(schema.post_tags, eq(schema.post_tags.tag_id, schema.tags.id))
    .where(eq(schema.post_tags.post_id, source.id))
    .orderBy(sql`post_tags.rowid ASC`)
  const sourceTags = sourceTagRows.map((r: any) => r.tag)

  if (Array.isArray(sourceTags) && sourceTags.length > 0) {
    await upsertPostTags(database, newId, sourceTags.map(t => ({ name: t.name, category: (t as any).category })))
  }

  // Copy article blob
  try {
    if (source.blob_path) {
      const articleBlob = await blob.get(source.blob_path)
      if (articleBlob) {
        const articleBytes = await articleBlob.arrayBuffer()
        const newArticlePath = `posts/${newId}/article.json`
        await blob.put(newArticlePath, articleBytes)
        await database.update(schema.posts).set({ blob_path: newArticlePath }).where(eq(schema.posts.id, newId)).run()
      }
    }
  } catch (err) {
    console.error('Failed to copy article blob for translation:', err)
  }

  const createdApiPost = await database.query.posts.findFirst({ where: eq(schema.posts.id, newId) })
  if (!createdApiPost) throw createError({ statusCode: 500, message: 'Failed to fetch created translation' })

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
