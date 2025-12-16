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
          <template v-if="!isLoggedIn">
            <NuxtLink
              to="/signin"
              class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
              @click="closeMobileMenu"
            >
              Sign in
            </NuxtLink>
          </template>
          <template v-else>
            <button @click="() => { handleLogout(); closeMobileMenu(); }" class="w-full text-left block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">Logout</button>
          </template>
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
              corpinot
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
            <template v-if="!isLoggedIn">
              <NuxtLink to="/signin" class="text-sm font-600 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                Sign in
              </NuxtLink>
            </template>

            <template v-else>
              <NDropdownMenu :items="dropdownItems">
                <NButton btn="~" rounded="full" class="min-w-0 p-0">
                  <img v-if="currentUser.value?.avatar" :src="currentUser.value.avatar" alt="avatar" class="w-8 h-8 rounded-full" />
                  <NAvatar v-else :label="userInitial" avatar="solid-black" size="sm" class="important:font-600 font-title" />
                </NButton>
              </NDropdownMenu>
            </template>
            <NuxtLink to="/donate" class="uppercase px-4 py-2 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-wide rounded-4 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Donate
            </NuxtLink>
            <button @click="openSearch" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors" aria-label="Open search">
              <div class="i-ph-magnifying-glass-bold"></div>
            </button>
            <NDropdownMenu
              :items="themeDropdownItems"
              v-model:open="desktopThemeOpen"
              :modal="false"
              :_dropdown-menu-content="dropdownContentProps"
            >
              <button
                @click="toggleTheme"
                @contextmenu.prevent="openThemeMenu('desktop')"
                @pointerdown="onThemePressStart('desktop', $event)"
                @pointerup="onThemePressEnd('desktop')"
                @pointerleave="onThemePressEnd('desktop')"
                class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <!-- SSR friendly: render both icons and toggle with CSS `dark:` utilities.
                     Avoids class mismatch between server and client by keeping DOM the same. -->
                <div class="i-ph-moon-bold block dark:hidden"></div>
                <div class="i-ph-sun-bold hidden dark:block"></div>
                <span class="sr-only">Theme</span>
              </button>
            </NDropdownMenu>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, isRef, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHeaderScroll } from '../composables/useHeaderScroll'
import useGlobalSearch from '~/composables/useGlobalSearch'

type ThemePreference = 'light' | 'dark' | 'system'
type ThemeMenuScope = 'desktop' | 'mobile'

const { user, loggedIn, fetch: refreshSession, clear: clearSession } = useUserSession()
const router = useRouter()

const isLoggedIn = computed(() => (typeof loggedIn === 'boolean' ? loggedIn : loggedIn.value))
const currentUser = computed(() => (isRef(user) ? (user.value as any) : user as any))
const userInitial = computed(() => (currentUser.value?.name ? currentUser.value.name.charAt(0).toUpperCase() : ''))

const isMobileMenuOpen = ref(false)
const colorMode = useColorMode()
const { isScrolled } = useHeaderScroll({ threshold: 12 })

const desktopThemeMenu = createThemeMenuController()
const mobileThemeMenu = createThemeMenuController()
const desktopThemeOpen = computed({
  get: () => desktopThemeMenu.open.value,
  set: (val: boolean) => onThemeMenuOpenChange('desktop', val),
})
const mobileThemeOpen = computed({
  get: () => mobileThemeMenu.open.value,
  set: (val: boolean) => onThemeMenuOpenChange('mobile', val),
})

// Global search modal
const { open: openSearchModal } = useGlobalSearch()
function openSearch() { openSearchModal() }

async function handleLogout() {
  try {
    await $fetch('/api/logout', { method: 'POST' })
    await clearSession()
    await refreshSession()
    router.push('/')
  } catch (err) {
    console.error('Logout failed', err)
  }
}

const dropdownItems = computed(() => [
  { label: 'Profile', onSelect: () => router.push('/profile') },
  { label: 'Logout', onSelect: async () => { await handleLogout() } },
])

const themeDropdownItems = computed(() => {
  const preference = colorMode.preference as ThemePreference
  return [
    { label: 'Dark', leading: 'i-ph-moon', trailing: preference === 'dark' ? 'i-ph-check' : undefined, onSelect: () => setThemePreference('dark') },
    { label: 'Light', leading: 'i-ph-sun', trailing: preference === 'light' ? 'i-ph-check' : undefined, onSelect: () => setThemePreference('light') },
    { label: 'System', leading: 'i-ph-laptop', trailing: preference === 'system' ? 'i-ph-check' : undefined, onSelect: () => setThemePreference('system') },
  ]
})

const dropdownContentProps = computed(() => ({
  align: 'end' as const,
  onEscapeKeyDown: () => closeThemeMenus(),
  onInteractOutside: () => closeThemeMenus(),
  onPointerDownOutside: () => closeThemeMenus(),
  onFocusOutside: () => closeThemeMenus(),
}))

function setThemePreference(preference: ThemePreference) {
  colorMode.preference = preference
  closeThemeMenus()
}

function closeThemeMenus() {
  desktopThemeMenu.close()
  mobileThemeMenu.close()
}

function openThemeMenu(scope: ThemeMenuScope) {
  closeThemeMenus()
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.requestOpen()
}

function onThemeMenuOpenChange(scope: ThemeMenuScope, nextOpen: boolean) {
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.handleOpenChange(nextOpen)
  if (!nextOpen) {
    const otherMenu = scope === 'desktop' ? mobileThemeMenu : desktopThemeMenu
    otherMenu.close()
  }
}

function onThemePressStart(scope: ThemeMenuScope, event: PointerEvent) {
  if (event.pointerType !== 'touch') return
  closeThemeMenus()
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.scheduleLongPress()
}

function onThemePressEnd(scope: ThemeMenuScope) {
  const menu = scope === 'desktop' ? desktopThemeMenu : mobileThemeMenu
  menu.cancelLongPress()
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false
}

function toggleTheme() {
  colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
  setThemePreference(colorMode.value as ThemePreference)
}

function createThemeMenuController() {
  const open = ref(false)
  const allowOpen = ref(false)
  const longPressTimer = ref<number | null>(null)

  function clearTimer() {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value)
      longPressTimer.value = null
    }
  }

  function requestOpen() {
    allowOpen.value = true
    open.value = true
  }

  function scheduleLongPress() {
    if (!import.meta.client) return
    clearTimer()
    longPressTimer.value = window.setTimeout(() => {
      allowOpen.value = true
      open.value = true
    }, 450)
  }

  function cancelLongPress() {
    clearTimer()
    if (!open.value) allowOpen.value = false
  }

  function close() {
    clearTimer()
    open.value = false
    allowOpen.value = false
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      close()
      return
    }

    if (!allowOpen.value) {
      open.value = false
      return
    }

    open.value = true
  }

  onBeforeUnmount(clearTimer)

  return { open, requestOpen, scheduleLongPress, cancelLongPress, close, handleOpenChange }
}
</script>
