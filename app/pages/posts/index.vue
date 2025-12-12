<template>
  <div class="min-h-screen py-6">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Admin Toolbar (sticky top) -->
      <div v-if="isAdmin" class="sticky top-4 z-12 mb-10">
        <div class="bg-background/60 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
          <div class="flex items-center gap-2">
            <NButton @click="isNewDrawerOpen = true" btn="soft-gray" size="sm" leading="i-ph-plus-bold">New Post</NButton>
            <NButton @click="triggerImportFile" btn="soft-gray" size="sm" leading="i-ph-file-arrow-up">Import</NButton>
            <ClientOnly>
              <input ref="fileInput" type="file" accept=".zip,application/zip,application/json,application/*" class="hidden" @change="onImportFileSelected" />
              <NewPostDrawer v-model="isNewDrawerOpen" @created="onPostCreated" />
            </ClientOnly>
          </div>

          <!-- Tabs (icons-only) aligned to the end/right -->
          <div class="ml-auto flex items-center gap-2">
            <NButton
              aria-label="Published"
              :btn="activeTab === 'published' ? 'soft' : 'ghost-gray'"
              size="sm"
              icon
              label="i-ph-newspaper"
              @click="setTab('published')"
              class="w-9 h-9 flex items-center justify-center"
            />
            
            <NButton
              aria-label="Drafts"
              :btn="activeTab === 'drafts' ? 'soft' : 'ghost-gray'"
              size="sm"
              icon
              label="i-ph-file-text"
              @click="setTab('drafts')"
              class="w-9 h-9 flex items-center justify-center"
            />

            <NButton
              aria-label="Archived"
              :btn="activeTab === 'archived' ? 'soft' : 'ghost-gray'"
              size="sm"
              icon
              label="i-ph-archive"
              @click="setTab('archived')"
              class="w-9 h-9 flex items-center justify-center"
            />

            <div class="text-xs opacity-60 ml-3" v-if="draftsPending || archivedPending">
              <span v-if="draftsPending" class="flex items-center gap-1"><span class="i-lucide-loader animate-spin" />Loading…</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Page Header -->
      <div v-if="(posts?.length || 0) > 0 && activeTab === 'published'" class="mb-12 md:mb-16">
        <h1 class="text-size-4xl md:text-size-24 font-bold line-height-28">
          Latest Posts
        </h1>
        <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl">
          Explore stories, ideas, and insights from our writers
        </p>
      </div>

      <!-- Posts list (grid cards) -->
      <div v-if="activeTab === 'published' && posts && posts.length > 0" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="post in enhancedPosts" :key="post.slug" class="relative">
          <NuxtLink
            :to="`/posts/${post.slug}`"
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
            <div v-if="post.image?.src" class="w-full md:w-48 overflow-hidden flex-shrink-0">
              <img
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 p-6 flex flex-col">
              <!-- Admin dropdown control is rendered outside the link to avoid being blocked by overlay -->
              
              <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
              <div class="flex items-center gap-2 mb-2" v-if="duplicatingPosts.has(post.slug)">
                <NBadge badge="soft" color="warning">Duplicating…</NBadge>
              </div>
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
              <p v-if="post.description" class="text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
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
                <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <time>{{ post.formattedDate }}</time>
                  <span>•</span>
                  <span>{{ post.readingTime }}</span>
                </div>
              </div>
            </div>
          </article>
          </NuxtLink>

          <!-- Admin controls outside the link so overlay can block link but not menu -->
                <!-- Admin dropdown control is rendered outside the link to avoid being blocked by overlay -->
          <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
            <NDropdownMenu :items="menuItemsForPost(post)">
              <template #default>
                <NButton :disabled="duplicatingPosts.has(post.slug)" icon btn="ghost" size="xs" @click.stop.prevent>
                  <NIcon name="i-ph-dots-three-vertical" />
                </NButton>
              </template>
            </NDropdownMenu>
          </div>
          <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
        </div>
      </div>

      <!-- Loading state -->
      <div v-else-if="isLoadingVisible" class="text-center py-12">
        <p class="text-slate-500 dark:text-slate-400">Loading posts...</p>
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
        <div class="mb-12">
          <h2 class="font-title text-size-24 font-bold line-height-24">
            Drafts
          </h2>

        <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl">
          These posts are not visible to the public
        </p>
        </div>
        <div v-if="enhancedDrafts.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="post in enhancedDrafts" :key="post.slug" class="relative">
            <NuxtLink
              :to="`/posts/edit/${post.slug}`"
              :class="[
                'group block bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:scale-101 active:scale-99', 
                { 
                  'scale-90 pointer-events-none opacity-70': duplicatingPosts.has(post.slug) 
                }
              ]"
              :aria-busy="duplicatingPosts.has(post.slug)"
            >
              <article class="h-full flex flex-col items-stretch relative">
              <div v-if="post.image?.src" class="w-full overflow-hidden">
                <img :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
              </div>
              <div class="flex-1 p-4 flex flex-col">
                <!-- Admin dropdown control is rendered outside the link to avoid being blocked by overlay -->
                
                <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
                <div class="flex items-center gap-2 mb-2">
                  <NBadge badge="soft dark:solid" color="gray">Draft</NBadge>
                  <NBadge v-if="duplicatingPosts.has(post.slug)" badge="soft" color="warning">Duplicating…</NBadge>
                </div>
                <h3 class="text-lg font-semibold mb-1 line-clamp-2">{{ post.name }}</h3>
                <p v-if="post.description" class="text-slate-500 dark:text-slate-400 mb-3 line-clamp-2 flex-1">{{ post.description }}</p>
                <div class="flex items-center justify-between pt-3 border-t border-border text-sm">
                  <span class="text-xs opacity-70">Updated {{ post.formattedDate }}</span>
                  <span class="text-xs opacity-60">{{ post.readingTime }}</span>
                </div>
              </div>
              </article>
            </NuxtLink>

            <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
              <NDropdownMenu :items="menuItemsForPost(post)">
                <template #default>
                  <NButton :disabled="duplicatingPosts.has(post.slug)" icon btn="ghost" size="xs" @click.stop.prevent>
                    <NIcon name="i-ph-dots-three-vertical" />
                  </NButton>
                </template>
              </NDropdownMenu>
            </div>
            
            <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div v-if="isAdmin && activeTab === 'archived'" class="mt-6 max-w-7xl mx-auto">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2"><span class="i-ph-archive" />Archived</h2>
        <div v-if="enhancedArchived.length > 0" class="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="post in enhancedArchived" :key="post.slug" class="relative">
              <NuxtLink :to="`/posts/${post.slug}`" :class="['group block bg-background border border-border rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 opacity-80 relative transform hover:scale-101 active:scale-99', { 'scale-90 pointer-events-none opacity-70': duplicatingPosts.has(post.slug) }]" :aria-busy="duplicatingPosts.has(post.slug)">
                <article class="h-full flex flex-col items-stretch">
                  <div v-if="post.image?.src" class="w-full overflow-hidden grayscale">
                    <img :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div class="flex-1 p-6 flex flex-col">
                    
                    <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
                    <div class="flex items-center gap-2 mb-2">
                      <NBadge badge="soft" color="gray">Archived</NBadge>
                      <NBadge v-if="duplicatingPosts.has(post.slug)" badge="soft" color="warning">Duplicating…</NBadge>
                    </div>
                    <h3 class="text-xl font-semibold mb-2 line-clamp-2">{{ post.name }}</h3>
                    <p v-if="post.description" class="text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">{{ post.description }}</p>
                    <div class="flex items-center justify-between pt-4 border-t border-border">
                      <span class="text-xs opacity-70">Updated {{ post.formattedDate }}</span>
                      <span class="text-xs opacity-60">{{ post.readingTime }}</span>
                    </div>
                  </div>
                </article>
              </NuxtLink>
              <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
                <NDropdownMenu :items="menuItemsForPost(post)">
                  <template #default>
                    <NButton :disabled="duplicatingPosts.has(post.slug)" icon btn="ghost" size="xs" @click.stop.prevent>
                      <NIcon name="i-ph-dots-three-vertical" />
                    </NButton>
                  </template>
                </NDropdownMenu>
              </div>
            </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Confirm Delete Modal -->
  <NDialog v-model:open="confirmDialogOpen">
    <NDialogOverlay />
    <NDialogContent class="max-w-md">
      <NDialogHeader>
        <NDialogTitle>Delete post</NDialogTitle>
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
import { onMounted } from 'vue'
import { useStorage } from '@vueuse/core'
const router = useRouter()
const confirmDialogOpen = ref(false)
const postPendingDelete = ref<Post | null>(null)
const deleting = ref(false)
const duplicatingPosts = ref(new Set<string | number>())

