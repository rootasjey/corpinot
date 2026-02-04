<template>
  <div class="min-h-screen py-6">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Admin Toolbar (sticky top) -->
      <ClientOnly>
        <div v-if="isAdmin" class="sticky z-12 mb-10 transition-all duration-200" :style="{ top: `${toolbarTop}px` }">
          <div class="bg-background/60 backdrop-blur-sm border border-border rounded-2xl px-4 py-3 flex items-center justify-between gap-3 shadow-sm">
            <div class="flex items-center gap-2">
              <NButton @click="isNewDrawerOpen = true" btn="outline-gray" size="xs" rounded="2" leading="i-ph-plus-bold">
                <span class="hidden md:inline">New Post</span>
              </NButton>
              <NButton @click="triggerImportFile" btn="outline-gray" size="xs"  rounded="2" leading="i-ph-file-arrow-up">
                <span class="hidden md:inline">Import</span>
              </NButton>
              <template v-if="selection.selectionMode.value">
                <span>•</span>
                <NDropdownMenu :items="exportDropdownItems" :_dropdownMenuContent="{ side: 'bottom', align: 'start' }">
                  <NButton btn="outline-gray" size="xs" rounded="2" :disabled="!selection.hasSelection" :loading="exporting">
                    <NIcon :name="exporting ? 'i-lucide-loader' : 'i-ph-download-simple'" :class="{ 'animate-spin': exporting }" />
                    <span class="ml-2">Export</span>
                  </NButton>
                </NDropdownMenu>
                <NBadge badge="soft" color="primary">{{ selection.selectedCount }}</NBadge>
                <NButton @click="() => selection.toggleSelectAllVisible(visiblePosts)" btn="outline-gray" size="xs" rounded="2" 
                  :leading="selection.allVisibleSelected(visiblePosts) ? 'i-ph-square-duotone' : 'i-ph-list-checks'">
                  {{ selection.allVisibleSelected(visiblePosts) ? 'Clear all' : 'Select all' }}
                </NButton>
                <NTooltip content="Exit selection mode">
                  <NButton btn="ghost-gray" icon label="i-ph-x" size="xs" @click="selection.clearSelection" />
                </NTooltip>
              </template>
              <input ref="fileInput" type="file" accept=".zip,application/zip,application/json,application/*" class="hidden" @change="onImportFileSelected" />
              <input ref="coverFileInput" type="file" accept="image/*" class="hidden" @change="onCoverFileSelected" />
              <NewPostDrawer v-model="isNewDrawerOpen" @created="onPostCreated" />
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
      </ClientOnly>
      
      <!-- Page Header -->
      <div class="mb-12 md:mb-16">
        <div v-if="activeTab === 'published'">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="font-title text-size-24 font-bold line-height-28 overflow-hidden">
                <TypewriterText :text="'Published'" :auto-hide-cursor="true" />
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
                  Explore stories, ideas, and insights from our writers.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="activeTab === 'drafts'">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="font-title text-size-24 font-bold line-height-24 overflow-hidden">
                <TypewriterText :text="'Drafts'" :auto-hide-cursor="true" />
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
                  These posts are not visible to the public.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div v-else-if="activeTab === 'archived'">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="font-title text-size-24 font-bold line-height-24 overflow-hidden">
                <TypewriterText :text="'Archived'" :auto-hide-cursor="true" />
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
                  These posts are archived and not visible to the public.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'published' && posts && posts.length > 0">
        <PostsList
          :posts="enhancedPosts"
          :viewMode="viewMode"
          :isAdmin="isAdmin"
          :selectionMode="selection.selectionMode.value"
          :selectedSlugs="selection.selected.value"
          :duplicatingPosts="duplicatingPosts"
          :coverUploadingPosts="coverUploadingPosts"
          :menuItemsForPost="menuItemsForPost"
          @toggle-selected="selection.toggleSelected"
          @long-press-start="longPress.startLongPress"
          @long-press-cancel="longPress.cancelLongPress"
          @post-click="onPostCardClick"
          :linkForPost="(p) => `/posts/${p.slug}`"
          :entered="entered"
        />
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
      <ClientOnly>
        <div v-if="isAdmin && activeTab === 'drafts'" class="mt-6 max-w-7xl mx-auto">
          <div v-if="enhancedDrafts.length > 0">
            <PostsList
              :posts="enhancedDrafts"
              :viewMode="viewMode"
              :isAdmin="isAdmin"
              :selectionMode="selection.selectionMode.value"
              :selectedSlugs="selection.selected.value"
              :duplicatingPosts="duplicatingPosts"
              :coverUploadingPosts="coverUploadingPosts"
              :menuItemsForPost="menuItemsForPost"
              @toggle-selected="selection.toggleSelected"
              @long-press-start="longPress.startLongPress"
              @long-press-cancel="longPress.cancelLongPress"
              @post-click="onPostCardClick"
              :linkForPost="(p) => `/posts/edit/${p.slug}`"
              :entered="entered"
            />
          </div>
        </div>
      </ClientOnly>

      <ClientOnly>
        <div v-if="isAdmin && activeTab === 'archived'" class="mt-6 max-w-7xl mx-auto">
          <div v-if="enhancedArchived.length > 0">
            <PostsList
              :posts="enhancedArchived"
              :viewMode="viewMode"
              :isAdmin="isAdmin"
              :selectionMode="selection.selectionMode.value"
              :selectedSlugs="selection.selected.value"
              :duplicatingPosts="duplicatingPosts"
              :coverUploadingPosts="coverUploadingPosts"
              :menuItemsForPost="menuItemsForPost"
              @toggle-selected="selection.toggleSelected"
              @long-press-start="longPress.startLongPress"
              @long-press-cancel="longPress.cancelLongPress"
              @post-click="onPostCardClick"
              :linkForPost="(p) => `/posts/${p.slug}`"
              :entered="entered"
            />
          </div>
        </div>
      </ClientOnly>
    </div>
  </div>

  <EditPostDialog v-model="editDialogOpen" :post="postToEdit" @saved="onPostSaved" />

  <!-- Confirm Delete Modal -->
  <NDialog v-model:open="confirmDialogOpen">
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
import { onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useStorage } from '@vueuse/core'
import { usePostsApi } from '~/composables/usePostsApi'
import TypewriterText from '~/components/TypewriterText.vue'
import { useHeaderToolbarOffset } from '~/composables/useHeaderToolbarOffset' 
import EditPostDialog from '~/components/EditPostDialog.vue' 

