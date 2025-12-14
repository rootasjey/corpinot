import { db, schema } from 'hub:db'
import { and, like, sql, desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q || query.search || '')
  if (!q.trim()) {
    return { posts: [], tags: [] }
  }

  const qNorm = q.trim().toLowerCase()
  const pattern = `%${qNorm}%`

  const postsRaw = await db
    .select({ post: schema.posts })
    .from(schema.posts)
    .where(and(sql`(LOWER(posts.name) LIKE ${pattern} OR LOWER(COALESCE(posts.description, '')) LIKE ${pattern})`, sql`posts.status = 'published'`))
    .orderBy(desc(schema.posts.created_at))
    .limit(80)

  const tagsRaw = await db
    .select({ tag: schema.tags })
    .from(schema.tags)
    .where(like(schema.tags.name, pattern))
    .orderBy(schema.tags.name)
    .limit(80)

  const authorsRaw = await db
    .select({ user: schema.users })
    .from(schema.users)
    .where(sql`(LOWER(users.name) LIKE ${pattern} OR LOWER(users.biography) LIKE ${pattern})`)
    .orderBy(schema.users.name)
    .limit(80)

  const scoredPosts = postsRaw
    .map((r: any) => {
      const name = r.post.name || ''
      const description = r.post.description || ''
      const score = baseScore(3) + textScore(name, qNorm) + textScore(description, qNorm) * 0.5
      return { type: 'post', id: r.post.id, name, slug: r.post.slug, description, score }
    })
    .filter((p: any) => p.score > 0)
    .sort(descByScore)
    .slice(0, 25)

  const scoredAuthors = authorsRaw
    .map((r: any) => {
      const name = r.user.name || ''
      const biography = r.user.biography || ''
      const score = baseScore(2) + textScore(name, qNorm) + textScore(biography, qNorm) * 0.3
      return { type: 'author', id: r.user.id, name, biography, score }
    })
    .filter((a: any) => a.score > 0)
    .sort(descByScore)
    .slice(0, 20)

  const scoredTags = tagsRaw
    .map((r: any) => {
      const name = r.tag.name || ''
      const score = baseScore(1) + textScore(name, qNorm)
      return { type: 'tag', id: r.tag.id, name, score }
    })
    .filter((t: any) => t.score > 0)
    .sort(descByScore)
    .slice(0, 20)

  return {
    posts: scoredPosts.map(stripScore),
    authors: scoredAuthors.map(stripScore),
    tags: scoredTags.map(stripScore),
  }
})

function textScore(text: string, query: string) {
  const t = text.toLowerCase()
  if (!t || !query) return 0
  let score = 0
  if (t === query) score += 80
  if (t.startsWith(query)) score += 50
  if (t.includes(query)) score += 30
  const idx = t.indexOf(query)
  if (idx >= 0) score += Math.max(20 - idx, 0)
  // shorter distance between lengths yields a small bonus
  score += Math.max(10 - Math.abs(t.length - query.length), 0)
  return score
}

function baseScore(weight: number) {
  return weight * 100
}

function descByScore(a: { score: number }, b: { score: number }) {
  return b.score - a.score
}

function stripScore<T extends { score: number }>(item: T) {
  const { score, ...rest } = item
  return rest
}

