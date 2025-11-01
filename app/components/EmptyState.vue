<template>
  <article
    :class="[
      'group',
      variant === 'card' ? 'flex items-center gap-4 bg-gray-900 dark:bg-gray-950 rounded-2xl p-4 hover:bg-gray-850 dark:hover:bg-gray-900 transition-colors' : 'rounded-2xl border border-border p-8 md:p-10 flex flex-col items-center justify-center text-center bg-(slate-50/40 dark:slate-900/30)'
    ]"
  >
    <NuxtLink v-if="variant === 'card' && primaryTo" :to="primaryTo" class="flex items-center gap-4 flex-1">
      <!-- Image/Icon on the left -->
      <div class="relative overflow-hidden rounded-xl w-20 h-20 flex-shrink-0 bg-gradient-to-br from-gray-800 to-gray-700 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div :class="[icon || 'i-ph-placeholder-duotone', 'text-4xl text-gray-400 dark:text-gray-500']" />
      </div>
      
      <!-- Content on the right -->
      <div class="flex-1 min-w-0">
        <!-- Title -->
        <h3 class="text-base md:text-lg font-semibold leading-snug text-white dark:text-gray-100 group-hover:opacity-80 transition-opacity mb-2">
          {{ title }}
        </h3>
        
        <!-- Description (replaces date and author) -->
        <p v-if="description" class="text-sm text-gray-400 dark:text-gray-400 line-clamp-2">
          {{ description }}
        </p>
      </div>
    </NuxtLink>

    <!-- Panel variant (original centered layout) -->
    <template v-else-if="variant === 'panel'">
      <div class="flex flex-col items-center">
        <div class="mb-4">
          <div :class="[icon, 'text-5xl text-(slate-400 dark:slate-500)']" />
        </div>
        <h3 class="text-xl font-semibold">{{ title }}</h3>
        <p v-if="description" class="text-(slate-500 dark:slate-400) mt-2 max-w-2xl">
          {{ description }}
        </p>
        <div class="mt-6 flex flex-wrap gap-3 justify-center">
          <NButton
            v-if="primaryTo && primaryLabel"
            tag="a"
            :href="primaryTo"
            btn="solid-black"
          >
            {{ primaryLabel }}
          </NButton>
          <NButton
            v-if="secondaryTo && secondaryLabel"
            tag="a"
            :href="secondaryTo"
            btn="soft"
          >
            {{ secondaryLabel }}
          </NButton>
        </div>
      </div>
    </template>
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description?: string
  primaryTo?: string
  primaryLabel?: string
  secondaryTo?: string
  secondaryLabel?: string
  variant?: 'panel' | 'card'
  icon?: string
  badge?: string
  date?: string
  author?: string
}>(), {})
</script>
