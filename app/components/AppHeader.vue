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
            {{ $t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/about"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.about') }}
          </NuxtLink>
          <NuxtLink
            to="/authors"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.authors') }}
          </NuxtLink>
          <NuxtLink
            to="/tags"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.tags') }}
          </NuxtLink>
          <template v-if="!isLoggedIn">
            <NuxtLink
              to="/signin"
              class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
              @click="closeMobileMenu"
            >
              {{ $t('common.signin') }}
            </NuxtLink>
          </template>
          <template v-else>
            <button @click="() => { handleLogout(); closeMobileMenu(); }" class="w-full text-left block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">{{ $t('common.signout') }}</button>
          </template>
          <NuxtLink
            to="/signup"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.signup') }}
          </NuxtLink>
          <NuxtLink
            to="/subscribe"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('common.subscribe') }}
          </NuxtLink>
          <NuxtLink
            to="/membership"
            class="block py-3 px-4 text-base hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
            @click="closeMobileMenu"
          >
            {{ $t('nav.membership') }}
          </NuxtLink>
        </nav>

        <!-- Language Switcher (Mobile) -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3 px-4">{{ $t('common.language') }}</p>
          <div class="flex flex-wrap gap-2 px-4">
            <NuxtLink
              v-for="locale in $getLocales()"
              :key="locale.code"
              :to="$switchLocalePath(locale.code)"
              class="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
              :class="locale.code === $getLocale()
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'"
            >
              {{ locale.displayName || locale.code }}
            </NuxtLink>
          </div>
        </div>

        <!-- Social Icons in Mobile Drawer -->
        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-4 px-4">
            <a
              v-for="s in orderedSocials"
              :key="s.platform + s.url"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <div :class="`${iconClass(s.platform)} w-5 h-5`"></div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </aside>

  <header>
    <div class="mx-auto">
      <!-- Mobile Top Bar -->
      <div class="lg:hidden flex items-center justify-between px-4 py-3"
        :class="{
          'bg-white/80 dark:bg-gray-950/80 backdrop-blur': isScrolled
        }"
      >
        <NuxtLink to="/" class="ml-1 flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full">
          <span
            class="font-title font-bold text-xl"
            :class="{
              'text-white': !isScrolled && router.currentRoute.value.path === '/',
            }"
          >
          {{ $t('nav.brand') }}
        </span>
        </NuxtLink>
        <div class="flex items-center gap-3">
          <NButton
            icon
            btn="ghost-gray"
            class="hover:scale-105 active:scale-99 transition-transform"
            :class="{
              'color-white': scrollY === 0 && router.currentRoute.value.path === '/',
            }"
            @click="toggleTheme"
            :aria-label="$t('nav.toggleTheme')"
          >
            <!-- SSR friendly: render both icons and toggle with CSS `dark:` utilities to avoid hydration mismatch. -->
            <div class="i-ph-moon-bold block dark:hidden w-6 h-6"></div>
            <div class="i-ph-sun-bold hidden dark:block w-6 h-6"></div>
            <span class="sr-only">{{ $t('nav.toggleTheme') }}</span>
          </NButton>
        </div>
      </div>

      <!-- Desktop Header -->
      <div class="hidden lg:block py-6 border-b"
        :class="{
          'bg-[#F8F9FA] dark:bg-gray-900': !isScrolled,
          'bg-white/80 dark:bg-gray-950/80 backdrop-blur': isScrolled
        }"
      >
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
              {{ $t('nav.brand') }}
            </span>
          </NuxtLink>
        </div>

        <!-- Row 2: Social | Navigation | Auth -->
        <div class="grid items-center px-6 max-w-7xl mx-auto grid-cols-3">
          <!-- Left: Social Icons -->
          <div class="flex items-center gap-3 justify-self-start">
            <a
              v-for="s in orderedSocials"
              :key="s.platform + s.url"
              :href="s.url"
              target="_blank"
              rel="noopener"
              class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <div :class="`${iconClass(s.platform)} w-4.5 h-4.5`"></div>
            </a>
          </div>

          <!-- Center: Navigation Links -->
          <nav class="flex items-center gap-8 text-sm font-medium justify-self-center">
            <NuxtLink to="/" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              {{ $t('nav.home') }}
            </NuxtLink>
            <NuxtLink to="/projects" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              {{ $t('nav.projects') }}
            </NuxtLink>
            <NuxtLink to="/posts" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              {{ $t('nav.posts') }}
            </NuxtLink>
            <NuxtLink to="/about" class="font-600 hover:underline decoration-offset-6 text-gray-700 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors">
              {{ $t('nav.about') }}
            </NuxtLink>
          </nav>

          <!-- Right: Auth + Search + Theme -->
          <div class="flex items-center gap-3 justify-self-end">
            <template v-if="!isLoggedIn">
              <NuxtLink to="/signin" class="text-sm font-600 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors">
                {{ $t('common.signin') }}
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
              {{ $t('nav.donate') }}
            </NuxtLink>

            <NTooltip>
              <template #content>
                <span class="font-600">{{ $t('nav.searchTooltip') }}</span>
              </template>
              <button @click="openSearch" class="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors" :aria-label="$t('nav.openSearch')">
                <div class="i-ph-magnifying-glass-bold"></div>
              </button>
            </NTooltip>
            <NCombobox
              :items="localeOptions"
              by="code"
              :model-value="currentLocaleObj"
              @update:model-value="onLocaleChange"
              size="xs"
              class="w-20"
              :_combobox-trigger="{ class: 'w-20 min-w-0 px-2' }"
              :_combobox-input="{ class: 'border-none' }"
            >
              <template #trigger="{ modelValue }">
                <span class="text-xs font-semibold uppercase tracking-wide">{{ modelValue?.code?.toUpperCase() || 'EN' }}</span>
              </template>
              <template #label="{ item }">
                <span class="text-xs">{{ item.displayName }}</span>
              </template>
            </NCombobox>
            <NCombobox
              :items="themeOptions"
              by="value"
              :model-value="currentThemeObj"
              @update:model-value="onThemeChange"
              size="xs"
              class="w-20"
              :_combobox-trigger="{ class: 'w-20 min-w-0 px-2' }"
              :_combobox-input="{ class: 'border-none' }"
            >
              <template #trigger="{ modelValue }">
                <div :class="modelValue?.icon || 'i-ph-sun'" class="w-4 h-4 mx-auto" />
              </template>
              <template #label="{ item }">
                <div class="flex items-center gap-2 text-xs">
                  <div :class="item.icon" class="w-4 h-4" />
                  {{ item.label }}
                </div>
              </template>
            </NCombobox>
          </div>
        </div>
      </div>
    </div>
  </header>

  <ClientOnly>
    <AdminSiteSettingsDrawer v-model:open="siteSettingsDrawerOpen" />
  </ClientOnly>
