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

import { useIsMobile } from '../../../../app/composables/useIsMobile'

describe('useIsMobile', () => {
  it('returns a ref', () => {
    const isMobile = useIsMobile()
    expect(isMobile.value).toBe(false)
  })

  it('accepts custom breakpoint', () => {
    const isMobile = useIsMobile('(max-width: 1024px)')
    expect(isMobile.value).toBe(false)
  })
})
