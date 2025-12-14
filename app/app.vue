<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <ClientOnly>
      <SearchModal />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import '@una-ui/preset/una.css'
import '@/styles/main.css'
import { onMounted, onBeforeUnmount } from 'vue'
import useGlobalSearch from './composables/useGlobalSearch'

const { open } = useGlobalSearch()

function handleKeydown(e: KeyboardEvent) {
  // Cmd/Ctrl + K
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    // do not open when typing into inputs/textareas or contenteditable elements
    const active = document.activeElement as HTMLElement | null
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)) return
    e.preventDefault()
    open('')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>
