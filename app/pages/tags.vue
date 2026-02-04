<template>
  <Transition name="page" appear>
    <div>
      <section class="py-12 md:py-16 bg-white dark:bg-gray-950">
      <div class="container mx-auto px-6 max-w-7xl">
        <h1 class="text-3xl md:text-4xl font-serif font-800 mb-2">Tags</h1>
        <div class="flex items-center justify-between mb-8">
          <p class="text-sm text-gray-600 dark:text-gray-400 mr-4">Browse all tags and discover posts grouped by topic.</p>
          <div class="lg:hidden">
            <NButton btn="outline-gray" size="xs" rounded="2" leading="i-ph-tag" @click="tagsDrawerOpen = true">Filters</NButton>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Tags column -->
          <aside class="hidden md:block md:col-span-1">
            <ClientOnly>
              <div v-if="isAdmin" class="sticky z-20 mb-4 transition-all duration-200" :style="{ top: `${toolbarTop}px` }">
                <div class="bg-background/60 backdrop-blur-sm border border-border rounded-2xl px-3 py-2 flex items-center justify-between gap-3">
                  <div class="flex items-center gap-2">
                    <NButton @click="openNewTag" btn="outline-gray" size="xs" rounded="2" leading="i-ph-plus-bold">New Tag</NButton>
                  </div>
                </div>
              </div>
            </ClientOnly>
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

              <TransitionGroup v-else name="tags" tag="ul" class="space-y-3 max-h-[60vh] overflow-y-auto" appear>
                <li v-for="(tag, i) in filteredTags" :key="tag.id" :style="{ '--enter-delay': `${i * 40}ms` }">
                  <div class="flex items-center justify-between p-1 rounded-xl">
                    <button
                      @click="selectTag(tag.name)"
                      :class="[
                        'w-full flex items-center justify-between gap-4 p-3 rounded-xl transition-all text-left',
                        selectedTag === tag.name ? 'bg-gray-100 dark:bg-gray-800 shadow-sm' : 'hover:shadow-sm'
                      ]"
                      :style="selectedTag === tag.name ? { borderLeft: `4px solid ${colorForTag(tag.name)}`, paddingLeft: '0.75rem' } : {}"
                      :aria-pressed="selectedTag === tag.name"
                    >
                      <div class="flex items-center gap-3">
                        <span :style="{ backgroundColor: colorForTag(tag.name) }" class="w-9 h-9 rounded-lg inline-block flex-none"></span>
                        <div>
                          <div class="text-sm font-semibold">{{ tag.name }}</div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ tag.category || 'General' }}</div>
                          <div v-if="tag.description" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ tag.description }}</div>
                        </div>
                      </div>

                      <div class="flex items-center gap-3">
                        <div class="text-xs text-gray-600 dark:text-gray-300 font-semibold">{{ tagCounts[tag.name] || 0 }}</div>
                      </div>
                    </button>

                    <div v-if="isAdmin" class="ml-2">
                      <NDropdownMenu :items="menuItemsForTag(tag)" class="inline-block">
                        <NButton icon btn="ghost-gray" size="xs" @click.stop.prevent>
                          <NIcon name="i-ph-dots-three-vertical" />
                        </NButton>
                      </NDropdownMenu>
                    </div>
                  </div>
                </li>
              </TransitionGroup>
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
            <TransitionGroup v-else name="list" tag="div" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-8" appear>
              <article v-for="(post, i) in visiblePosts" :key="post.slug" :style="{ '--enter-delay': `${i * 50}ms` }" class="group flex flex-col">
                <NuxtLink :to="`/posts/${post.slug}`" class="block flex flex-col h-full">
                  <div v-if="post.image?.src" class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
                    <PostImage :src="post.image.src" :alt="post.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
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
            </TransitionGroup> 

            <div v-if="!visiblePosts.length && !postsPending && !postsError" class="mt-12 text-center text-gray-600 dark:text-gray-400">
              <h2 class="text-size-12 font-200">No posts found for this tag.</h2>
              <NButton 
                v-if="route.query.tag"
                btn="ghost-gray" 
                size="sm" 
                @click="selectTag(null)"
              >
                View all posts
              </NButton>
              <NButton 
                v-else
                btn="ghost-gray" 
                size="sm" 
                @click="router.push('/posts')"
              >
                Create a post
              </NButton>
            </div>
          </main>
        </div>
      </div>
    </section>

  <ClientOnly>
    <TagsDrawer
      v-model:open="tagsDrawerOpen"
      v-model:search="search"
      :tags="tags"
      :selectedTag="selectedTag"
      :tagCounts="tagCounts"
      :is-admin="isAdmin"
      @select="(name) => (selectTag(name), tagsDrawerOpen = false)"
      @new="openNewTag"
      @edit="openEditTag"
      @delete="onDeleteFromDrawer"
    />
  </ClientOnly>

  <NDialog v-model:open="tagDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>{{ editingTag ? 'Edit Tag' : 'New Tag' }}</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <div class="space-y-3">
          <NInput v-model="tagName" placeholder="Tag name" input="outline-blue" class="shadow-none ring-none" autofocus />
          <NInput v-model="tagDescription" placeholder="Description (optional)" input="outline-lime" />
          <NInput v-model="tagCategory" placeholder="Category (optional)" input="outline-pink" />
        </div>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="tagDialogOpen = false">Cancel</NButton>
        <NButton btn="solid-black" size="sm" @click="saveTag" :loading="saving" class="px-6">Save</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>

  <NDialog v-model:open="confirmDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>Delete tag</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">Are you sure you want to delete <strong>{{ tagPendingDelete?.name }}</strong>? This action cannot be undone and will remove the tag from posts.</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="confirmDialogOpen = false">Cancel</NButton>
        <NButton btn="solid-red" size="sm" @click="confirmDelete" :loading="deleting" class="px-5 py-0 min-h-0">Delete</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue'
