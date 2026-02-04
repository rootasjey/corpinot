<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <div class="mx-auto max-w-3xl px-4 pb-28 pt-6 md:pt-10">
      <header class="flex items-center justify-between gap-3 mb-5">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Search</p>
          <h1 class="text-2xl md:text-3xl font-title font-bold text-gray-900 dark:text-gray-50">Find posts, authors, tags</h1>
        </div>
        <NuxtLink to="/" class="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide border border-gray-200 dark:border-gray-800 rounded-full text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
          <span class="i-ph-house-duotone text-sm" />
          Home
        </NuxtLink>
      </header>

      <div class="relative mb-6">
        <NInput
          id="search-page-input"
          v-model="query"
          placeholder="Search posts, authors, tags"
          input="outline-blue"
          autofocus
          class="shadow-none ring-none w-full"
        />
        <span class="i-ph-magnifying-glass-duotone absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      <div class="flex flex-col gap-3 mb-6">
        <div v-if="recentSearches.length" class="flex items-center gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recent</span>
          <div class="flex-1 overflow-x-auto scrollbar-hide">
            <div class="flex items-center gap-2 min-w-max pr-2">
              <button
                v-for="item in recentSearches"
                :key="item"
                type="button"
                class="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                @click="query = item"
              >
                {{ item }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <span class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Suggested tags</span>
          <div class="flex-1 overflow-x-auto scrollbar-hide">
            <div class="flex items-center gap-2 min-w-max pr-2">
              <button
                v-for="tag in suggestedTags"
                :key="tag.id"
                type="button"
                class="px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900"
                :disabled="tagsPending"
                @click="query = tag.name"
              >
                #{{ tag.name }}
              </button>
              <span v-if="!suggestedTags.length && tagsPending" class="text-xs text-gray-500 dark:text-gray-400">Loading…</span>
              <span v-else-if="!suggestedTags.length && !tagsPending" class="text-xs text-gray-500 dark:text-gray-400">No tags yet</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isMobile && !query.trim() && enhancedRecentPosts.length" class="sm:hidden">
        <section class="py-4">
          <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100 mb-2">Recent Posts</h2>

          <div v-if="recentPending" class="space-y-3">
            <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse" />
          </div>

          <ul v-else class="space-y-3">
            <li
              v-for="post in enhancedRecentPosts"
              :key="post.slug"
              class="flex items-start gap-3"
            >
              <PostImage
                v-if="post.image?.src"
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="h-14 w-14 shrink-0 rounded-xl object-cover bg-gray-100 dark:bg-gray-900"
                loading="lazy"
                decoding="async"
                format="webp"
              />
              <div v-else class="h-14 w-14 shrink-0 rounded-xl bg-gray-200 dark:bg-gray-800" />
              <NuxtLink :to="`/posts/${post.slug}`" class="flex-1">
                <div class="text-base font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{{ post.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                  <time>{{ post.formattedDate }}</time>
                  <span>—</span>
                  <span>{{ post.readingTime }}</span>
                </div>
              </NuxtLink>
            </li>
          </ul>

          <div v-if="recentError" class="text-sm text-gray-500 dark:text-gray-400 mt-2">Couldn't load recent posts.</div>
        </section>
      </div>

      <div class="space-y-3">
        <div v-if="pending && showSkeleton" class="space-y-2">
          <div v-for="i in 6" :key="i" class="h-14 rounded-2xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
        </div>

        <div v-else-if="!results.length && query.trim()" class="text-sm text-gray-600 dark:text-gray-400 px-1">
          No results yet.
        </div>

        <div v-else-if="!results.length" class="text-sm text-gray-600 dark:text-gray-400 px-1">
          Try searching for a post title, an author name, or a tag.
        </div>

        <ul v-else class="space-y-2">
          <li
            v-for="item in results"
            :key="`${item.type}-${item.id}`"
            class="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex items-start gap-3 cursor-pointer hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            @click="select(item)"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ item.type }}</span>
                <span v-if="item.type === 'post' && item.readingTime" class="text-[11px] text-gray-400">{{ item.readingTime }}</span>
              </div>
              <div class="text-base font-semibold leading-tight text-gray-900 dark:text-gray-100 break-words line-clamp-2">
                {{ item.name }}
              </div>
              <p v-if="item.type === 'post'" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ item.description }}
              </p>
              <p v-else-if="item.type === 'author'" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ item.biography }}
              </p>
              <p v-else-if="item.type === 'tag'" class="text-sm text-gray-600 dark:text-gray-400">
                Tag
              </p>
            </div>
            <div class="text-gray-400">
              <span v-if="item.type === 'post'" class="i-ph-newspaper-duotone text-lg" />
              <span v-else-if="item.type === 'author'" class="i-ph-user-duotone text-lg" />
              <span v-else-if="item.type === 'tag'" class="i-ph-tag-duotone text-lg" />
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useDebounceFn, useStorage } from '@vueuse/core'
import type { Post } from '~~/shared/types/post'

