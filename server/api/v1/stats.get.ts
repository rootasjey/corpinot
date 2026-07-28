import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    const postsRes: any = await db
      .select({ count: sql`COUNT(*)` })
      .from(schema.posts)
      .where(eq(schema.posts.status, 'published'))

    const postsCount = Number(postsRes?.[0]?.count ?? 0)

    const projectsRes: any = await db
      .select({ count: sql`COUNT(DISTINCT ${schema.posts.id})` })
      .from(schema.posts)
      .innerJoin(schema.post_tags, eq(schema.post_tags.post_id, schema.posts.id))
      .innerJoin(schema.tags, sql`${schema.tags.id} = ${schema.post_tags.tag_id}`)
      .where(sql`LOWER(${schema.tags.name}) = 'project'`)

    const projectsCount = Number(projectsRes?.[0]?.count ?? 0)

    const authorsTotalRes: any = await db.select({ count: sql`COUNT(*)` }).from(schema.users)
    const authorsTotal = Number(authorsTotalRes?.[0]?.count ?? 0)

    const authorsWithPostsRes: any = await db
      .select({ count: sql`COUNT(DISTINCT ${schema.users.id})` })
      .from(schema.users)
      .innerJoin(schema.posts, eq(schema.posts.user_id, schema.users.id))
      .where(eq(schema.posts.status, 'published'))

    const authorsWithPosts = Number(authorsWithPostsRes?.[0]?.count ?? 0)

    return apiSuccess(event, {
      posts: postsCount,
      projects: projectsCount,
      authorsTotal,
      authorsWithPosts,
    })
  } catch (err: any) {
    console.error('[API v1] GET /stats error:', err?.message || err)
    return apiError(event, 500, 'INTERNAL_ERROR', 'Failed to fetch stats')
  }
})
