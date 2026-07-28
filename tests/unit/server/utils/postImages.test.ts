import { describe, expect, it, vi, beforeEach } from 'vitest'

const { blobMock } = vi.hoisted(() => {
  const del = vi.fn().mockResolvedValue(undefined)
  const list = vi.fn(({ prefix }: { prefix: string }) => {
    if (prefix?.includes('images')) return Promise.resolve({ blobs: [] })
    if (prefix?.includes('videos')) return Promise.resolve({ blobs: [] })
    if (prefix?.includes('audios')) return Promise.resolve({ blobs: [] })
    return Promise.resolve({ blobs: [] })
  })
  return { blobMock: { del, list } }
})

vi.mock('hub:blob', () => ({ blob: blobMock }))

vi.mock('hub:db', () => {
  return { db: {}, schema: { post_images: {}, post_videos: {}, post_audios: {} } }
})

import { cleanupOrphanPostImages } from '../../../../server/utils/postImages'

function createMockDb() {
  return {
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          run: vi.fn().mockResolvedValue({}),
        }),
      }),
    }),
    delete: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({}),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('cleanupOrphanPostImages', () => {
  it('returns deleted:0, preserved:0 for empty article with no blobs', async () => {
    blobMock.list.mockResolvedValue({ blobs: [] })

    const result = await cleanupOrphanPostImages(createMockDb(), 1, { type: 'doc', content: [] })

    expect(result).toEqual({ deleted: 0, preserved: 0 })
  })

  it('returns empty result for invalid post ID', async () => {
    const result = await cleanupOrphanPostImages(createMockDb(), NaN, {})
    expect(result).toEqual({ deleted: 0, preserved: 0 })
  })

  it('marks referenced images as in_use and preserves them', async () => {
    blobMock.list.mockImplementation(({ prefix }: { prefix: string }) => {
      if (prefix === 'posts/1/images') return Promise.resolve({ blobs: [{ pathname: 'posts/1/images/photo.jpg' }] })
      return Promise.resolve({ blobs: [] })
    })

    const article = {
      type: 'doc',
      content: [{
        type: 'image',
        attrs: { src: '/images/photo.jpg' },
      }],
    }

    const db = createMockDb()
    const result = await cleanupOrphanPostImages(db, 1, article)

    expect(result.preserved).toBe(1)
    expect(result.deleted).toBe(0)
    expect(blobMock.del).not.toHaveBeenCalled()
  })

  it('deletes blobs not referenced in article', async () => {
    blobMock.list.mockImplementation(({ prefix }: { prefix: string }) => {
      if (prefix === 'posts/1/images') return Promise.resolve({ blobs: [{ pathname: 'posts/1/images/orphan.jpg' }] })
      return Promise.resolve({ blobs: [] })
    })

    const db = createMockDb()
    const result = await cleanupOrphanPostImages(db, 1, { type: 'doc', content: [] })

    expect(result.deleted).toBe(1)
    expect(blobMock.del).toHaveBeenCalledWith('posts/1/images/orphan.jpg')
  })

  it('detects /posts/ prefixed references', async () => {
    blobMock.list.mockImplementation(({ prefix }: { prefix: string }) => {
      if (prefix === 'posts/1/images') return Promise.resolve({ blobs: [{ pathname: 'posts/1/images/doc.pdf' }] })
      return Promise.resolve({ blobs: [] })
    })

    const article = {
      type: 'doc',
      content: [{
        type: 'image',
        attrs: { src: '/posts/1/images/doc.pdf' },
      }],
    }

    const db = createMockDb()
    const result = await cleanupOrphanPostImages(db, 1, article)

    expect(result.preserved).toBe(1)
    expect(result.deleted).toBe(0)
  })

  it('collects video poster references', async () => {
    blobMock.list.mockImplementation(({ prefix }: { prefix: string }) => {
      if (prefix === 'posts/1/images') return Promise.resolve({ blobs: [{ pathname: 'posts/1/images/poster.jpg' }] })
      return Promise.resolve({ blobs: [] })
    })

    const article = {
      type: 'doc',
      content: [{
        type: 'video',
        attrs: { src: '/images/video.mp4', poster: '/images/poster.jpg' },
      }],
    }

    const db = createMockDb()
    const result = await cleanupOrphanPostImages(db, 1, article)

    expect(result.preserved).toBeGreaterThanOrEqual(1)
  })

  it('resets in_use flags for all media types on cleanup', async () => {
    blobMock.list.mockImplementation(() => Promise.resolve({ blobs: [] }))

    const db = createMockDb()
    await cleanupOrphanPostImages(db, 1, { type: 'doc' })

    expect(db.update).toHaveBeenCalledTimes(3)
  })
})
