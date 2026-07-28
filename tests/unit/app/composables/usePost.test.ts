import { describe, expect, it, vi } from 'vitest'

vi.mock('#app', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    useNuxtApp: () => ({
      $t: (key: string, params?: Record<string, unknown>) => {
        if (params?.minutes) return `${params.minutes} min read`
        if (key === 'components.postMeta.oneMinRead') return '1 min read'
        if (key === 'components.postMeta.postImageAlt') return 'Post image'
        return key
      },
      $getLocale: () => 'en',
      $ts: (key: string) => key,
      $i18nStrategy: 'prefix_except_default',
      $defaultLocale: 'en',
      $getLocales: () => [],
      $switchLocale: () => {},
      $localePath: () => '',
    }),
  }
})

import { usePost } from '../../../../app/composables/usePost'
import type { Post } from '../../../../shared/types/post'

describe('usePost', () => {
  const {
    extractTextFromTiptap,
    calculateReadingTime,
    getPostExcerpt,
    getPostImage,
    getPostImageAlt,
    isPublished,
    getTagNames,
  } = usePost()

  describe('extractTextFromTiptap', () => {
    it('returns empty string for null/undefined', () => {
      expect(extractTextFromTiptap(null)).toBe('')
      expect(extractTextFromTiptap(undefined)).toBe('')
    })

    it('extracts text from simple paragraph', () => {
      const doc = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'Hello world' }] },
        ],
      }
      expect(extractTextFromTiptap(doc).trim()).toBe('Hello world')
    })

    it('extracts text from nested structure', () => {
      const doc = {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'First' }] },
          { type: 'paragraph', content: [{ type: 'text', text: 'Second' }] },
        ],
      }
      expect(extractTextFromTiptap(doc).trim()).toBe('First Second')
    })

    it('handles empty content', () => {
      expect(extractTextFromTiptap({ type: 'doc', content: [] })).toBe('')
    })
  })

  describe('calculateReadingTime', () => {
    it('returns "1 min read" for null article', () => {
      expect(calculateReadingTime(undefined)).toBe('1 min read')
    })

    it('calculates reading time based on word count', () => {
      const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(' ')
      const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: words }] }] }
      expect(calculateReadingTime(doc)).toBe('2 min read')
    })
  })

  describe('getPostExcerpt', () => {
    it('uses description when available', () => {
      const post = { description: 'A short description' } as Post
      expect(getPostExcerpt(post)).toBe('A short description')
    })

    it('truncates long description', () => {
      const post = { description: 'x'.repeat(200) } as Post
      expect(getPostExcerpt(post, 50)).toBe('x'.repeat(50) + '...')
    })

    it('falls back to article text', () => {
      const post = {
        description: '',
        article: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'From article' }] }] },
      } as Post
      expect(getPostExcerpt(post, 160)).toContain('From article')
    })

    it('returns empty string when nothing available', () => {
      expect(getPostExcerpt({} as Post)).toBe('')
    })
  })

  describe('getPostImage', () => {
    it('returns image src when available', () => {
      const post = { image: { src: '/photo.jpg', alt: '', ext: '' } } as Post
      expect(getPostImage(post)).toBe('/photo.jpg')
    })

    it('returns placeholder when no image', () => {
      expect(getPostImage({} as Post)).toBe('/placeholder-image.jpg')
    })
  })

  describe('getPostImageAlt', () => {
    it('returns image alt when available', () => {
      const post = { image: { src: '/photo.jpg', alt: 'A photo', ext: 'jpg' } } as Post
      expect(getPostImageAlt(post)).toBe('A photo')
    })

    it('falls back to post name', () => {
      const post = { name: 'My Post', image: {} } as Post
      expect(getPostImageAlt(post)).toBe('My Post')
    })
  })

  describe('isPublished', () => {
    it('returns true when published and has publishedAt', () => {
      expect(isPublished({ status: 'published', publishedAt: '2024-01-01' } as Post)).toBe(true)
    })

    it('returns false when not published', () => {
      expect(isPublished({ status: 'draft' } as Post)).toBe(false)
    })

    it('returns false when published but no publishedAt', () => {
      expect(isPublished({ status: 'published' } as Post)).toBe(false)
    })
  })

  describe('getTagNames', () => {
    it('returns tag names array', () => {
      const post = { tags: [{ id: 1, name: 'vue', category: '', description: '', created_at: '', updated_at: '' }] } as Post
      expect(getTagNames(post)).toEqual(['vue'])
    })

    it('returns empty array when no tags', () => {
      expect(getTagNames({} as Post)).toEqual([])
    })
  })
})
