export function useLongPress(onLongPress: (slug: string) => void, delay = 600) {
  let timer: ReturnType<typeof setTimeout> | null = null

  function startLongPress(slug: string) {
    if (!onLongPress) return
    cancelLongPress()
    timer = setTimeout(() => {
      try {
        onLongPress(slug)
      } finally {
        cancelLongPress()
      }
    }, delay)
  }

  function cancelLongPress() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { startLongPress, cancelLongPress }
}
