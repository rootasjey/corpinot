<template>
  <div class="min-h-screen py-6">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Admin Toolbar (sticky top) -->
      <ClientOnly>
        <div v-if="isAdmin" class="sticky z-12 mb-10 transition-all duration-200" :style="{ top: `${toolbarTop}px` }">
          <div class="bg-background/60 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div class="flex items-center gap-2">
              <NButton @click="isNewDrawerOpen = true" btn="outline-gray" size="xs" leading="i-ph-plus-bold">
                <span class="hidden md:inline">New Project</span>
              </NButton>
              <NewPostDrawer v-model="isNewDrawerOpen" @created="onPostCreated" defaultTag="project" />
            </div>
          </div>
        </div>
      </ClientOnly>

      <!-- Page Header -->
      <div v-if="(posts?.length || 0) > 0" class="mb-12 md:mb-16">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-title text-size-24 font-bold line-height-28">
              <TypewriterText :text="'Projects'" :auto-hide-cursor="true" />
            </h1>

            <div class="flex items-center gap-2">
              <NDropdownMenu :items="viewDropdownItems" :_dropdownMenuContent="{ side: 'bottom', align: 'end' }">
                <template #default>
                  <NButton btn="outline-gray" size="xs" icon aria-label="Change view">
                    <NIcon :name="viewMode === 'cards' ? 'i-ph-squares-four' : 'i-ph-list-checks'" />
                  </NButton>
                </template>
              </NDropdownMenu>
              <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl">
                Showcasing our collection of project posts and case studies.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects list (grid cards & list view) -->
      <div v-if="posts && posts.length > 0">
        <!-- Grid (cards) -->
        <div v-if="!isListView" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="(post, i) in enhancedPosts" :key="post.slug" :class="['relative mb-6 transition-all duration-500 ease-out will-change-transform', { 'opacity-0 translate-y-3': !entered, 'opacity-100 translate-y-0': entered }]" :style="{ transitionDelay: `${i * 35}ms` }" @pointerdown="startLongPress(post.slug)" @pointerup="cancelLongPress" @pointercancel="cancelLongPress" @mouseleave="cancelLongPress">
            <NuxtLink
              :to="`/posts/${post.slug}`"
              @click="(e: MouseEvent) => onPostCardClick(e, post)"
              :class="[
                'group block bg-background border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-101 active:scale-99',
                { 
                  'scale-90': duplicatingPosts.has(post.slug), 
                  'pointer-events-none opacity-70': duplicatingPosts.has(post.slug) 
                }
              ]"
              :aria-busy="duplicatingPosts.has(post.slug)"
            >
              <article class="h-full flex flex-col items-stretch relative">
                <!-- Image -->
                <div v-if="post.image?.src" class="w-full overflow-hidden flex-shrink-0">
                  <PostImage :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
                </div>

                <!-- Content -->
                <div class="flex-1 p-6 flex flex-col">
                  <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
                  <div class="flex items-center gap-2 mb-2" v-if="duplicatingPosts.has(post.slug)">
                    <NBadge badge="soft" color="warning">Duplicating…</NBadge>
                  </div>
                  <!-- Title -->
                  <h2 class="text-2xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                    {{ post.name }}
                  </h2>

                  <!-- Excerpt -->
                  <p v-if="post.description" class="text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                    {{ post.description }}
                  </p>

                  <!-- Tags -->
                  <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                    <NBadge
                      v-for="tag in post.tags.slice(0, 3)"
                      :key="tag.id"
                      size="xs"
                      badge="soft-gray"
                    >
                      {{ tag.name }}
                    </NBadge>
                  </div>

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
                    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <time>{{ post.formattedDate }}</time>
                      <span>•</span>
                      <span>{{ post.readingTime }}</span>
                    </div>
                  </div>
                </div>
              </article>
            </NuxtLink>

            <ClientOnly>
              <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
                <NDropdownMenu :items="menuItemsForPost(post)">
                  <template #default>
                    <NButton :disabled="duplicatingPosts.has(post.slug)" icon btn="ghost" size="xs" @click.stop.prevent>
                      <NIcon name="i-ph-dots-three-vertical" />
                    </NButton>
                  </template>
                </NDropdownMenu>
              </div>
            </ClientOnly>

            <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
          </div>
        </div>

        <!-- List view -->
        <div v-else class="max-w-7xl mx-auto space-y-4">
          <div v-for="(post, i) in enhancedPosts" :key="post.slug" class="group relative w-full" :style="{ transitionDelay: `${i * 35}ms` }" @pointerdown="startLongPress(post.slug)" @pointerup="cancelLongPress" @pointercancel="cancelLongPress" @mouseleave="cancelLongPress">
            <ClientOnly>
              <div v-if="isAdmin && selectionMode" class="absolute right-12 top-5 z-2">
                <NCheckbox :model-value="selectedSlugs.has(post.slug)" @update:model-value="toggleSelected(post.slug)" />
              </div>
            </ClientOnly>

            <NLink :to="`/posts/${post.slug}`" @click="(e: MouseEvent) => onPostCardClick(e, post)" :class="['group block bg-background border border-border rounded-lg overflow-hidden hover:shadow transition-all duration-200 transform active:scale-99 flex items-start gap-4 p-4']" :aria-busy="duplicatingPosts.has(post.slug)">
              <div v-if="post.image?.src" class="w-36 h-24 overflow-hidden flex-shrink-0 rounded">
                <PostImage :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover" />
              </div>

              <div class="flex-1">
                <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
                <h2 class="text-lg font-semibold line-clamp-2 mb-1">{{ post.name }}</h2>
                <p v-if="post.description" class="text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{{ post.description }}</p>
                <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2">
                  <time>{{ post.formattedDate }}</time>
                  <span>•</span>
                  <span>{{ post.readingTime }}</span>
                </div>
              </div>
            </NLink>

            <ClientOnly>
              <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
                <NDropdownMenu :items="menuItemsForPost(post)">
                  <template #default>
                    <NButton :disabled="duplicatingPosts.has(post.slug)" icon btn="~" size="xs" @click.stop.prevent>
                      <NIcon name="i-ph-dots-three-vertical-bold" />
                    </NButton>
                  </template>
                </NDropdownMenu>
              </div>
            </ClientOnly>

            <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
          </div>
        </div>
      </div>


      <!-- Loading state -->
      <div v-else-if="isLoadingVisible" class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400">Loading projects…</p>
      </div>

      <!-- Empty state (styled like error page) -->
      <div v-else-if="!hasVisiblePosts && !isLoadingVisible" class="text-center py-12">
        <div class="mb-6">
          <p class="error-code text-8xl md:text-size-54 font-extrabold leading-none">0</p>
        </div>

        <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-800 mb-4">No projects yet</h2>

        <p class="font-body font-500 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-8">
          There are no project posts to display right now.
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
    </div>
  </div>

  <!-- Confirm Delete Modal -->
  <NDialog v-model:open="confirmDialogOpen">
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>Delete project post</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <p class="text-sm text-gray-700 dark:text-gray-300">Are you sure you want to delete <strong>{{ postPendingDelete?.name }}</strong>? This action cannot be undone.</p>
      </NDialogDescription>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="confirmDialogOpen = false">Cancel</NButton>
        <NButton btn="danger" size="sm" @click="confirmDelete" :loading="deleting">Delete</NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import { watch, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { useHeaderToolbarOffset } from '~/composables/useHeaderToolbarOffset'
const router = useRouter()
const confirmDialogOpen = ref(false)
const postPendingDelete = ref<Post | null>(null)
const { top: toolbarTop } = useHeaderToolbarOffset({ baseOffsetPx: 16 })
const deleting = ref(false)
const duplicatingPosts = ref(new Set<string | number>())

const { enhancePost } = usePost()
const { user, loggedIn } = useUserSession()

// New post drawer state + handler
const isNewDrawerOpen = ref(false)
function onPostCreated(p: Post) {
  if (!posts.value) posts.value = [p]
  else posts.value.unshift(p)
}

const projectTags = ['project', 'featured project']

async function fetchProjectPosts() {
  const results = await Promise.all(
    projectTags.map(tag => $fetch<Post[]>(`/api/posts?tag=${encodeURIComponent(tag)}`))
  )
  const merged = new Map<string, Post>()
  for (const list of results) {
    for (const post of list) {
      merged.set(post.slug, post)
    }
  }
  return Array.from(merged.values()).sort((a, b) => {
    const aTime = Date.parse(a.createdAt || '') || 0
    const bTime = Date.parse(b.createdAt || '') || 0
    return bTime - aTime
  })
}

// Fetch project posts from API (tags: project + featured project)
const { data: posts, pending, error } = await useAsyncData('project-posts', fetchProjectPosts)

const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

// Persistent view preference for projects
const viewMode = useStorage<'cards'|'list'>('projects.viewMode', 'cards')
const isListView = computed(() => viewMode.value === 'list')
const viewDropdownItems = computed(() => [
  { label: 'Cards', onSelect: () => (viewMode.value = 'cards'), leading: 'i-ph-squares-four', trailing: viewMode.value === 'cards' ? 'i-ph-check' : undefined },
  { label: 'List', onSelect: () => (viewMode.value = 'list'), leading: 'i-ph-list-checks', trailing: viewMode.value === 'list' ? 'i-ph-check' : undefined },
])

// Enhance posts with computed properties
const enhancedPosts = computed(() => posts.value ? posts.value.map(p => enhancePost(p)) : [])

const hasVisiblePosts = computed(() => enhancedPosts.value.length > 0)
const isLoadingVisible = computed(() => pending.value)

// subtle entrance animation state for project cards
const entered = ref(false)

// Selection & long-press helpers (same UX as posts list)
const selectedSlugs = ref(new Set<string>())
const selectionMode = ref(false)
let longPressTimer: ReturnType<typeof setTimeout> | null = null

function toggleSelected(slug: string) {
  const next = new Set(selectedSlugs.value)
  if (next.has(slug)) next.delete(slug)
  else next.add(slug)
  selectedSlugs.value = next
}

function startLongPress(slug: string) {
  if (selectionMode.value) return
  cancelLongPress()
  longPressTimer = setTimeout(() => {
    selectionMode.value = true
    // don't auto-select the item to mirror posts behavior
  }, 600)
}

function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

function onPostCardClick(evt: MouseEvent, post: Post) {
  if (selectionMode.value) {
    evt.preventDefault()
    toggleSelected(post.slug)
  }
}

// trigger entrance animations once projects are loaded and visible
watch(
  [() => enhancedPosts.value.length, () => isLoadingVisible.value],
  async ([len, loading]) => {
    if (loading) return
    entered.value = false
    await nextTick()
    if (import.meta.client) {
      const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(cb, 16)
      raf(() => setTimeout(() => { entered.value = true }, 30))
    } else {
      // Server: mark entered immediately to avoid calling browser APIs
      entered.value = true
    }
  },
  { immediate: true }
)

useHead({
  title: 'Projects — corpinot',
  meta: [
    { name: 'description', content: 'Browse our project posts and showcases.' }
  ]
})

async function refreshAllLists() {
  try {
    posts.value = await fetchProjectPosts()
  } catch (e) {
    console.error('Failed to refresh posts', e)
  }
}

async function updatePostStatus(post: Post, status: 'draft'|'published'|'archived') {
  try {
    await $fetch(`/api/posts/${post.slug}`, { method: 'PUT' as any, body: { status } })
    await refreshAllLists()
  } catch (e) {
    console.error('Failed to update status', e)
    throw e
  }
}

async function deletePost(post: Post) {
  if (!post) return
  try {
    await $fetch(`/api/posts/${post.slug}`, { method: 'DELETE' as any })
    await refreshAllLists()
  } catch (e) {
    console.error('Failed to delete post', e)
    throw e
  }
}

function editPost(post: Post) {
  router.push(`/posts/edit/${post.slug}`)
}

function menuItemsForPost(post: Post) {
  const isDup = duplicatingPosts.value.has(post.slug)
  return [
    {
      label: 'Status',
      items: [
        { label: 'Draft', trailing: post.status === 'draft' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'draft'), disabled: isDup },
        { label: 'Published', trailing: post.status === 'published' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'published'), disabled: isDup },
        { label: 'Archived', trailing: post.status === 'archived' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'archived'), disabled: isDup },
      ]
    },
    { label: 'Preview', onSelect: () => previewPost(post), leading: 'i-ph-external-link', disabled: isDup },
    { label: 'Edit', onSelect: () => !isDup && editPost(post), leading: 'i-ph-pencil', disabled: isDup },
    { label: 'Duplicate', onSelect: () => !isDup && duplicatePost(post), leading: 'i-ph-copy', disabled: isDup },
    { label: 'Delete Post', onSelect: () => !isDup && (postPendingDelete.value = post, confirmDialogOpen.value = true), leading: 'i-ph-trash', color: 'danger', disabled: isDup },
  ]
}