const { enhancePost } = usePost()
const { user, loggedIn } = useUserSession()

// New post drawer state + handler
const isNewDrawerOpen = ref(false)
function onPostCreated(p: Post) {
  // Insert into the currently visible list so the UI updates immediately
  if (activeTab.value === 'published') {
    if (!posts.value) posts.value = [p]
    else posts.value.unshift(p)
  } else if (activeTab.value === 'drafts') {
    if (!drafts.value) drafts.value = [p]
    else drafts.value.unshift(p)
  }
}

// Import file handling
const fileInput = ref<HTMLInputElement | null>(null)

function triggerImportFile() {
  fileInput.value?.click()
}

async function onImportFileSelected(e: Event) {
  const inputEl = e.target as HTMLInputElement | null
  const file = inputEl?.files?.[0]
  if (!file) return
      try {
        // Read file as text for JSON files, otherwise just note the selection
        if (file.type === 'application/json' || file.name.endsWith('.json')) {
          const text = await file.text()
          const parsed = JSON.parse(text)
          console.debug('Import JSON file parsed:', parsed)
          try {
            const created: any = await $fetch('/api/posts/import', { method: 'POST' as any, body: parsed })
            if (created?.slug) {
              // Navigate to edit page for the imported post so user can review
              router.push(`/posts/edit/${created.slug}`)
              return
            }
            await refreshAllLists()
            alert('Import completed')
          } catch (err) {
            console.warn('Import endpoint failed', err)
            alert('Import failed: ' + String(err))
          }
        } else if (file.type === 'application/zip' || file.name.endsWith('.zip')) {
          // Upload ZIP to server import endpoint
          try {
            const fd = new FormData()
            fd.append('file', file)
            const res = await fetch('/api/posts/import', { method: 'POST', body: fd })
            if (!res.ok) throw new Error(await res.text())
            const created = await res.json()
            if (created?.slug) router.push(`/posts/edit/${created.slug}`)
            else {
              await refreshAllLists()
              alert('Import completed')
            }
          } catch (err) {
            console.error('ZIP import failed', err)
            alert('ZIP import failed: ' + String(err))
          }
        } else {
          alert('Unsupported file type: ' + file.type)
        }
      } catch (err) {
        console.error('Failed to process import file', err)
        alert('Failed to process import file')
      } finally {
        if (fileInput.value) fileInput.value.value = ''
      }
}