const router = useRouter()
const confirmDialogOpen = ref(false)
const postPendingDelete = ref<Post | null>(null)
const deleting = ref(false)
const duplicatingPosts = ref(new Set<string | number>())
const exporting = ref(false)

const selection = useSelection()
const longPress = useLongPress((slug: string) => {
  selection.setSelectionMode(true)
})

const { enhancePost } = usePost()
const { user, loggedIn } = useUserSession()

// New post drawer state + handler
const isNewDrawerOpen = ref(false)
const { top: toolbarTop } = useHeaderToolbarOffset({ baseOffsetPx: 16 })
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
const coverFileInput = ref<HTMLInputElement | null>(null)
const coverTargetPost = ref<Post | null>(null)
const coverUploadingPosts = ref(new Set<string | number>())
const { uploadCoverFile, deleteCover } = usePostsApi()

// Quick edit dialog state
const editDialogOpen = ref(false)
const postToEdit = ref<Post | null>(null)

function onPostSaved(updated: Post) {
  postToEdit.value = null
  editDialogOpen.value = false
  refreshAllLists()
}

function triggerImportFile() {
  fileInput.value?.click()
}

function triggerCoverUpload(post: Post) {
  coverTargetPost.value = post
  coverFileInput.value?.click()
}

async function onCoverFileSelected(e: Event) {
  const inputEl = e.target as HTMLInputElement | null
  const file = inputEl?.files?.[0]
  const target = coverTargetPost.value
  if (!file || !target) return
  const identifier = target.slug || String(target.id)
  coverUploadingPosts.value = new Set([...coverUploadingPosts.value, identifier])
  
  try {
    const res = await uploadCoverFile(identifier, file)
    if (res?.success && res.image) {
      if (!target.image) target.image = { alt: '', ext: '', src: '' }
      target.image.src = res.image.src ?? target.image.src ?? ''
      target.image.alt = res.image.alt ?? target.image.alt ?? ''
    }
  } catch (err) {
    console.error('Cover upload failed', err)
    alert('Cover upload failed: ' + String(err))
  } finally {
    coverTargetPost.value = null
    if (inputEl) inputEl.value = ''
    const next = new Set(coverUploadingPosts.value)
    next.delete(identifier)
    coverUploadingPosts.value = next
  }
}