</template>

<script setup lang="ts">
import { computed, isRef, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useHeaderScroll } from '../composables/useHeaderScroll'
import useGlobalSearch from '~/composables/useGlobalSearch'
import useSiteSettings from '~/composables/useSiteSettings'

type ThemePreference = 'light' | 'dark' | 'system'
type ThemeMenuScope = 'desktop' | 'mobile'

const { user, loggedIn, fetch: refreshSession, clear: clearSession } = useUserSession()
const router = useRouter()
const { socials: siteSocials } = useSiteSettings()

const orderedSocials = computed(() => [...siteSocials.value].filter((s) => s.enabled !== false).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

const isLoggedIn = computed(() => (typeof loggedIn === 'boolean' ? loggedIn : loggedIn.value))
const currentUser = computed(() => (isRef(user) ? (user.value as any) : user as any))
const userInitial = computed(() => (currentUser.value?.name ? currentUser.value.name.charAt(0).toUpperCase() : ''))
const isAdmin = computed(() => isLoggedIn.value && currentUser.value?.role === 'admin')

const isMobileMenuOpen = ref(false)
const colorMode = useColorMode()
const { isScrolled, y: scrollY } = useHeaderScroll({ threshold: 12 })
const siteSettingsDrawerOpen = ref(false)

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

function goSearch() {
  router.push('/search')
}

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

const { $t, $ts, $getLocale, $switchLocale, $getLocales } = useI18n()

const localeOptions = computed(() => $getLocales().map(l => ({ code: l.code, displayName: l.displayName || l.code })))

const currentLocaleObj = computed(() => {
  const code = $getLocale()
  return localeOptions.value.find(l => l.code === code) || localeOptions.value[0]
})

function onLocaleChange(item: { code: string } | null) {
  if (item?.code) $switchLocale(item.code)
}

const dropdownItems = computed(() => {
  const items = [
    { label: $t('common.settings'), onSelect: () => { router.push('/settings') } },
    { label: $t('common.profile'), onSelect: () => { router.push('/profile') } },
    { label: $t('common.signout'), onSelect: async () => { await handleLogout() } },
  ]

  if (isAdmin.value) {
    items.unshift({ label: $t('nav.siteSocials'), onSelect: () => { siteSettingsDrawerOpen.value = true } })
  }

  return items
})

const themeOptions = computed(() => [
  { value: 'light', label: $ts('nav.light'), icon: 'i-ph-sun' },
  { value: 'dark', label: $ts('nav.dark'), icon: 'i-ph-moon' },
  { value: 'system', label: $ts('nav.system'), icon: 'i-ph-laptop' },
])

const currentThemeObj = computed(() => {
  const pref = colorMode.preference as ThemePreference
  return themeOptions.value.find(o => o.value === pref) || themeOptions.value[0]
})

function onThemeChange(item: { value: string } | null) {
  if (item?.value) setThemePreference(item.value as ThemePreference)
}

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
  let newColorMode: ThemePreference = 'light'
  switch  (colorMode.preference) {
    case 'light':
      newColorMode = 'dark'
      break
    case 'dark':
      newColorMode = 'system'
      break
    case 'system':
      newColorMode = 'light'
      break
  }
  colorMode.value = newColorMode
  console.log('Toggling theme to', colorMode.value)
  setThemePreference(newColorMode)
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

function iconClass(platform?: string) {
  if (!platform) return 'i-ph-link'
  const p = platform.toLowerCase()
  if (p.includes('twitter') || p === 'x') return 'i-ph-x-logo'
  if (p.includes('facebook')) return 'i-ph-facebook-logo'
  if (p.includes('instagram')) return 'i-ph-instagram-logo'
  if (p.includes('pinterest')) return 'i-ph-pinterest-logo'
  if (p.includes('youtube')) return 'i-ph-youtube-logo'
  if (p.includes('tiktok')) return 'i-ph-tiktok-logo'
  if (p.includes('github')) return 'i-ph-github-logo'
  if (p.includes('linkedin')) return 'i-ph-linkedin-logo'
  return 'i-ph-link'
}
</script>
