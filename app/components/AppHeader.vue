<template>
  <!-- Mobile Menu Drawer -->
  <aside
    v-if="isMobileMenuOpen"
    class="fixed inset-0 z-50 bg-black/50 lg:hidden"
    @click="closeMobileMenu"
  >
    <div
      class="fixed left-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-900 overflow-y-auto"
      @click.stop
    >
      <div class="p-6">
        <button @click="closeMobileMenu" class="mb-8">
          <div class="i-ph-x w-6 h-6"></div>
        </button>
        
        <nav class="space-y-1">
          <NuxtLink
            to="/"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            HOME
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            ABOUT
          </NuxtLink>
          <NuxtLink
            to="/authors"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            AUTHORS
          </NuxtLink>
          <NuxtLink
            to="/tags"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            TAGS
          </NuxtLink>
          <NuxtLink
            to="/signin"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            Sign in
          </NuxtLink>
          <NuxtLink
            to="/signup"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            Sign up
          </NuxtLink>
          <NuxtLink
            to="/subscribe"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            Subscribe
          </NuxtLink>
          <NuxtLink
            to="/membership"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            Membership
          </NuxtLink>
        </nav>

        <!-- Social Icons in Mobile Drawer -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-4">
            <a href="https://x.com" target="_blank" rel="noopener" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-x-logo w-5 h-5"></div>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-facebook-logo w-5 h-5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-instagram-logo w-5 h-5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-pinterest-logo w-5 h-5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-youtube-logo w-5 h-5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-tiktok-logo w-5 h-5"></div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <header class="border-b"
    :class="{ 'bg-[#F8F9FA] dark:bg-gray-900': !isScrolled }"
  >
    <div class="mx-auto">
      <!-- Desktop Header -->
      <div class="hidden lg:block py-6">
        <!-- Row 1: Centered Logo -->
        <div
          class="flex justify-center px-6 border-b border-gray-200 dark:border-gray-800 transition-all duration-300"
          :class="isScrolled ? 'mb-2 pb-3' : 'mb-6 pb-6'"
        >
          <NuxtLink to="/" class="flex items-center">
            <span
              class="font-title font-bold text-black dark:text-white transition-all duration-300"
              :class="isScrolled ? 'text-3xl' : 'text-4xl'"
            >
              constellate*
            </span>
          </NuxtLink>
        </div>

        <!-- Row 2: Social | Navigation | Auth -->
        <div class="flex items-center justify-between px-6 max-w-7xl mx-auto">
          <!-- Left: Social Icons -->
          <div class="flex items-center gap-3">
            <a href="https://x.com" target="_blank" rel="noopener" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-x-logo w-4.5 h-4.5"></div>
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-facebook-logo w-4.5 h-4.5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-instagram-logo w-4.5 h-4.5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-pinterest-logo w-4.5 h-4.5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-youtube-logo w-4.5 h-4.5"></div>
            </a>
            <a href="#" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-tiktok-logo w-4.5 h-4.5"></div>
            </a>
          </div>

          <!-- Center: Navigation Links -->
          <nav class="flex items-center gap-8 text-sm font-medium">
            <NuxtLink to="/" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              HOME
            </NuxtLink>
            <NuxtLink to="/projects" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              PROJECTS
            </NuxtLink>
            <NuxtLink to="/posts" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              POSTS
            </NuxtLink>
            <NuxtLink to="/about" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              ABOUT
            </NuxtLink>
          </nav>

          <!-- Right: Auth + Search + Theme -->
          <div class="flex items-center gap-3">
            <NuxtLink to="/signin" class="text-sm font-600 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
              Sign in
            </NuxtLink>
            <NuxtLink to="/subscribe" class="px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wide rounded-4 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              SUBSCRIBE
            </NuxtLink>
            <button class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              <div class="i-ph-magnifying-glass-bold"></div>
            </button>
            <button 
              @click="toggleTheme" 
              class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <div v-if="colorMode.value === 'light'" class="i-ph-moon-bold"></div>
              <div v-else class="i-ph-sun-bold"></div>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Header -->
      <div class="lg:hidden flex items-center justify-between py-4">
        <!-- Left: Menu Button -->
        <button
          @click="toggleMobileMenu"
          class="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        >
          <div class="i-ph-list w-6 h-6"></div>
        </button>

        <!-- Center: Logo -->
        <NuxtLink to="/" class="absolute left-1/2 transform -translate-x-1/2">
          <span class="text-2xl font-title font-bold text-black dark:text-white">Woords®</span>
        </NuxtLink>

        <!-- Right: Search + Theme -->
        <div class="flex items-center gap-2">
          <button class="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
            <div class="i-ph-magnifying-glass w-5 h-5"></div>
          </button>
          <button 
            @click="toggleTheme" 
            class="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            <div v-if="colorMode.value === 'light'" class="i-ph-moon w-5 h-5"></div>
            <div v-else class="i-ph-sun w-5 h-5"></div>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false)
const colorMode = useColorMode()
import { useHeaderScroll } from '../composables/useHeaderScroll'
const { isScrolled } = useHeaderScroll({ threshold: 12 })

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function toggleTheme() {
  colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
}
</script>