async function removeCover(post: Post) {
  if (!post?.image?.src) return
  const identifier = post.slug || String(post.id)
  coverUploadingPosts.value = new Set([...coverUploadingPosts.value, identifier])
  
  try {
    await deleteCover(identifier)
    if (post.image) {
      post.image.src = ''
      post.image.alt = ''
    }
  } catch (err) {
    console.error('Failed to remove cover', err)
    alert('Failed to remove cover: ' + String(err))
  } finally {
    const next = new Set(coverUploadingPosts.value)
    next.delete(identifier)
    coverUploadingPosts.value = next
  }
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
        const importedPosts = Array.isArray(created?.posts) ? created.posts : (created ? [created] : [])
        if (importedPosts.length === 1) {
          router.push(`/posts/edit/${importedPosts[0].slug}`)
          return
        }
        await refreshAllLists()
        alert(`Import completed (${importedPosts.length || 0} posts)`)           
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
        const importedPosts = Array.isArray(created?.posts) ? created.posts : (created ? [created] : [])
        if (importedPosts.length === 1) {
          router.push(`/posts/edit/${importedPosts[0].slug}`)
        }
        else {
          await refreshAllLists()
          alert(`Import completed (${importedPosts.length || 0} posts)`)          
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

const { data: posts, pending, error } = await useFetch<Post[]>('/api/posts')
// Drafts & archived (lazy fetch on toggle)
const { data: drafts, pending: draftsPending, execute: fetchDrafts } = useFetch<Post[]>('/api/posts/drafts', { immediate: false })
const { data: archived, pending: archivedPending, execute: fetchArchived } = useFetch<Post[]>('/api/posts/archived', { immediate: false })

// previously used toggles: replaced by admin tab (`activeTab`) and setTab()
// Admin tab state – controls which list is shown for admins (published/drafts/archived)
const activeTab = useStorage<'published'|'drafts'|'archived'>('posts.activeTab', 'published')
// Persistent view preference: 'cards' or 'list'
const viewMode = useStorage<'cards'|'list'>('posts.viewMode', 'cards')

const viewDropdownItems = computed(() => [
  { label: 'Cards', onSelect: () => (viewMode.value = 'cards'), leading: 'i-ph-squares-four', trailing: viewMode.value === 'cards' ? 'i-ph-check' : undefined },
  { label: 'List', onSelect: () => (viewMode.value = 'list'), leading: 'i-ph-list-checks', trailing: viewMode.value === 'list' ? 'i-ph-check' : undefined },
])

function setTab(tab: 'published'|'drafts'|'archived') {
  activeTab.value = tab
  if (tab === 'drafts' && !drafts.value) fetchDrafts()
  if (tab === 'archived' && !archived.value) fetchArchived()
}

const isAdmin = computed(() => loggedIn.value && user.value?.role === 'admin')

const enhancedPosts = computed(() => posts.value ? posts.value.map(p => enhancePost(p)) : [])
const enhancedDrafts = computed(() => drafts.value ? drafts.value.map(p => enhancePost(p)) : [])
const enhancedArchived = computed(() => archived.value ? archived.value.map(p => enhancePost(p)) : [])

const visiblePosts = computed(() => {
  if (activeTab.value === 'published') return enhancedPosts.value
  if (activeTab.value === 'drafts') return enhancedDrafts.value
  if (activeTab.value === 'archived') return enhancedArchived.value
  return [] as Post[]
})

// If a persisted tab is drafts/archived, fetch them on page load so the UI matches stored state
function handleGlobalKeydown(e: KeyboardEvent) {
  // Ignore if event already handled or modifier keys are pressed
  if (e.defaultPrevented) return
  if (e.metaKey || e.ctrlKey || e.altKey) return

  // Don't react while the user is typing in inputs, textareas, or contentEditable elements
  const target = e.target as HTMLElement | null
  if (target) {
    const tag = target.tagName?.toLowerCase()
    if (tag === 'input' || tag === 'textarea' || target.isContentEditable) return
  }

  const key = (e.key || '').toLowerCase()
  if (key === 'a') setTab('archived')
  else if (key === 'p') setTab('published')
  else if (key === 'd') setTab('drafts')
  else if (key === 'l') viewMode.value = viewMode.value === 'list' ? 'cards' : 'list'
}

onMounted(() => {
  if (activeTab.value === 'drafts' && !drafts.value) fetchDrafts()
  if (activeTab.value === 'archived' && !archived.value) fetchArchived()

  // Only attach global listener in the browser
  if (import.meta.client) {
    window.addEventListener('keydown', handleGlobalKeydown)
  }
})

onUnmounted(() => {
  longPress.cancelLongPress()
  if (import.meta.client) {
    window.removeEventListener('keydown', handleGlobalKeydown)
  }
})

// subtle entrance animation state for post cards
const entered = ref(false)

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

// trigger entrance animations only after loading state and visible posts are ready
watch(
  [() => visiblePosts.value.length, () => isLoadingVisible.value, () => activeTab.value],
  async ([len, loading]) => {
    // only animate when content is ready
    if (loading) return
    entered.value = false
    await nextTick()
    // small rAF+timeout ensures DOM & initial styles are flushed before toggling
    if (import.meta.client) {
      const raf = typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame : (cb: FrameRequestCallback) => setTimeout(cb, 16)
      raf(() => setTimeout(() => { entered.value = true }, 30))
    } else {
      // Server / non-browser: mark entered immediately to avoid calling browser APIs (prevents SSR errors)
      entered.value = true
    }
  },
  { immediate: true }
)

useHead({
  title: 'Posts — corpinot',
  meta: [
    { name: 'description', content: 'Explore our latest articles on product, engineering, and ideas.' }
  ]
})

function exportFileName(extension: string, ids: string[]) {
  if (ids.length === 1) return `${ids[0]}-export.${extension}`
  return `posts-export-${new Date().toISOString().replace(/[:.]/g, '-')}.${extension}`
}

async function exportPosts(format: 'zip' | 'json', includeAssets: boolean, idsOverride?: string[]) {
  const ids = idsOverride ?? Array.from(selection.selected.value)
  if (!ids.length) return
  exporting.value = true
  try {
    if (format === 'zip') {
      const res = await fetch('/api/posts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifiers: ids, format: 'zip', includeAssets }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error(await res.text())
      const blobRes = await res.blob()
      const url = URL.createObjectURL(blobRes)
      const a = document.createElement('a')
      a.href = url
      a.download = exportFileName('zip', ids)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } else {
      const data = await $fetch('/api/posts/export', {
        method: 'POST' as any,
        body: { identifiers: ids, format: 'json', includeAssets: false },
      })
      const jsonBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(jsonBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = exportFileName('json', ids)
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }
  } catch (err) {
    console.error('Failed to export posts', err)
    alert('Export failed: ' + String(err))
  } finally {
    exporting.value = false
  }
}

const exportDropdownItems = computed(() => [
  { label: `Export ${selection.selectedCount.value || 0} as ZIP (with assets)`, onSelect: () => exportPosts('zip', true), leading: exporting.value ? 'i-lucide-loader animate-spin' : 'i-ph-download-simple', disabled: !selection.hasSelection.value },
  { label: 'Clear selection', onSelect: () => selection.clearSelection(), leading: 'i-ph-x', disabled: !selection.hasSelection.value },
  { label: 'Done', onSelect: () => selection.setSelectionMode(false), leading: 'i-ph-check', disabled: false },
])

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
  const isCoverBusy = coverUploadingPosts.value.has(post.slug)
  return [
    {
      label: 'Status',
      items: [
        { label: 'Draft', trailing: post.status === 'draft' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'draft'), disabled: isDup },
        { label: 'Published', trailing: post.status === 'published' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'published'), disabled: isDup },
        { label: 'Archived', trailing: post.status === 'archived' ? 'i-ph-check' : undefined, onSelect: () => !isDup && updatePostStatus(post, 'archived'), disabled: isDup },
      ]
    },
    {
      label: 'Cover',
      items: [
        { label: post.image?.src ? 'Replace cover' : 'Add cover', leading: 'i-ph-image', onSelect: () => !isDup && !isCoverBusy && triggerCoverUpload(post), disabled: isDup || isCoverBusy },
        { label: 'Remove cover', leading: 'i-ph-trash', onSelect: () => !isDup && !isCoverBusy && removeCover(post), disabled: isDup || isCoverBusy || !post.image?.src, color: 'danger' },
      ],
    },
    { label: 'Preview', onSelect: () => previewPost(post), leading: 'i-ph-external-link', disabled: isDup },
    { label: 'Select', onSelect: () => (selection.setSelectionMode(true), selection.toggleSelected(post.slug)), leading: 'i-ph-check', disabled: isDup },
    { label: 'Export ZIP', onSelect: () => exportPosts('zip', true, [post.slug]), leading: 'i-ph-download-simple', disabled: isDup },
    { label: 'Open in editor', onSelect: () => !isDup && editPost(post), leading: 'i-ph-pencil-line-fill', disabled: isDup },
    { label: 'Edit', onSelect: () => !isDup && (postToEdit.value = post, editDialogOpen.value = true), leading: 'i-ph-pencil', disabled: isDup },
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

function onPostCardClick(evt: MouseEvent, post: Post) {
  if (selection.selectionMode.value) {
    evt.preventDefault()
    selection.toggleSelected(post.slug)
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

.select-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.6rem;
  border-radius: 9999px;
  border: 1px solid var(--border-color, #e5e7eb);
  background-color: rgba(255, 255, 255, 0.92);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.select-checkbox {
  width: 1rem;
  height: 1rem;
  accent-color: var(--una-color-primary, #111827);
}

:global(.dark) .select-pill {
  background-color: rgba(15, 23, 42, 0.82);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.25);
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

.break-inside-avoid {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
  display: inline-block;
  width: 100%;
}
</style>
