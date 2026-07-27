<template>
  <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
    <div class="max-w-3xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between mb-4 animate-entrance" style="animation-delay:80ms;">
        <h1 class="text-2xl font-bold">{{ $t('pages.settings.heading') }}</h1>
        <p class="text-sm text-gray-500">v{{ appVersion }}</p>
      </div>

      <div class="space-y-3 animate-entrance" style="animation-delay:180ms;">
        <!-- Theme -->
        <NuxtLink to="/settings/theme" class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="w-9 h-9 inline-flex items-center justify-center rounded-lg hover:bg-gray-100/70 dark:hover:bg-gray-900/70 transition"
              :aria-label="$t('pages.settings.switchTheme', { theme: themePreferenceLabel })"
              @click.stop.prevent="cycleTheme"
            >
              <div :class="[themeIconClass, 'w-5 h-5 text-yellow-500']"></div>
            </button>
            <div>
              <div class="font-medium">{{ $t('pages.settings.theme') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.themeDescription') }}</div>
            </div>
          </div>
          <div class="i-ph-caret-right text-gray-400" />
        </NuxtLink>

        <!-- Profile -->
        <NuxtLink to="/profile" class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="i-ph-user-circle-duotone w-5 h-5 text-gray-700 dark:text-gray-300"></div>
            <div>
              <div class="font-medium">{{ $t('pages.settings.profile') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.profileDescription') }}</div>
            </div>
          </div>
          <div class="i-ph-caret-right text-gray-400" />
        </NuxtLink>

        <!-- AI -->
        <NuxtLink to="/settings/ai" class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="i-ph-sparkle-duotone w-5 h-5 text-gray-700 dark:text-gray-300"></div>
            <div>
              <div class="font-medium">{{ $t('pages.settings.aiSettings') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.aiSettingsDescription') }}</div>
            </div>
          </div>
          <div class="i-ph-caret-right text-gray-400" />
        </NuxtLink>

        <!-- About -->
        <NuxtLink to="/about" class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="i-ph-newspaper-duotone w-5 h-5 text-gray-700 dark:text-gray-300"></div>
            <div>
              <div class="font-medium">{{ $t('pages.settings.about') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.aboutDescription') }}</div>
            </div>
          </div>
          <div class="i-ph-caret-right text-gray-400" />
        </NuxtLink>

        <!-- Credits -->
        <NuxtLink to="/credits" class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="i-ph-github-logo-duotone w-5 h-5 text-gray-700 dark:text-gray-300"></div>
            <div>
              <div class="font-medium">{{ $t('pages.settings.credits') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.creditsDescription') }}</div>
            </div>
          </div>
          <div class="i-ph-caret-right text-gray-400" />
        </NuxtLink>

        <!-- App version -->
        <div class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="i-ph-info-duotone w-5 h-5 text-gray-700 dark:text-gray-300"></div>
            <div>
              <div class="font-medium">{{ $t('pages.settings.appVersion') }}</div>
              <div class="text-sm text-gray-500">{{ $t('pages.settings.appVersionDescription', { version: appVersion }) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
useSeoMeta({ title: `${$t('pages.settings.heading')} — ${$t('seo.siteName')}` })

type ThemePreference = 'light' | 'dark' | 'system'

const config = useRuntimeConfig()
const appVersion = (config.public?.appVersion as string) || '0.0.0'

const colorMode = useColorMode()
const themePreference = computed<ThemePreference>(() => (colorMode.preference as ThemePreference) || 'system')
const themePreferenceLabel = computed(() => themePreference.value)
const themeIconClass = computed(() => {
  if (themePreference.value === 'light') return 'i-ph-sun-duotone'
  if (themePreference.value === 'dark') return 'i-ph-moon-duotone'
  return 'i-ph-laptop-duotone'
})

function cycleTheme() {
  const next = themePreference.value === 'system'
    ? 'light'
    : themePreference.value === 'light'
      ? 'dark'
      : 'system'
  colorMode.preference = next
}
</script>

<style scoped>
.animate-entrance {
  opacity: 0;
  transform: translateY(8px) scale(0.996);
  animation: entrance 640ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
}

@keyframes entrance {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-entrance {
    transition: none !important;
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
