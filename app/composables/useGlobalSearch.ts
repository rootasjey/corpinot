import { ref } from 'vue'

const openState = ref(false)
const initialQuery = ref('')

export function useGlobalSearch() {
  function open(query = '') {
    initialQuery.value = query
    openState.value = true
  }
  function close() {
    openState.value = false
    initialQuery.value = ''
  }
  function toggle() {
    openState.value = !openState.value
  }

  return {
    isOpen: openState,
    initialQuery,
    open,
    close,
    toggle
  }
}

export default useGlobalSearch
