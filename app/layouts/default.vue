<template>
  <div class="min-h-screen flex flex-col bg-white dark:bg-gray-950 font-text">
    <header
      class="sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur transition-all duration-300"
      :class="[
        isScrolled ? 'shadow-sm' : '',
        (isScrolled && isScrollingDown) ? '-translate-y-full' : 'translate-y-0'
      ]"
      role="banner"
    >
      <AppHeader />
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import { useHeaderScroll } from '../composables/useHeaderScroll'
const { isScrolled, isScrollingDown } = useHeaderScroll({ threshold: 12 })
</script>
