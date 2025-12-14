import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useHeaderScroll(options?: { threshold?: number }) {
  const threshold = options?.threshold ?? 12
  const isScrolled = ref(false)
  const isScrollingDown = ref(false)
  const y = ref(0)

  let lastY = 0
  let ticking = false

  const handleScroll = () => {
    const currentY = window.scrollY || document.documentElement.scrollTop || 0
    if (!ticking) {
      window.requestAnimationFrame(() => {
        isScrollingDown.value = currentY > lastY
        y.value = currentY
        isScrolled.value = currentY > threshold
        lastY = currentY
        ticking = false
      })
      ticking = true
    }
  }

  onMounted(() => {
    // Initialize to current scroll position on mount (client-side only)
    if (typeof window !== 'undefined') {
      lastY = window.scrollY || 0
      isScrolled.value = lastY > threshold
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
  })

  onBeforeUnmount(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll)
    }
  })

  return { isScrolled, isScrollingDown, y }
}