import type { ApiTag } from '~~/shared/types/tags'
import type { Post as ApiPost } from '~~/shared/types/post'
import { useHeaderToolbarOffset } from '~/composables/useHeaderToolbarOffset' 

const { enhancePost } = usePost()

import { useRoute, useRouter } from 'vue-router'
import TagsDrawer from '~~/app/components/TagsDrawer.vue'

const route = useRoute()
const router = useRouter()
const config = useRuntimeConfig()

// Tags (use useFetch for SSR-safe hydration)
const { data: tagsData, pending: tagsPending, error: tagsError } = await useFetch<ApiTag[]>('/api/tags')
const tags = ref<ApiTag[]>(tagsData.value ?? [])
// keep tags ref in sync with fetched data (works on both server and client)
watch(tagsData, (v) => { tags.value = v ?? [] })

// Currently selected tag (may be set from route.query.tag)
const selectedTag = ref<string | null>(null)

// Dynamic OG image based on selected tag or default for all tags
const ogImageUrl = computed(() => {
  if (selectedTag.value) {
    return `${config.public.siteUrl}/og/tag/${selectedTag.value}.png`
  }
  return `${config.public.siteUrl}/og/home/default.png` // fallback to home OG
})

useSeoMeta({
  title: () => selectedTag.value ? `#${selectedTag.value} - Corpinot` : 'Tags - Corpinot',
  description: () => selectedTag.value ? `Browse posts tagged with ${selectedTag.value}` : 'Browse all tags and discover posts grouped by topic',
  ogTitle: () => selectedTag.value ? `#${selectedTag.value}` : 'Tags',
  ogDescription: () => selectedTag.value ? `Browse posts tagged with ${selectedTag.value}` : 'Browse all tags and discover posts grouped by topic',
  ogImage: ogImageUrl,
  ogUrl: () => `${config.public.siteUrl}/tags${selectedTag.value ? `?tag=${selectedTag.value}` : ''}`,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})

// when tags are loaded, if the route has a tag param select it (no route update)
watch([() => tags.value.length, () => route.query.tag], ([len, t]) => {
  if (!len) return
  const tStr = t ? String(t) : ''
  if (!tStr) {
    selectTag(null, false)
    return
  }
  const match = tags.value.find(x => x.name.toLowerCase() === tStr.toLowerCase())
  if (match) selectTag(match.name, false)
}, { immediate: true })

// Posts
const { data: postsData, pending: postsPending, error: postsError } = await useFetch<ApiPost[]>('/api/posts')
const posts = computed(() => (postsData.value ?? []).map(p => enhancePost(p)))

// UI state
const search = ref(route.query.q ? String(route.query.q) : '')

// keep search in sync with route query q
watch(() => route.query.q, (q) => {
  search.value = q ? String(q) : ''
})

// keep selectedTag in sync with route query tag (do not push back to route)
watch(() => route.query.tag, (t) => {
  const tStr = t ? String(t) : ''
  if (!tStr) {
    selectedTag.value = null
    return
  }
  const match = tags.value.find(x => x.name.toLowerCase() === tStr.toLowerCase())
  // If tags are available and we found a canonical name, prefer that; otherwise use raw tStr
  selectedTag.value = match ? match.name : tStr
}, { immediate: true })
// Initialize selectedTag on first render (SSR-friendly)
{
  const t = route.query.tag ? String(route.query.tag) : ''
  if (t) {
    const match = tags.value.find(x => x.name.toLowerCase() === t.toLowerCase())
    selectedTag.value = match ? match.name : t
  }
}

// Admin session + UI
const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')
const { top: toolbarTop } = useHeaderToolbarOffset({ baseOffsetPx: 24 })

// Tag CRUD UI state
const tagDialogOpen = ref(false)
const editingTag = ref<ApiTag | null>(null)
const tagName = ref('')
const tagCategory = ref('')
const tagDescription = ref('')
const saving = ref(false)

const confirmDialogOpen = ref(false)
const tagPendingDelete = ref<ApiTag | null>(null)
const deleting = ref(false)
const tagsDrawerOpen = ref(false)

