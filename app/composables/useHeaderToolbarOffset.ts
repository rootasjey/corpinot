import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { useHeaderScroll } from './useHeaderScroll'

export function useHeaderToolbarOffset(options?: { baseOffsetPx?: number; measureSelector?: string }) {
  const baseOffsetPx = options?.baseOffsetPx ?? 16
  const measureSelector = options?.measureSelector ?? 'header[role="banner"]'

  const headerHeight = ref(0)
  const headerVisible = ref(true)

  const { isScrolled, isScrollingDown } = useHeaderScroll({ threshold: 12 })

  let ro: ResizeObserver | null = null

  function updateHeaderHeight() {
    if (typeof window === 'undefined') return
    const el = document.querySelector(measureSelector) as HTMLElement | null
    headerHeight.value = el ? Math.round(el.getBoundingClientRect().height) : 0
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    updateHeaderHeight()

    // Listen for resizes of the header element itself (height changes when scrolled)
    const el = document.querySelector(measureSelector) as HTMLElement | null
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateHeaderHeight)
      ro.observe(el)
    }

    window.addEventListener('resize', updateHeaderHeight)
  })

  onBeforeUnmount(() => {
    if (typeof window === 'undefined') return
    window.removeEventListener('resize', updateHeaderHeight)
    if (ro && typeof ro.disconnect === 'function') ro.disconnect()
  })

  // Header is visible when the layout does not hide it (i.e. NOT (isScrolled && isScrollingDown))
  watch([isScrolled, isScrollingDown], () => {
    headerVisible.value = !(isScrolled.value && isScrollingDown.value)
    updateHeaderHeight()
  }, { immediate: true })

  const top = computed(() => baseOffsetPx + (headerVisible.value ? headerHeight.value : 0))
  return { top, headerHeight, headerVisible }
}
