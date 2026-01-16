import { ref, watch, onBeforeUnmount, type Ref } from 'vue'

export interface UseCountUpOptions {
  duration?: number
  format?: (n: number) => string
  reduceMotion?: boolean
}

export function useCountUp(elRef: Ref<HTMLElement | null>, valueRef: Ref<number | undefined>, opts: UseCountUpOptions = {}) {
  const { duration = 1200, format, reduceMotion = false } = opts
  const display = ref('—')
  let rafId: number | null = null
  let observer: IntersectionObserver | null = null
  let started = false

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const shouldReduce = reduceMotion || prefersReduced

  function formatNumber(n: number) {
    if (format) return format(n)
    return new Intl.NumberFormat().format(Math.round(n))
  }

  function animate(from: number, to: number) {
    if (shouldReduce) {
      display.value = formatNumber(to)
      return
    }

    const start = performance.now()
    const d = Math.max(0, duration)

    function step(now: number) {
      const t = Math.min(1, (now - start) / d)
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      display.value = formatNumber(current)
      if (t < 1) {
        rafId = requestAnimationFrame(step)
      } else {
        rafId = null
      }
    }

    if (rafId) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(step)
  }

  function maybeStart() {
    if (started) return
    const v = valueRef.value
    if (v == null || v === undefined) return
    started = true
    animate(0, v)
  }

  // watch for value changes — if already started, animate from current displayed numeric value
  watch(valueRef, (newVal, oldVal) => {
    if (newVal == null) return
    if (!started) return
    const from = Number((display.value || '0').toString().replace(/[^0-9.-]/g, '')) || 0
    animate(from, newVal)
  })

  // set up intersection observer to wait until element is visible
  function setupObserver() {
    if (!elRef || !('IntersectionObserver' in window)) {
      // fallback: start immediately
      maybeStart()
      return
    }

    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          maybeStart()
          if (observer) observer.disconnect()
        }
      }
    }, { threshold: 0.2 })

    if (elRef.value) observer.observe(elRef.value)
  }

  // if element becomes available later
  watch(elRef, (el) => {
    if (el) setupObserver()
  }, { immediate: true })

  onBeforeUnmount(() => {
    if (rafId) cancelAnimationFrame(rafId)
    if (observer) observer.disconnect()
  })

  return {
    display,
  }
}