// Fetch posts from API
const { data: posts, pending, error } = await useFetch<Post[]>('/api/posts')
// Drafts & archived (lazy fetch on toggle)
const { data: drafts, pending: draftsPending, execute: fetchDrafts } = useFetch<Post[]>('/api/posts/drafts', { immediate: false })
const { data: archived, pending: archivedPending, execute: fetchArchived } = useFetch<Post[]>('/api/posts/archived', { immediate: false })

// previously used toggles: replaced by admin tab (`activeTab`) and setTab()
// Admin tab state – controls which list is shown for admins (published/drafts/archived)
const activeTab = useStorage<'published'|'drafts'|'archived'>('posts.activeTab', 'published')

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

// If a persisted tab is drafts/archived, fetch them on page load so the UI matches stored state
onMounted(() => {
  if (activeTab.value === 'drafts' && !drafts.value) fetchDrafts()
  if (activeTab.value === 'archived' && !archived.value) fetchArchived()
})

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

// Router + post management actions (admin only)
async function refreshAllLists() {
  try {
    posts.value = await $fetch<Post[]>('/api/posts')
    if (drafts.value || activeTab.value === 'drafts') await fetchDrafts()
    if (archived.value || activeTab.value === 'archived') await fetchArchived()
  } catch (e) {
    console.error('Failed to refresh post lists', e)
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
  // If this is called directly (not via dialog) prompt via dialog
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
  // Add to set (reassign to trigger reactivity)
  duplicatingPosts.value = new Set([...duplicatingPosts.value, post.slug])
  try {
    const created: any = await $fetch(`/api/posts/${post.slug}/duplicate`, { method: 'POST' as any })
    if (created?.slug) {
      router.push(`/posts/edit/${created.slug}`)
    }
  } catch (e) {
    console.error('Failed to duplicate post', e)
  } finally {
    // Remove from set (reassign to trigger reactivity)
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

/* Duplicating overlay animation */
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
</style>
