<template>
  <section class="py-12 md:py-16 bg-white dark:bg-gray-950">
    <div class="container mx-auto px-4 max-w-7xl">
      <h2 class="text-xs md:text-sm font-semibold tracking-wider mb-2 uppercase text-gray-900 dark:text-gray-100">
        Recent Posts
      </h2>

      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12">
        <CardSkeleton v-for="i in 6" :key="i" :lines="3" />
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="We couldn't load recent posts"
        description="Please try again in a moment."
        secondary-to="/posts"
        secondary-label="Retry"
        variant="card"
        icon="i-ph-clock-counter-clockwise-duotone"
      />

      <!-- Empty: dummy grid matching final UI -->
      <div v-else-if="!enhancedPosts.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12">
        <article v-for="i in 6" :key="i" class="group flex flex-col">
          <!-- Image placeholder -->
          <div class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
            <div class="i-ph-image-duotone text-3xl text-gray-400" />
          </div>
          <!-- Content placeholder -->
          <div class="space-y-3 flex-1 flex flex-col">
            <span class="inline-block w-fit px-3 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">Category</span>
            <h3 class="text-lg md:text-xl font-serif font-bold leading-snug line-clamp-2 flex-1">Your post title goes here</h3>
            <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400 mt-auto">
              <time>{{ today }}</time>
              <span>—</span>
              <span>3 min read</span>
            </div>
          </div>
        </article>
      </div>

      <!-- Grid layout for posts -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 md:gap-y-12">
        <article
          v-for="post in enhancedPosts"
          :key="post.slug"
          class="group flex flex-col"
        >
          <NuxtLink :to="`/posts/${post.slug}`" class="block flex flex-col h-full">
            <!-- Image -->
            <div v-if="post.image?.src" class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
              <img
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>

            <!-- Content -->
            <div class="space-y-3 flex-1 flex flex-col">
              <!-- Category badge (first tag) -->
              <span v-if="post.tags?.length" class="inline-block w-fit px-3 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">
                {{ post.tags?.[0]?.name }}
              </span>
              
              <!-- Title -->
              <h3 class="text-lg md:text-xl font-serif font-bold leading-snug group-hover:opacity-80 transition-opacity line-clamp-2 flex-1">
                {{ post.name }}
              </h3>
              
              <!-- Metadata -->
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                <time>{{ post.formattedDate }}</time>
                <span>—</span>
                <span>{{ post.readingTime }}</span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
      <!-- Load More -->
      <div v-if="!pending && hasMore" class="mt-8 flex justify-center">
        <NButton :disabled="loadingMore" @click="loadMore">
          <span v-if="loadingMore" class="i-ph-circle-notch animate-spin mr-2" />
          {{ loadingMore ? 'Loading…' : 'Load more' }}
        </NButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const { enhancePost } = usePost()

// Client-side pagination with Load more
const page = ref(1)
const limit = 6
const items = ref<Post[]>([])
const pending = ref(true)
const error = ref<string | null>(null)
const hasMore = ref(false)
const loadingMore = ref(false)

async function load(pageToLoad = 1) {
  const params = { page: pageToLoad, limit }
  try {
    if (pageToLoad === 1) {
      pending.value = true
      error.value = null
    } else {
      loadingMore.value = true
    }
    const result = await $fetch<Post[]>('/api/posts', { params })
    if (pageToLoad === 1) items.value = result
    else items.value = [...items.value, ...result]
    hasMore.value = result.length === limit
    if (result.length > 0) page.value = pageToLoad
  } catch (e: any) {
    error.value = e?.message || 'Failed to load posts'
  } finally {
    pending.value = false
    loadingMore.value = false
  }
}

await load(1)

const enhancedPosts = computed(() => items.value.map(p => enhancePost(p)))

const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  return load(page.value + 1)
}
</script>
