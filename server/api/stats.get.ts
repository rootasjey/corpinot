import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'

export default defineEventHandler(async () => {
  // total published posts
  const postsRes: any = await db
    .select({ count: sql`COUNT(*)` })
    .from(schema.posts)
    .where(eq(schema.posts.status, 'published'))

  const postsCount = Number(postsRes?.[0]?.count ?? 0)

  // projects are posts tagged with "project"
  const projectsRes: any = await db
    .select({ count: sql`COUNT(DISTINCT ${schema.posts.id})` })
    .from(schema.posts)
    .innerJoin(schema.post_tags, eq(schema.post_tags.post_id, schema.posts.id))
    .innerJoin(schema.tags, sql`${schema.tags.id} = ${schema.post_tags.tag_id}`)
    .where(sql`LOWER(${schema.tags.name}) = 'project'`)

  const projectsCount = Number(projectsRes?.[0]?.count ?? 0)

  // authors: total users and users who have published posts
  const authorsTotalRes: any = await db.select({ count: sql`COUNT(*)` }).from(schema.users)
  const authorsTotal = Number(authorsTotalRes?.[0]?.count ?? 0)

  const authorsWithPostsRes: any = await db
    .select({ count: sql`COUNT(DISTINCT ${schema.users.id})` })
    .from(schema.users)
    .innerJoin(schema.posts, eq(schema.posts.user_id, schema.users.id))
    .where(eq(schema.posts.status, 'published'))

  const authorsWithPosts = Number(authorsWithPostsRes?.[0]?.count ?? 0)

  return {
    posts: postsCount,
    projects: projectsCount,
    authorsTotal,
    authorsWithPosts,
  }
})