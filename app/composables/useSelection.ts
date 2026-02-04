import { ref, computed } from 'vue'
import type { Post } from '~~/shared/types/post'

export function useSelection(initial: string[] = []) {
  const selected = ref(new Set(initial))
  const selectionMode = ref(false)

  const selectedCount = computed(() => selected.value.size)
  const hasSelection = computed(() => selected.value.size > 0)

  function toggleSelected(slug: string) {
    const next = new Set(selected.value)
    if (next.has(slug)) next.delete(slug)
    else next.add(slug)
    selected.value = next
    // entering selection mode when user toggles a selection makes UX clearer
    selectionMode.value = true
  }

  function clearSelection() {
    selected.value = new Set()
    selectionMode.value = false
  }

  function setSelectionMode(v: boolean) {
    selectionMode.value = v
    if (!v) selected.value = new Set()
  }

  function allVisibleSelected(posts: Post[]) {
    if (!posts || posts.length === 0) return false
    return posts.every(p => selected.value.has(p.slug))
  }

  function toggleSelectAllVisible(posts: Post[]) {
    if (!posts || posts.length === 0) return
    const next = new Set(selected.value)
    if (allVisibleSelected(posts)) {
      for (const p of posts) next.delete(p.slug)
    } else {
      for (const p of posts) next.add(p.slug)
    }
    selected.value = next
  }

  return {
    selected,
    selectionMode,
    selectedCount,
    hasSelection,
    toggleSelected,
    clearSelection,
    setSelectionMode,
    allVisibleSelected,
    toggleSelectAllVisible,
  }
}