function previewPost(post: Post) {
  window.open(`/posts/${post.slug}`, '_blank')
}

async function confirmDelete() {
  if (!postPendingDelete.value) return
  deleting.value = true
  try {
    await deletePost(postPendingDelete.value)
    postPendingDelete.value = null
    confirmDialogOpen.value = false
  } catch (e) {
    console.error(e)
  } finally {
    deleting.value = false
  }
}

async function duplicatePost(post: Post) {
  if (!post) return
  duplicatingPosts.value = new Set([...duplicatingPosts.value, post.slug])
  try {
    const created: any = await $fetch(`/api/posts/${post.slug}/duplicate`, { method: 'POST' as any })
    if (created?.slug) {
      router.push(`/posts/edit/${created.slug}`)
    }
  } catch (e) {
    console.error('Failed to duplicate post', e)
  } finally {
    const s = new Set(duplicatingPosts.value)
    s.delete(post.slug)
    duplicatingPosts.value = s
  }
}
</script>

<style scoped>
.error-code {
  color: transparent;
  -webkit-text-stroke: 2px #F5E5E1;
  cursor: default;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.duplicate-overlay {
  background-image: linear-gradient(90deg, rgba(59,130,246,0.06) 0%, rgba(59,130,246,0.02) 50%, rgba(59,130,246,0.06) 100%);
  background-size: 200% 100%;
  animation: duplicate-sweep 2.5s linear infinite;
}

@keyframes duplicate-sweep {
  0% { background-position: -100% 0; }
  100% { background-position: 100% 0; }
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

/* List view tweaks */
.post-list-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
}
.post-list-thumb {
  width: 144px;
  height: 96px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
}

</style>