type SearchResultType = 'post' | 'author' | 'tag'
interface SearchResult {
  id: string | number
  type: SearchResultType
  name: string
  slug?: string
  description?: string
  biography?: string
  readingTime?: string
}

interface TagSuggestion {
  id: string | number
  name: string
}

const router = useRouter()
const route = useRoute()

const initialQuery = typeof route.query.q === 'string' ? route.query.q : ''
const query = ref(initialQuery)
const results = ref<SearchResult[]>([])
const pending = ref(false)
const showSkeleton = ref(false)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null
const recentSearches = useStorage<string[]>('corpinot-search-recent', [])

const { data: tagsData, pending: tagsPending } = await useFetch<TagSuggestion[]>('/api/tags')
const suggestedTags = computed(() => (tagsData.value ?? []).slice(0, 10))
const isMobile = useIsMobile()

// Recent posts (mobile list, no images)
const { data: recentPostsData, pending: recentPending, error: recentError } = await useFetch<Post[]>('/api/posts', { params: { page: 1, limit: 6 } })
const { enhancePost } = usePost()
const enhancedRecentPosts = computed(() => (recentPostsData.value ?? []).map(p => enhancePost(p)))

function startSkeletonTimer() {
  clearSkeletonTimer()
  skeletonTimer = setTimeout(() => {
    showSkeleton.value = true
  }, 180)
}

function clearSkeletonTimer() {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }
  showSkeleton.value = false
}

const fetchResults = useDebounceFn(async () => {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    pending.value = false
    clearSkeletonTimer()
    router.replace({ query: {} })
    return
  }

  pending.value = true
  startSkeletonTimer()
  router.replace({ query: { q } })

  try {
    const res = await $fetch<{ posts?: SearchResult[]; authors?: SearchResult[]; tags?: SearchResult[] }>('/api/search', { params: { q } })
    const merged: SearchResult[] = []
    if (res.posts) merged.push(...res.posts)
    if (res.authors) merged.push(...res.authors)
    if (res.tags) merged.push(...res.tags)
    results.value = merged
    addRecent(q)
  } catch (e) {
    results.value = []
  } finally {
    pending.value = false
    clearSkeletonTimer()
  }
}, 300)

watch(query, () => fetchResults())

onMounted(() => {
  const input = document.getElementById('search-page-input') as HTMLInputElement | null
  input?.focus()
  if (query.value.trim()) fetchResults()
})

async function select(item: SearchResult) {
  if (item.type === 'post') {
    await router.push(`/posts/${item.slug}`)
  } else if (item.type === 'tag') {
    await router.push({ path: '/tags', query: { tag: item.name } })
  } else if (item.type === 'author') {
    await router.push({ path: `/authors/${item.slug || item.id}` })
  }
  addRecent(item.name)
}

function addRecent(term: string) {
  const value = term.trim()
  if (!value) return
  const existing = [...recentSearches.value]
  const filtered = existing.filter((q) => q.toLowerCase() !== value.toLowerCase())
  recentSearches.value = [value, ...filtered].slice(0, 10)
}
</script>
