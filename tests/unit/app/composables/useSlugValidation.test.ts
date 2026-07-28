import { describe, expect, it, vi, beforeEach } from 'vitest'
import { nextTick } from 'vue'

vi.mock('#app', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, unknown>
  return {
    ...actual,
    useNuxtApp: () => ({
      $t: (key: string) => key,
      $getLocale: () => 'en',
      $ts: (key: string) => key,
      $i18nStrategy: 'prefix_except_default',
      $defaultLocale: 'en',
    }),
  }
})

import { useSlugValidation } from '../../../../app/composables/useSlugValidation'

describe('useSlugValidation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('returns initial state', () => {
    const slug = useSlugValidation()
    expect(slug.slugCandidate.value).toBe('')
    expect(slug.slugCheckLoading.value).toBe(false)
    expect(slug.slugTaken.value).toBe(false)
    expect(slug.slugCheckMessage.value).toBe('')
  })

  it('reset clears all state', () => {
    const slug = useSlugValidation()
    slug.slugCandidate.value = 'test'
    slug.slugCheckLoading.value = true
    slug.slugTaken.value = true
    slug.slugCheckMessage.value = 'some message'
    slug.reset()
    expect(slug.slugCandidate.value).toBe('test')
    expect(slug.slugCheckLoading.value).toBe(false)
    expect(slug.slugTaken.value).toBe(false)
    expect(slug.slugCheckMessage.value).toBe('')
  })

  it('setSlugCandidate normalizes the value', () => {
    const slug = useSlugValidation()
    slug.setSlugCandidate('Hello World!')
    expect(slug.slugCandidate.value).toBe('hello-world')
  })

  it('skips check when value matches currentSlug', async () => {
    const slug = useSlugValidation({ currentSlug: 'existing-slug' })
    slug.slugCandidate.value = 'existing-slug'
    await vi.advanceTimersToNextTimerAsync()
    expect(slug.slugTaken.value).toBe(false)
    expect(slug.slugCheckMessage.value).toBe('')
  })
})