const filteredTags = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return tags.value
  return tags.value.filter(t => t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
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

function selectTag(name: string | null, updateRoute = true) {
  selectedTag.value = name
  // Do NOT fill search input when selecting a tag - keep search separate
  const tagParam = name ?? ''
  if (!updateRoute) return
  const currentTag = route.query.tag ? String(route.query.tag) : ''
  if (currentTag !== tagParam) {
    const query = { ...route.query }
    if (tagParam) query.tag = tagParam
    else delete query.tag
    router.replace({ path: '/tags', query })
  }
}

function openNewTag() {
  editingTag.value = null
  tagName.value = ''
  tagCategory.value = ''
  tagDescription.value = ''
  tagDialogOpen.value = true
}

function openEditTag(tag: ApiTag) {
  editingTag.value = tag
  tagName.value = tag.name
  tagCategory.value = tag.category || ''
  tagDescription.value = tag.description || ''
  tagDialogOpen.value = true
}

function menuItemsForTag(tag: ApiTag) {
  return [
    { label: 'Edit', onSelect: () => openEditTag(tag), leading: 'i-ph-pencil' },
    { label: 'Delete', onSelect: () => (tagPendingDelete.value = tag, confirmDialogOpen.value = true), leading: 'i-ph-trash', color: 'danger' },
  ]
}

function onDeleteFromDrawer(tag: ApiTag) {
  tagPendingDelete.value = tag
  confirmDialogOpen.value = true
}

async function saveTag() {
  if (!tagName.value?.trim()) {
    alert('Tag name is required')
    return
  }
  saving.value = true
  try {
    if (editingTag.value) {
      const updated = await $fetch<ApiTag>(`/api/tags/${editingTag.value.id}`, { method: 'PUT' as any, body: { name: tagName.value.trim(), category: tagCategory.value.trim() || 'general', description: tagDescription.value.trim() } })
      tags.value = tags.value.map(t => t.id === updated.id ? updated : t)
    } else {
      const created = await $fetch<ApiTag>('/api/tags', { method: 'POST' as any, body: { name: tagName.value.trim(), category: tagCategory.value.trim() || 'general', description: tagDescription.value.trim() } })
      tags.value = [...tags.value, created].sort((a, b) => a.name.localeCompare(b.name))
    }
    tagDialogOpen.value = false
  } catch (e: any) {
    alert(e?.message || 'Failed to save tag')
  } finally {
    saving.value = false
  }
}

// Keyboard shortcut: Cmd/Ctrl + Enter to confirm tag dialog
function handleTagDialogKey(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (!(e.metaKey || e.ctrlKey)) return
  if (!tagDialogOpen.value) return
  e.preventDefault()
  if (!saving.value) saveTag()
}

watch(tagDialogOpen, (open) => {
  if (open) window.addEventListener('keydown', handleTagDialogKey)
  else window.removeEventListener('keydown', handleTagDialogKey)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleTagDialogKey)
})

async function confirmDelete() {
  if (!tagPendingDelete.value) return
  deleting.value = true
  try {
    await $fetch(`/api/tags/${tagPendingDelete.value.id}`, { method: 'DELETE' as any })
    tags.value = tags.value.filter(t => t.id !== tagPendingDelete.value?.id)
    if (selectedTag.value === tagPendingDelete.value.name) selectTag(null)
    tagPendingDelete.value = null
    confirmDialogOpen.value = false
  } catch (e) {
    console.error('Failed to delete tag', e)
  } finally {
    deleting.value = false
  }
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
.page-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(0.997);
}
.page-enter-active {
  transition: opacity 280ms cubic-bezier(0.2, 0, 0.2, 1), transform 280ms cubic-bezier(0.2, 0, 0.2, 1);
}
.page-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Respect reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .page-enter-from,
  .page-enter-to,
  .page-enter-active {
    transition: none !important;
    transform: none !important;
  }
}

/* Staggered list item entrance */
.list-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.997);
}
.list-enter-active {
  transition: opacity 320ms cubic-bezier(0.2, 0, 0.2, 1), transform 320ms cubic-bezier(0.2, 0, 0.2, 1);
  /* per-item delay via CSS variable set inline on each item */
  transition-delay: var(--enter-delay, 0ms);
}
.list-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .list-enter-from,
  .list-enter-to,
  .list-enter-active {
    transition: none !important;
    transform: none !important;
  }
}

/* Tags column staggered entrance */
.tags-enter-from {
  opacity: 0;
  transform: translateY(6px) scale(0.985);
}
.tags-enter-active {
  transition: opacity 260ms cubic-bezier(0.2, 0, 0.2, 1), transform 260ms cubic-bezier(0.2, 0, 0.2, 1);
  transition-delay: var(--enter-delay, 0ms);
}
.tags-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1);
}

@media (prefers-reduced-motion: reduce) {
  .tags-enter-from,
  .tags-enter-to,
  .tags-enter-active {
    transition: none !important;
    transform: none !important;
  }
}

</style>
