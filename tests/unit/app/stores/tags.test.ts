import { describe, expect, it, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

import { useTagStore } from '../../../../app/stores/tags'

beforeEach(() => {
  setActivePinia(createPinia())
})

const mockTags = [
  { id: 1, name: 'vue', category: 'framework', description: '', created_at: '', updated_at: '' },
  { id: 2, name: 'nuxt', category: 'framework', description: '', created_at: '', updated_at: '' },
  { id: 3, name: 'design', category: 'general', description: '', created_at: '', updated_at: '' },
]

describe('useTagStore', () => {
  describe('utility methods', () => {
    it('findTagById returns matching tag', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.findTagById(2)?.name).toBe('nuxt')
    })

    it('findTagById returns undefined for missing id', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.findTagById(999)).toBeUndefined()
    })

    it('findTagByName is case insensitive', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.findTagByName('VUE')?.id).toBe(1)
    })

    it('searchTags filters by name', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.searchTags('vue')).toHaveLength(1)
    })

    it('searchTags filters by category', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.searchTags('framework')).toHaveLength(2)
    })

    it('searchTags returns all for empty query', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.searchTags('')).toHaveLength(3)
    })

    it('searchTags returns empty for no match', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      expect(store.searchTags('xyz')).toHaveLength(0)
    })
  })

  describe('tagsByCategory', () => {
    it('groups tags by category', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      const grouped = store.tagsByCategory
      expect(grouped.framework).toHaveLength(2)
      expect(grouped.general).toHaveLength(1)
    })
  })

  describe('isCacheValid', () => {
    it('returns false when no cache', () => {
      const store = useTagStore()
      expect(store.isCacheValid).toBe(false)
    })

    it('returns true when recently fetched', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      store.lastFetchTime = new Date()
      expect(store.isCacheValid).toBe(true)
    })
  })

  describe('clearCache', () => {
    it('resets cache and errors', () => {
      const store = useTagStore()
      store.tags = [...mockTags]
      store.lastFetchTime = new Date()
      store.error = 'some error'
      store.clearCache()
      expect(store.lastFetchTime).toBeNull()
      expect(store.error).toBeNull()
    })
  })
})
