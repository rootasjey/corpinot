<template>
  <div>
    <section class="py-12 md:py-16 bg-white dark:bg-gray-950">
      <div class="container mx-auto px-6 max-w-7xl">
        <h1 class="text-3xl md:text-4xl font-serif font-800 mb-2">Tags</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-8">Browse all tags and discover posts grouped by topic.</p>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Tags column -->
          <aside class="md:col-span-1">
            <div class="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 sticky top-6">
              <div class="flex items-center gap-3 mb-4">
                <input
                  v-model="search"
                  type="search"
                  placeholder="Search tags"
                  class="w-full px-4 py-2 rounded-xl bg-white/70 dark:bg-gray-800/60 placeholder-gray-400 outline-none"
                />
              </div>

              <div class="mb-4">
                <button
                  @click="selectTag(null)"
                  :class="['px-3 py-2 rounded-full text-sm font-semibold mr-2 mb-2', selectedTag === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100']"
                >
                  All
                </button>
              </div>

              <!-- Loading -->
              <div v-if="tagsPending" class="space-y-3">
                <div v-for="i in 6" :key="i" class="h-10 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
              </div>

              <!-- Error -->
              <EmptyState
                v-else-if="tagsError"
                title="Tags unavailable"
                description="We couldn't fetch tags right now. Try again later."
              />

              <ul v-else class="space-y-3 max-h-[60vh] overflow-y-auto">
                <li
                  v-for="tag in filteredTags"
                  :key="tag.id"
                >
                  <button
                    @click="selectTag(tag.name)"
                    class="w-full flex items-center justify-between gap-4 p-3 rounded-xl hover:shadow-sm transition-all text-left"
                    :aria-pressed="selectedTag === tag.name"
                  >
                    <div class="flex items-center gap-3">
                      <span :style="{ backgroundColor: colorForTag(tag.name) }" class="w-9 h-9 rounded-lg inline-block flex-none"></span>
                      <div>
                        <div class="text-sm font-semibold">{{ tag.name }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ tag.category || 'General' }}</div>
                      </div>
                    </div>

                    <div class="text-xs text-gray-600 dark:text-gray-300 font-semibold">{{ tagCounts[tag.name] || 0 }}</div>
                  </button>
                </li>
              </ul>
            </div>
          </aside>

          <!-- Posts column -->
          <main class="md:col-span-2">
            <!-- Loading posts -->
            <div v-if="postsPending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-8">
              <CardSkeleton v-for="i in 4" :key="i" :lines="3" />
            </div>

            <!-- Error posts -->
            <EmptyState
              v-else-if="postsError"
              title="Posts unavailable"
              description="We couldn't fetch posts right now. Try again later."
              secondary-to="/posts"
              secondary-label="View posts"
            />

            <!-- Posts grid -->
            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-8">
              <article v-for="post in visiblePosts" :key="post.slug" class="group flex flex-col">
                <NuxtLink :to="`/posts/${post.slug}`" class="block flex flex-col h-full">
                  <div v-if="post.image?.src" class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                    <img :src="post.image.src" :alt="post.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>

                  <div class="space-y-2 flex-1 flex flex-col">
                    <span v-if="post.tags?.length" class="inline-block w-fit px-3 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">{{ post.tags?.[0]?.name }}</span>
                    <h3 class="text-lg md:text-xl font-serif font-bold leading-snug group-hover:opacity-80 transition-opacity line-clamp-2 flex-1">{{ post.name }}</h3>
                    <div class="flex items-center gap-2 font-600 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                      <time>{{ post.formattedDate }}</time>
                      <span>—</span>
                      <span>{{ post.readingTime }}</span>
                    </div>
                  </div>
                </NuxtLink>
              </article>
            </div>

            <div v-if="!visiblePosts.length && !postsPending && !postsError" class="mt-12 text-center text-gray-600 dark:text-gray-400">
              No posts found for this tag.
            </div>
          </main>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ApiTag } from '~~/shared/types/tags'
import type { Post as ApiPost } from '~~/shared/types/post'

const { enhancePost } = usePost()

// Tags
const tags = ref<ApiTag[]>([])
const tagsPending = ref(true)
const tagsError = ref<string | null>(null)

try {
  tags.value = await $fetch<ApiTag[]>('/api/tags')
} catch (e: any) {
  tagsError.value = e?.message || 'Failed to load tags'
} finally {
  tagsPending.value = false
}

// Posts
const { data: postsData, pending: postsPending, error: postsError } = await useFetch<ApiPost[]>('/api/posts')
const posts = computed(() => (postsData.value ?? []).map(p => enhancePost(p)))

// UI state
const search = ref('')
const selectedTag = ref<string | null>(null)

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(t => t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q))
})

const tagCounts = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {}
  posts.value.forEach(p => {
    p.tags?.forEach(t => {
      counts[t.name] = (counts[t.name] || 0) + 1
    })
  })
  return counts
})

const visiblePosts = computed(() => {
  if (!selectedTag.value) return posts.value
  return posts.value.filter(p => p.tags?.some(t => t.name === selectedTag.value))
})

function colorForTag(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 80% 85%)`
}

function selectTag(name: string | null) {
  selectedTag.value = name
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* small scrollbar hide for aesthetics */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
