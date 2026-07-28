// GET /sitemap.xml — dynamic sitemap
import { db, schema } from 'hub:db'
import { desc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl

  const staticRoutes = [
    { loc: '/', changefreq: 'weekly', priority: '1.0' },
    { loc: '/about', changefreq: 'monthly', priority: '0.5' },
    { loc: '/credits', changefreq: 'monthly', priority: '0.3' },
    { loc: '/donate', changefreq: 'monthly', priority: '0.3' },
    { loc: '/posts', changefreq: 'daily', priority: '0.8' },
    { loc: '/tags', changefreq: 'weekly', priority: '0.6' },
    { loc: '/authors', changefreq: 'weekly', priority: '0.6' },
    { loc: '/projects', changefreq: 'weekly', priority: '0.6' },
    { loc: '/search', changefreq: 'monthly', priority: '0.2' },
  ]

  const posts = await db
    .select({ slug: schema.posts.slug, updated_at: schema.posts.updated_at, published_at: schema.posts.published_at })
    .from(schema.posts)
    .where(eq(schema.posts.status, 'published'))
    .orderBy(desc(schema.posts.published_at))

  const authors = await db
    .select({ slug: schema.users.slug, updated_at: schema.users.updated_at })
    .from(schema.users)
    .where(eq(schema.users.role, 'admin'))

  const xml = ['<?xml version="1.0" encoding="UTF-8"?>']
  xml.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')

  for (const route of staticRoutes) {
    xml.push(`  <url>`)
    xml.push(`    <loc>${escapeXml(siteUrl)}${route.loc}</loc>`)
    xml.push(`    <changefreq>${route.changefreq}</changefreq>`)
    xml.push(`    <priority>${route.priority}</priority>`)
    xml.push(`  </url>`)
  }

  for (const post of posts) {
    const lastmod = post.updated_at || post.published_at
    xml.push(`  <url>`)
    xml.push(`    <loc>${escapeXml(siteUrl)}/posts/${escapeXml(post.slug)}</loc>`)
    if (lastmod) xml.push(`    <lastmod>${formatDate(lastmod)}</lastmod>`)
    xml.push(`    <changefreq>monthly</changefreq>`)
    xml.push(`    <priority>0.9</priority>`)
    xml.push(`  </url>`)
  }

  for (const author of authors) {
    if (!author.slug) continue
    const lastmod = author.updated_at
    xml.push(`  <url>`)
    xml.push(`    <loc>${escapeXml(siteUrl)}/authors/${escapeXml(author.slug)}</loc>`)
    if (lastmod) xml.push(`    <lastmod>${formatDate(lastmod)}</lastmod>`)
    xml.push(`    <changefreq>weekly</changefreq>`)
    xml.push(`    <priority>0.7</priority>`)
    xml.push(`  </url>`)
  }

  xml.push('</urlset>')

  setHeader(event, 'Content-Type', 'application/xml')
  return xml.join('\n')
})

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}
