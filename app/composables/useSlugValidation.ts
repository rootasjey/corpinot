import { ref, watch, onBeforeUnmount } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { normalizeSlug } from '~/utils/slug'

interface UseSlugValidationOptions {
  currentSlug?: string | null | undefined | (() => string | null | undefined)
  postId?: number | null | undefined | (() => number | null | undefined)
  debounceMs?: number
}

export function useSlugValidation(options: UseSlugValidationOptions = {}) {
  const slugCandidate = ref('')
  const slugCheckLoading = ref(false)
  const slugTaken = ref(false)
  const slugCheckMessage = ref('')
  let controller: AbortController | null = null

  const reset = () => {
    if (controller) {
      controller.abort()
      controller = null
    }
    slugCheckLoading.value = false
    slugTaken.value = false
    slugCheckMessage.value = ''
  }

  const resolveCurrentSlug = () => {
    if (typeof options.currentSlug === 'function') return options.currentSlug() ?? ''
    return options.currentSlug ?? ''
  }

  const resolvePostId = () => {
    if (typeof options.postId === 'function') return options.postId()
    return options.postId
  }

  const runCheck = async (rawValue: string) => {
    const value = normalizeSlug(rawValue || '')
    const currentSlug = resolveCurrentSlug()
    if (!value || value === currentSlug) {
      slugTaken.value = false
      slugCheckMessage.value = ''
      return
    }

    slugCheckLoading.value = true
    slugTaken.value = false
    slugCheckMessage.value = ''

    if (controller) controller.abort()
    controller = new AbortController()

    try {
      const params: any = { slug: value }
      const maybeId = resolvePostId()
      if (maybeId) params.excludeId = maybeId

      const res: any = await $fetch('/api/posts/slug/check', { params, signal: controller.signal })
      if (res?.exists) {
        slugTaken.value = true
        slugCheckMessage.value = 'That slug is already in use.'
      } else {
        slugTaken.value = false
        slugCheckMessage.value = 'That slug is available.'
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      slugCheckMessage.value = e?.data?.message || 'Failed to validate slug'
    } finally {
      slugCheckLoading.value = false
      controller = null
    }
  }

  const debouncedCheck = useDebounceFn((value: string) => runCheck(value), options.debounceMs ?? 450)

  watch(slugCandidate, (value) => {
    if (!value) {
      reset()
      return
    }
    const normalized = normalizeSlug(value)
    if (normalized !== value) {
      slugCandidate.value = normalized
      return
    }
    debouncedCheck(normalized)
  })

  onBeforeUnmount(reset)

  return {
    slugCandidate,
    slugCheckLoading,
    slugTaken,
    slugCheckMessage,
    runCheck,
    reset,
    setSlugCandidate: (value: string) => { slugCandidate.value = normalizeSlug(value) },
  }
}
