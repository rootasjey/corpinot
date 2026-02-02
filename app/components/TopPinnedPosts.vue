<template>
  <section class="py-8 md:py-12 bg-[#F8F9FA] dark:bg-gray-900">
    <div class="container mx-auto px-4 max-w-7xl">
      <!-- Loading -->
      <div v-if="pending" :class="scrollerClasses">
        <div v-for="i in 4" :key="i" :class="['flex gap-3 md:gap-4 items-start animate-pulse', itemClass]">
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
        title="Top pinned posts unavailable"
        description="We couldn't fetch pinned content. Please try again later."
        secondary-to="/posts"
        secondary-label="View all posts"
        variant="card"
        icon="i-ph-chats-duotone"
      />

      <!-- Content -->
      <div v-else-if="topPosts.length" :class="scrollerClasses">
        <article
          v-for="post in topPosts"
          :key="post.slug"
          :class="['group', itemClass]"
        >
          <NuxtLink :to="`/posts/${post.slug}`" class="flex gap-3 md:gap-4 items-start">
            <!-- Image on Left (smaller) -->
            <div v-if="post.image?.src" class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0">
              <NuxtImg
                :provider="post.image.src.startsWith('/posts/') ? 'hubblob' : undefined"
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover"
              />
            </div>

            <!-- Content on Right -->
            <div class="flex-1 min-w-0">
              <h2 class="text-base md:text-lg xl:text-base font-text font-bold mb-2 group-hover:underline transition-all line-clamp-1 md:line-clamp-1">
                {{ post.name }}
              </h2>
              <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400">
                <time>{{ post.formattedDate }}</time>
                <span>—</span>
                <span>{{ post.user?.name }}</span>
              </div>
              <span class="line-clamp-2 text-size-4 font-500 text-gray-700 dark:text-gray-300">{{ post.description }}</span>
            </div>
          </NuxtLink>
        </article>
      </div>

      <!-- Empty: dummy row matching final UI -->
      <div v-else :class="[scrollerClasses, 'justify-items-center']">
        <article v-for="(item, i) in dummyHero" :key="i" :class="['group w-90 xl:w-auto', itemClass]">
          <div class="flex gap-3 md:gap-4 items-start">
            <!-- Image placeholder on Left -->
            <div class="relative overflow-hidden rounded-xl w-24 h-24 md:w-28 md:h-28 xl:w-24 xl:h-24 flex-shrink-0 bg-gray-200 dark:bg-gray-800">
              <NuxtImg
                :provider="item.img.src.startsWith('/posts/') ? 'hubblob' : undefined"
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
const TOP_PINNED_TAG = 'top pinned'

const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: TOP_PINNED_TAG, limit: 4 },
})

const topPosts = computed(() => (data.value ?? []).map(p => enhancePost(p)))

const scrollerClasses = 'flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-6 xl:gap-4 md:overflow-visible md:snap-none'
const itemClass = 'min-w-[16rem] flex-shrink-0 snap-start md:min-w-0'

// Dummy items when empty – match the final UI
const today = new Date()
const formatted = today.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })
const dummyHero = [
  { title: 'Welcome to Corpinot', date: formatted, author: 'Get started', img: {src: "https://images.pexels.com/photos/1406282/pexels-photo-1406282.jpeg"} },
  { title: 'Create your first post', date: formatted, author: 'Tip', img: {src: "https://images.pexels.com/photos/159618/still-life-school-retro-ink-159618.jpeg"} },
  { title: 'Add a cover image', date: formatted, author: 'Suggestion', img: {src: "https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg"} },
  { title: 'Use tags to organize', date: formatted, author: 'Hint', img: {src: "https://images.pexels.com/photos/7422438/pexels-photo-7422438.jpeg"} }
]
</script>
