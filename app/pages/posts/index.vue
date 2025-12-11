<template>
  <div class="min-h-screen py-12 md:py-16">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Admin Toolbar (sticky top) -->
      <div v-if="isAdmin" class="sticky top-4 z-40 mb-10">
        <div class="bg-background/60 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-2">
            <NButton :to="'/posts/new'" btn="soft-gray" size="sm" leading="i-ph-plus-bold">New Post</NButton>
          </div>

          <!-- Tabs (icons-only) aligned to the end/right -->
          <div class="ml-auto flex items-center gap-2">
            <NButton
              aria-label="Published"
              :btn="activeTab === 'published' ? 'soft' : 'ghost-gray'"
              size="sm"
              @click="setTab('published')"
              class="w-9 h-9 flex items-center justify-center"
              >
              <span class="i-ph-newspaper" />
            </NButton>

            <NButton
              aria-label="Drafts"
              :btn="activeTab === 'drafts' ? 'soft' : 'ghost-gray'"
              size="sm"
              @click="setTab('drafts')"
              class="w-9 h-9 flex items-center justify-center"
            >
              <span class="i-ph-file-text" />
            </NButton>

            <NButton
              aria-label="Archived"
              :btn="activeTab === 'archived' ? 'soft' : 'ghost-gray'"
              size="sm"
              @click="setTab('archived')"
              class="w-9 h-9 flex items-center justify-center"
            >
              <span class="i-ph-archive" />
            </NButton>

            <div class="text-xs opacity-60 ml-3" v-if="draftsPending || archivedPending">
              <span v-if="draftsPending" class="flex items-center gap-1"><span class="i-lucide-loader animate-spin" />Loading…</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Page Header -->
      <div v-if="(posts?.length || 0) > 0 && activeTab === 'published'" class="text-center mb-12 md:mb-16">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          Latest Posts
        </h1>
        <p class="text-lg md:text-xl text-muted max-w-2xl mx-auto">
          Explore stories, ideas, and insights from our writers
        </p>
      </div>

      <!-- Posts list (horizontal stacked cards) -->
      <div v-if="activeTab === 'published' && posts && posts.length > 0" class="max-w-7xl mx-auto flex flex-col divide-y divide-border rounded-xl overflow-hidden">
        <NuxtLink
          v-for="post in enhancedPosts"
          :key="post.slug"
          :to="`/posts/${post.slug}`"
          class="group"
        >
          <article class="w-full flex flex-col md:flex-row items-stretch bg-background border border-border hover:shadow-xl transition-all duration-300">
            <!-- Image -->
            <div v-if="post.image?.src" class="w-full md:w-48 overflow-hidden flex-shrink-0">
              <img
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 p-6 flex flex-col">
              <!-- Tags -->
              <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                <NButton
                  v-for="tag in post.tags.slice(0, 3)"
                  :key="tag.id"
                  size="xs"
                  variant="soft"
                >
                  {{ tag.name }}
                </NButton>
              </div>

              <!-- Title -->
              <h2 class="text-2xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {{ post.name }}
              </h2>

              <!-- Excerpt -->
              <p v-if="post.description" class="text-muted mb-4 line-clamp-2 flex-1">
                {{ post.description }}
              </p>

              <!-- Meta -->
              <div class="flex items-center justify-between pt-4 border-t border-border mt-4">
                <div v-if="post.user" class="flex items-center gap-3">
                  <img
                    v-if="post.user.avatar"
                    :src="post.user.avatar"
                    :alt="post.user.name || 'User'"
                    class="w-8 h-8 rounded-full"
                  />
                  <span class="text-sm font-medium">{{ post.user.name }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted">
                  <time>{{ post.formattedDate }}</time>
                  <span>•</span>
                  <span>{{ post.readingTime }}</span>
                </div>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>

      <!-- Loading state -->
      <div v-else-if="isLoadingVisible" class="text-center py-12">
        <p class="text-muted">Loading posts...</p>
      </div>

      <!-- Empty state (styled like error page) -->
      <div v-else-if="!hasVisiblePosts && !isLoadingVisible" class="text-center py-12">
        <div class="mb-6">
          <!-- Large glyph to mirror `app/error.vue` style (indicates empty state)
               Using '0' here to indicate zero posts — purely stylistic. -->
          <p class="error-code text-8xl md:text-size-54 font-extrabold leading-none">0</p>
        </div>

        <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-800 mb-4">No posts yet</h2>

        <p class="font-body font-500 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-8">
          There are no posts to display right now — yet. Create the first article, or explore other sections of the site.
        </p>

        <div class="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <NuxtLink to="/" class="px-6 py-5 bg-black dark:bg-white text-white dark:text-black text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center gap-2">
            <div class="i-ph-house-bold w-4 h-4"></div>
            Go Home
          </NuxtLink>

          <NuxtLink to="/credits" class="px-6 py-5 border border-gray-300 dark:border-gray-700 text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition flex items-center gap-2">
            <div class="i-ph-arrow-left-bold w-4 h-4"></div>
            Browse Credits
          </NuxtLink>
        </div>
      </div>

      <!-- Drafts (admin tab) -->
      <div v-if="isAdmin && activeTab === 'drafts'" class="mt-6 max-w-7xl mx-auto">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><span class="i-ph-file-text" />Drafts</h2>
        <div v-if="enhancedDrafts.length > 0" class="flex flex-col divide-y divide-border rounded-xl overflow-hidden bg-background border border-border">
          <NuxtLink v-for="post in enhancedDrafts" :key="post.slug" :to="`/posts/${post.slug}`" class="group">
            <article class="w-full flex flex-col md:flex-row items-stretch hover:shadow-lg transition-shadow duration-200">
              <div v-if="post.image?.src" class="w-full md:w-48 overflow-hidden flex-shrink-0">
                <img :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div class="flex-1 p-6 flex flex-col">
                <div class="flex items-center gap-2 mb-2"><NBadge badge="soft" color="gray">Draft</NBadge></div>
                <h3 class="text-xl font-semibold mb-2 line-clamp-2">{{ post.name }}</h3>
                <p v-if="post.description" class="text-muted mb-4 line-clamp-2 flex-1">{{ post.description }}</p>
                <div class="flex items-center justify-between pt-4 border-t border-border">
                  <span class="text-xs opacity-70">Updated {{ post.formattedDate }}</span>
                  <span class="text-xs opacity-60">{{ post.readingTime }}</span>
                </div>
              </div>
            </article>
          </NuxtLink>
        </div>
      </div>

      <!-- Archived (admin tab) -->
      <div v-if="isAdmin && activeTab === 'archived'" class="mt-6 max-w-7xl mx-auto">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><span class="i-ph-archive" />Archived</h2>
        <div v-if="enhancedArchived.length > 0" class="flex flex-col divide-y divide-border rounded-xl overflow-hidden bg-background border border-border">
          <NuxtLink v-for="post in enhancedArchived" :key="post.slug" :to="`/posts/${post.slug}`" class="group">
            <article class="w-full flex flex-col md:flex-row items-stretch hover:shadow-lg transition-shadow duration-200 opacity-80">
              <div v-if="post.image?.src" class="w-full md:w-48 overflow-hidden flex-shrink-0 grayscale">
                <img :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div class="flex-1 p-6 flex flex-col">
                <div class="flex items-center gap-2 mb-2"><NBadge badge="soft" color="gray">Archived</NBadge></div>
                <h3 class="text-xl font-semibold mb-2 line-clamp-2">{{ post.name }}</h3>
                <p v-if="post.description" class="text-muted mb-4 line-clamp-2 flex-1">{{ post.description }}</p>
                <div class="flex items-center justify-between pt-4 border-t border-border">
                  <span class="text-xs opacity-70">Updated {{ post.formattedDate }}</span>
                  <span class="text-xs opacity-60">{{ post.readingTime }}</span>
                </div>
              </div>
            </article>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const { enhancePost } = usePost()
const { user, loggedIn } = useUserSession()

// Fetch posts from API
const { data: posts, pending, error } = await useFetch<Post[]>('/api/posts')
// Drafts & archived (lazy fetch on toggle)
const { data: drafts, pending: draftsPending, execute: fetchDrafts } = useFetch<Post[]>('/api/posts/drafts', { immediate: false })
const { data: archived, pending: archivedPending, execute: fetchArchived } = useFetch<Post[]>('/api/posts/archived', { immediate: false })

// previously used toggles: replaced by admin tab (`activeTab`) and setTab()
// Admin tab state – controls which list is shown for admins (published/drafts/archived)
const activeTab = ref<'published'|'drafts'|'archived'>('published')

function setTab(tab: 'published'|'drafts'|'archived') {
  activeTab.value = tab
  if (tab === 'drafts' && !drafts.value) fetchDrafts()
  if (tab === 'archived' && !archived.value) fetchArchived()
}
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

// toggleDrafts / toggleArchived removed — use `setTab('drafts'|'archived')` instead

// Enhance posts with computed properties
const enhancedPosts = computed(() => posts.value ? posts.value.map(p => enhancePost(p)) : [])
const enhancedDrafts = computed(() => drafts.value ? drafts.value.map(p => enhancePost(p)) : [])
const enhancedArchived = computed(() => archived.value ? archived.value.map(p => enhancePost(p)) : [])

// Whether currently visible content contains any posts (used for empty-state logic)
const hasVisiblePosts = computed(() => {
  if (activeTab.value === 'published') return enhancedPosts.value.length > 0
  if (activeTab.value === 'drafts') return enhancedDrafts.value.length > 0
  if (activeTab.value === 'archived') return enhancedArchived.value.length > 0
  return false
})

const isLoadingVisible = computed(() => {
  if (activeTab.value === 'published') return pending.value
  if (activeTab.value === 'drafts') return draftsPending.value
  if (activeTab.value === 'archived') return archivedPending.value
  return false
})

useHead({
  title: 'Posts - Woords',
  meta: [
    { name: 'description', content: 'Explore our latest articles on travel, culture, and lifestyle.' }
  ]
})
</script>

<style scoped>
.error-code {
  color: transparent;
  -webkit-text-stroke: 2px #F5E5E1;
  cursor: default;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .error-code {
  -webkit-text-stroke: 2px #374151;
}

.error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
  transform: scale(0.99);
  animation: stroke-rainbow 3s linear infinite;
}

.dark .error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
}

@keyframes stroke-pulse {
  0%, 100% {
    -webkit-text-stroke-width: 3px;
    filter: drop-shadow(0 0 0px #FF8F8F);
  }
  50% {
    -webkit-text-stroke-width: 4px;
    filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6));
  }
}

@keyframes stroke-rainbow {
  0% { -webkit-text-stroke-color: #FF8F8F; }
  25% { -webkit-text-stroke-color: #FFF1CB; }
  50% { -webkit-text-stroke-color: #C2E2FA; }
  75% { -webkit-text-stroke-color: #B7A3E3; }
  100% { -webkit-text-stroke-color: #FF8F8F; }
}
</style>
