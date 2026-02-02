<template>
  <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
    <div class="max-w-3xl mx-auto px-4 py-6">
      <div class="flex items-center gap-3 mb-4">
        <NuxtLink to="/settings" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
          <span class="i-ph-arrow-left"></span>
          <span>Back to settings</span>
        </NuxtLink>
      </div>

      <div class="mb-6">
        <h1 class="text-2xl font-bold">Theme</h1>
        <p class="text-sm text-gray-500">Choose how Corpinot looks for you.</p>
      </div>

      <div class="p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
        <NRadioGroup
          v-model="themePreference"
          :items="themeItems"
          class="gap-3"
        />
      </div>

      <div class="mt-4 p-4 rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
        <div class="flex items-center justify-between gap-4">
          <div>
            <div class="font-medium">Slash menu layout</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Display the slash menu as a vertical list with icons and labels.</div>
          </div>
          <NSwitch v-model="slashMenuVertical" switch-checked="blue" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({ title: 'Theme — Corpinot' })
import { useEditorSettings } from '~/composables/useEditorSettings'

type ThemePreference = 'light' | 'dark' | 'system'

const colorMode = useColorMode()
const themePreference = computed<ThemePreference>({
  get: () => (colorMode.preference as ThemePreference) || 'system',
  set: (value) => {
    colorMode.preference = value
  },
})

const { slashMenuVertical } = useEditorSettings()

const themeItems = [
  {
    value: 'system',
    label: 'System',
    description: 'Follows your device setting',
    icon: 'i-ph-laptop-duotone',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright and clean',
    icon: 'i-ph-sun-duotone',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Easy on the eyes',
    icon: 'i-ph-moon-duotone',
  },
] satisfies Array<{ value: ThemePreference; label: string; description: string; icon: string }>
</script>
