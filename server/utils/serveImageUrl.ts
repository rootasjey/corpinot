import { joinURL } from 'ufo'

export function serveImageUrl(src?: string | null): string | undefined {
  if (!src) return undefined

  const baseURL = useRuntimeConfig().public.siteUrl
  console.log('[serveImageUrl] Input:', src, '| baseURL:', baseURL)

  // Handle posts/projects rewrite: /posts/.../image.png -> /images/<filename>?relatedTo=posts&slug=<slug>
  if (src.startsWith('/projects/') || src.startsWith('/posts/')) {
    const parts = src.split('/')
    const category = parts[1]
    const filename = parts[parts.length - 1]
    let slug = ''
    for (let i = 2; i < parts.length - 1; i++) {
      slug += parts[i]
      if (i < parts.length - 2) { slug += '/' }
    }
    const url = `/images/${filename}?relatedTo=${category}&slug=${slug}`
    const result = url.startsWith('/') ? joinURL(baseURL, url) : url
    console.log('[serveImageUrl] Post/Project result:', result)
    return result
  }

  // Handle user avatars: /users/1/avatar/original.png -> /images/original.png?relatedTo=users&slug=1/avatar
  if (src.startsWith('/users/')) {
    const parts = src.split('/')
    const filename = parts[parts.length - 1]
    let slug = ''
    for (let i = 2; i < parts.length - 1; i++) {
      slug += parts[i]
      if (i < parts.length - 2) { slug += '/' }
    }
    const url = `/images/${filename}?relatedTo=users&slug=${slug}`
    const result = url.startsWith('/') ? joinURL(baseURL, url) : url
    console.log('[serveImageUrl] User avatar result:', result)
    return result
  }

  // Fallback: return absolute URL to the raw src
  const result = joinURL(baseURL, src.replace(/^\/+/, ''))
  console.log('[serveImageUrl] Fallback result:', result)
  return result
}
