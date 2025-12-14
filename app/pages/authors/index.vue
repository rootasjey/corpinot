<template>
  <section class="py-14 md:py-18 bg-white dark:bg-gray-950">
    <div class="container mx-auto px-6 max-w-6xl space-y-8">
      <header class="space-y-2">
        <p class="text-sm uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Our authors</p>
        <h1 class="text-3xl md:text-4xl font-serif font-800">Voices behind constellate*</h1>
        <p class="text-gray-600 dark:text-gray-400 max-w-3xl">Explore the writers crafting our stories. Click any author to view their bio and articles.</p>
      </header>

      <div v-if="pending" class="grid gap-6 md:grid-cols-2">
        <div v-for="i in 4" :key="i" class="p-6 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse h-36"></div>
      </div>

      <div v-else-if="error" class="text-red-600 dark:text-red-400">{{ error }}</div>

      <div v-else class="grid gap-6 md:grid-cols-2">
        <NuxtLink
          v-for="author in authors"
          :key="author.id"
          :to="`/authors/${author.id}`"
          class="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex gap-4 bg-white dark:bg-gray-900"
        >
          <img v-if="author.avatar" :src="author.avatar" :alt="author.name" class="w-16 h-16 rounded-full object-cover flex-none" />
          <div v-else class="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-semibold flex-none">
            {{ author.name.charAt(0).toUpperCase() }}
          </div>

          <div class="space-y-1 min-w-0">
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-semibold leading-tight">{{ author.name }}</h2>
              <span v-if="author.job" class="text-xs text-gray-500 dark:text-gray-400">— {{ author.job }}</span>
            </div>
            <p v-if="author.biography" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 whitespace-normal break-words">{{ author.biography }}</p>
            <p v-if="author.location" class="text-xs text-gray-500 dark:text-gray-400">{{ author.location }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

type Author = {
  id: number
  name: string
  avatar: string
  biography: string
  job: string
  location: string
}

const { data, pending, error } = await useFetch<Author[]>('/api/authors')
const authors = computed(() => data.value ?? [])
</script>
