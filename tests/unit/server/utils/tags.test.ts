import { describe, expect, it, vi, beforeEach } from 'vitest'
import { schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import { upsertPostTags } from '../../../../server/utils/tags'

vi.mock('hub:db', () => {
  const schema = {
    tags: {
      name: 'tags',
      id: 'id',
    },
    post_tags: {
      post_id: 'post_id',
      tag_id: 'tag_id',
    },
  }

  return { db: {}, schema }
})

function createMockDb() {
  return {
    query: {
      tags: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        run: vi.fn().mockResolvedValue({ lastInsertRowid: 1 }),
      }),
    }),
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

describe('upsertPostTags', () => {
  it('creates new tags and associates them with the post', async () => {
    const db = createMockDb()
    // First call returns null (tag doesn't exist), second call returns created tag
    db.query.tags.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 1, name: 'vue', description: '', created_at: '', updated_at: '', category: '' })

    await upsertPostTags(db, 1, [{ name: 'vue' }])

    expect(db.query.tags.findFirst).toHaveBeenCalledWith({
      where: eq(schema.tags.name, 'vue'),
    })
    // Called once for tags insert + once for post_tags
    expect(db.insert).toHaveBeenCalledTimes(2)
  })

  it('skips tag creation when tag already exists (only post_tags insert)', async () => {
    const db = createMockDb()
    db.query.tags.findFirst.mockResolvedValue({ id: 5, name: 'vue', description: '' })

    await upsertPostTags(db, 1, [{ name: 'vue' }])

    // insert only called for post_tags, not for tags
    expect(db.insert).toHaveBeenCalledWith(schema.post_tags)
    expect(db.insert).toHaveBeenCalledTimes(1)
  })

  it('updates description when existing tag has different description', async () => {
    const db = createMockDb()
    db.query.tags.findFirst.mockResolvedValue({ id: 5, name: 'vue', description: 'old' })

    await upsertPostTags(db, 1, [{ name: 'vue', description: 'new description' }])

    expect(db.update).toHaveBeenCalledWith(schema.tags)
  })

  it('handles multiple tags (existing and new)', async () => {
    const db = createMockDb()
    db.query.tags
      .findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 10, name: 'react', description: '' })

    await upsertPostTags(db, 1, [
      { name: 'vue' },
      { name: 'react' },
    ])

    // 1 tags insert + 2 post_tags inserts
    expect(db.insert).toHaveBeenCalledTimes(3)
  })

  it('deletes existing post_tags before inserting new ones', async () => {
    const db = createMockDb()
    db.query.tags.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 1, name: 'new-tag', description: '', created_at: '', updated_at: '', category: '' })

    await upsertPostTags(db, 42, [{ name: 'new-tag' }])

    expect(db.delete).toHaveBeenCalledWith(schema.post_tags)
  })
})
