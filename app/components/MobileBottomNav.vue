<template>
  <nav
    class="fixed bottom-2 left-4 right-4 rounded-2 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-t border-gray-200 dark:border-gray-800 shadow-[0_-6px_24px_-18px_rgba(0,0,0,0.25)] transition-transform transition-opacity duration-200"
    :class="showNav ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'"
  >
    <div class="mx-auto max-w-3xl px-4 py-0 pb-[calc(env(safe-area-inset-bottom)+6px)]">
      <div class="grid grid-cols-3">
        <NuxtLink
          v-for="item in items"
          :key="item.to"
          :to="item.to"
          class="flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold uppercase tracking-wide transition-colors"
          :class="isActive(item.to) ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          <span :class="[item.icon, 'text-lg']" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const showNav = ref(false)
const lastY = ref(0)

const items = [
  { label: 'Home', to: '/', icon: 'i-ph-house-simple-duotone' },
  { label: 'Search', to: '/search', icon: 'i-ph-magnifying-glass-duotone' },
  { label: 'Settings', to: '/settings', icon: 'i-ph-gear-six-duotone' },
]

const isActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

const allowedRoutes = [
  '/search', 
  '/settings', 
  '/profile', 
  '/theme', 
  '/about', 
  '/credits', 
  '/privacy-policy', 
  '/terms-of-service',
]

if (import.meta.client) {
  const { y } = useWindowScroll()

  watch(y, (value) => {
    // if (value <= 0 && route.path !== '/search' && route.path !== '/settings') {
    if (value <= 0 && allowedRoutes.includes(route.path) === false) {
      showNav.value = false
      lastY.value = value
      return
    }

    showNav.value = value < lastY.value
    lastY.value = value
  }, { immediate: true })

  watch(() => route.path, () => {
    // Re-evaluate visibility on route change
    if (y.value <= 0 && allowedRoutes.includes(route.path) === false) {
      showNav.value = false
    } else {
      showNav.value = true
    }
  })
}

onMounted(() => {
  // Initial check
  const { y } = useWindowScroll()
  if (y.value <= 0 && allowedRoutes.includes(route.path) === false) {
    showNav.value = false
  } else {
    showNav.value = true
  }
})
</script>
