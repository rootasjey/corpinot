import type { Post } from '~~/shared/types/post'

export function useJsonld() {
  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl

  function website() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Corpinot',
      url: siteUrl,
      description: 'Personal thoughts shared openly on Corpinot',
    }
  }

  function article(post: Post) {
    const rawSrc = post.image?.src
    const imageUrl = rawSrc
      ? `${siteUrl}${rawSrc.startsWith('/') ? '' : '/'}${rawSrc}`
      : `${siteUrl}/og/post/${post.slug}.png`

    const authorName = (post.user as { name?: string } | undefined)?.name || 'Corpinot'

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.name,
      description: post.description || '',
      url: `${siteUrl}/posts/${post.slug}`,
      image: imageUrl,
      datePublished: post.publishedAt || post.createdAt,
      dateModified: post.updatedAt || post.publishedAt || post.createdAt,
      author: {
        '@type': 'Person',
        name: authorName,
      },
    }
  }

  function breadcrumbList(items: { name: string; url: string }[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: item.name,
        item: `${siteUrl}${item.url}`,
      })),
    }
  }

  return { website, article, breadcrumbList }
}
