import { describe, expect, it } from 'vitest'
import { createPostData, createArticle, convertApiToPost } from '../../../../server/utils/post'
import type { ApiPost } from '../../../../shared/types/post'

describe('createPostData', () => {
  it('creates a post with default values from minimal body', () => {
    const post = createPostData({ name: 'Hello World' }, 1)
    expect(post.name).toBe('Hello World')
    expect(post.slug).toBe('hello-world')
    expect(post.user_id).toBe(1)
    expect(post.status).toBe('draft')
    expect(post.language).toBe('en')
    expect(post.description).toBe('')
    expect(post.blob_path).toBe('')
    expect(post.image_src).toBe('')
    expect(post.links).toBe('[]')
  })

  it('uses default name when body is empty', () => {
    const post = createPostData({}, 1)
    expect(post.name).toBe('New Post')
    expect(post.slug).toBe('new-post')
  })

  it('passes through provided status', () => {
    const post = createPostData({ name: 'Test', status: 'published' }, 1)
    expect(post.status).toBe('published')
  })

  it('removes diacritics from slug', () => {
    const post = createPostData({ name: 'Déjà vu' }, 1)
    expect(post.slug).toBe('deja-vu')
  })

  it('falls back to "post" slug when name is only special chars', () => {
    const post = createPostData({ name: '!!!' }, 1)
    expect(post.slug).toBe('post')
  })
})

describe('createArticle', () => {
  it('returns a default doc structure', () => {
    const article = createArticle()
    expect(article.type).toBe('doc')
    expect(article.content).toHaveLength(1)
    expect(article.content[0].type).toBe('paragraph')
    expect(article.content[0].content[0].type).toBe('text')
  })
})

describe('convertApiToPost', () => {
  const apiPost: ApiPost = {
    id: 1,
    blob_path: 'posts/abc-123',
    created_at: '2024-01-01T00:00:00.000Z',
    description: 'A test post',
    image_alt: 'Test image',
    image_ext: 'jpg',
    image_src: '/images/test.jpg',
    language: 'en',
    links: JSON.stringify([{ href: 'https://example.com', name: 'Example' }]),
    metrics_comments: 5,
    metrics_likes: 10,
    metrics_views: 100,
    name: 'Test Post',
    published_at: '2024-01-02T00:00:00.000Z',
    slug: 'test-post',
    status: 'published',
    translation_group_id: null,
    updated_at: '2024-01-03T00:00:00.000Z',
    user_id: 42,
  }

  it('converts ApiPost to Post format', () => {
    const post = convertApiToPost(apiPost)
    expect(post.id).toBe(1)
    expect(post.name).toBe('Test Post')
    expect(post.slug).toBe('test-post')
    expect(post.language).toBe('en')
    expect(post.status).toBe('published')
  })

  it('maps metrics correctly', () => {
    const post = convertApiToPost(apiPost)
    expect(post.metrics).toEqual({ comments: 5, likes: 10, views: 100 })
  })

  it('maps image fields', () => {
    const post = convertApiToPost(apiPost)
    expect(post.image).toEqual({
      alt: 'Test image',
      ext: 'jpg',
      src: '/images/test.jpg',
    })
  })

  it('parses JSON links', () => {
    const post = convertApiToPost(apiPost)
    expect(post.links).toEqual([{ href: 'https://example.com', name: 'Example' }])
  })

  it('maps tags when provided', () => {
    const post = convertApiToPost(apiPost, {
      tags: [{ id: 1, name: 'vue', category: 'framework', description: '', created_at: '', updated_at: '' }],
    })
    expect(post.tags).toHaveLength(1)
    expect(post.tags[0].name).toBe('vue')
  })

  it('defaults to empty tags array when not provided', () => {
    const post = convertApiToPost(apiPost)
    expect(post.tags).toEqual([])
  })

  it('includes user info when provided', () => {
    const post = convertApiToPost(apiPost, { userName: 'Alice', userAvatar: '/avatar.png' })
    expect(post.user?.name).toBe('Alice')
    expect(post.user?.avatar).toBe('/avatar.png')
    expect(post.user?.id).toBe(42)
  })
})
