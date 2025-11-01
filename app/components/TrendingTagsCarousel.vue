<template>
  <!-- Trending Tags Carousel -->
  <section class="bg-white dark:bg-gray-950">
    <div class="container mx-auto px-10">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm md:text-sm font-text font-600 uppercase">Trending tags</h2>
        <div class="flex">
          <NButton
            @click="scrollTags('left')"
            btn="ghost-gray"
            class="p-2"
          >
            <div class="i-ph-arrow-left-bold"></div>
          </NButton>
          <NButton
            @click="scrollTags('right')"
            btn="ghost-gray"
            class="p-2"
          >
            <div class="i-ph-arrow-right-bold"></div>
          </NButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
        <div v-for="i in 6" :key="i" class="flex-shrink-0 w-72 md:w-80 p-5 md:p-6 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse">
          <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-3"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="Tags unavailable"
        description="We couldn't fetch tags right now. Try again later."
        secondary-to="/posts"
        secondary-label="View posts"
      />

      <!-- Empty: dummy tags that match final UI -->
      <div
        v-else-if="trendingTags.length === 0"
        class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
        <div
          v-for="tag in placeholderTags"
          :key="tag"
          class="flex-shrink-0 w-72 md:w-80"
        >
          <div
            class="flex flex-col h-full p-5 md:p-6 rounded-2xl"
            :style="{ backgroundColor: colorForTag(tag) }"
          >
            <div class="space-y-2.5 md:space-y-3 flex-1">
              <h3 class="text-lg md:text-xl font-serif font-800 text-black">{{ tag }}</h3>
              <p class="text-xs md:text-sm leading-relaxed text-black/80 font-500 line-clamp-3">No posts yet. Add this tag to your first post.</p>
            </div>
            <div class="mt-3 md:mt-4">
              <span class="inline-block px-4 py-2 bg-white rounded-full text-xs font-600 text-black uppercase">
                Explore
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        ref="tagsContainer"
        class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
        <div
          v-for="tag in trendingTags"
          :key="tag.id"
          class="flex-shrink-0 w-72 md:w-80"
        >
          <NuxtLink
            to="/tags"
            class="flex flex-col h-full p-5 md:p-6 rounded-2xl transition-all hover:shadow-md"
            :style="{ backgroundColor: colorForTag(tag.name) }"
          >
            <div class="space-y-2.5 md:space-y-3 flex-1">
              <h3 class="text-lg md:text-xl font-serif font-800 text-black">{{ tag.name }}</h3>
              <p class="text-xs md:text-sm leading-relaxed text-black/80 font-500 line-clamp-3">{{ descriptionForTag(tag) }}</p>
            </div>
            <div class="mt-3 md:mt-4">
              <span class="inline-block px-4 py-2 bg-white rounded-full text-xs font-600 text-black uppercase">
                View Posts
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApiTag } from '~~/shared/types/tags'

const tagsContainer = ref<HTMLElement>()

function scrollTags(direction: 'left' | 'right') {
  if (!tagsContainer.value) return
  const scrollAmount = 400
  const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount
  tagsContainer.value.scrollBy({ left: scrollDirection, behavior: 'smooth' })
}

// Fetch tags
const tagStore = useTagStore()
const pending = ref(true)
const error = ref<string | null>(null)

try {
  await tagStore.fetchTags()
} catch (e: any) {
  error.value = e?.message || 'Failed to load tags'
} finally {
  pending.value = false
}

const trendingTags = computed<ApiTag[]>(() => tagStore.allTags.slice(0, 6))

const placeholderTags = ['Getting Started', 'Nuxt', 'Design', 'Tips', 'Guides', 'Announcements']

function colorForTag(name: string) {
  // Simple deterministic pastel color from string
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 80% 85%)`
}

function descriptionForTag(tag: ApiTag) {
  return tag.category ? `Category: ${tag.category}` : `Explore posts tagged “${tag.name}”`
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
