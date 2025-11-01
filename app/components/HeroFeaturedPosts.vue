<template>
  <section class="py-8 md:py-12 bg-[#F8F9FA] dark:bg-gray-900">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-6 xl:gap-4">
        <div v-for="i in 4" :key="i" class="flex gap-3 md:gap-4 items-start animate-pulse">
          <div class="rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 bg-gray-200 dark:bg-gray-800"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="Featured posts unavailable"
        description="We couldn't fetch featured content. Please try again later."
        secondary-to="/posts"
        secondary-label="View all posts"
        variant="card"
        icon="i-ph-chats-duotone"
      />

      <!-- Content -->
      <div v-else-if="topPosts.length" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-6 xl:gap-4">
        <article
          v-for="post in topPosts"
          :key="post.slug"
          class="group"
        >
          <NuxtLink :to="`/posts/${post.slug}`" class="flex gap-3 md:gap-4 items-start">
            <!-- Image on Left (smaller) -->
            <div v-if="post.image?.src" class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0">
              <img
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content on Right -->
            <div class="flex-1 min-w-0">
              <h2 class="text-base md:text-lg xl:text-base font-text font-bold mb-2 group-hover:underline transition-all line-clamp-2 md:line-clamp-2">
                {{ post.name }}
              </h2>
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400">
                <time>{{ post.formattedDate }}</time>
                <span>—</span>
                <span>{{ post.user?.name }}</span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Empty: dummy row matching final UI -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-6 xl:gap-4 justify-items-center">
        <article v-for="(item, i) in dummyHero" :key="i" class="group w-100">
          <div class="flex gap-3 md:gap-4 items-start">
            <!-- Image placeholder on Left -->
            <div class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-800">
              <img
                v-if="item.img.src"
                :src="item.img.src"
                alt="Placeholder image"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <div class="i-ph-image-duotone text-2xl text-gray-400" />
              </div>
            </div>

            <!-- Content on Right -->
            <div class="flex-1 min-w-0">
              <h2 class="text-base md:text-lg xl:text-base font-text font-bold mb-2 line-clamp-2">
                {{ item.title }}
              </h2>
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400">
                <time>{{ item.date }}</time>
                <span>—</span>
                <span>{{ item.author }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const { enhancePost } = usePost()

const { data, pending, error } = await useFetch<Post[]>('/api/posts')
const topPosts = computed(() => (data.value ?? []).slice(0, 4).map(p => enhancePost(p)))

// Dummy items when empty – match the final UI
const today = new Date()
const formatted = today.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
const dummyHero = [
  { title: 'Welcome to Poststellar', date: formatted, author: 'Get started', img: {src: "https://images.pexels.com/photos/1406282/pexels-photo-1406282.jpeg"} },
  { title: 'Create your first post', date: formatted, author: 'Tip', img: {src: "https://images.pexels.com/photos/159618/still-life-school-retro-ink-159618.jpeg"} },
  { title: 'Add a cover image', date: formatted, author: 'Suggestion', img: {src: "https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg"} },
  { title: 'Use tags to organize', date: formatted, author: 'Hint', img: {src: "https://images.pexels.com/photos/7422438/pexels-photo-7422438.jpeg"} }
]
</script>
