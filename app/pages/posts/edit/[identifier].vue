<template>
  <div v-if="post" class="min-h-screen">
    <!-- Top action bar -->
    <div class="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 md:px-8 py-3">
        <div class="flex items-center justify-between gap-2">
          <NuxtLink to="/posts" class="text-sm hover:text-foreground flex items-center gap-2">
            <span class="i-lucide-arrow-left" /> Back
          </NuxtLink>
          <div class="flex items-center gap-2">
            <NTooltip :content="undoTooltip">
              <NButton
                @click="undoEditor"
                :disabled="!editor || !editor.can().undo()"
                :class="{ 'opacity-40 cursor-not-allowed': !editor || !editor.can().undo() }"
                icon
                label="i-ph-arrow-u-up-left-bold"
                btn="ghost-gray"
                size="xs"
              />
            </NTooltip>
            <NTooltip :content="redoTooltip">
              <NButton
                @click="redoEditor"
                :disabled="!editor || !editor.can().redo()"
                :class="{ 'opacity-40 cursor-not-allowed': !editor || !editor.can().redo() }"
                icon
                label="i-ph-arrow-u-up-right-bold"
                btn="ghost-gray"
                size="xs"
              />
            </NTooltip>
            <NButton :to="`/posts/${post.slug}`" btn="soft-gray" size="xs" target="_blank">
              <span class="i-lucide-external-link mr-2" />Preview
            </NButton>
            <NButton @click="saveAll" btn="soft-gray" size="xs" :disabled="saving || !name || !slug">
              <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
            </NButton>
            <NDropdownMenu :items="menuItems" class="menu-items">
              <NButton icon label="i-ph-dots-three-vertical" btn="soft-gray" size="xs" />
            </NDropdownMenu>

            <EditSlugDialog
              v-model="isSlugDialogOpen"
              v-model:slugCandidate="slugCandidate"
              :slug="slug"
              :slugCheckLoading="slugCheckLoading"
              :slugTaken="slugTaken"
              :slugCheckMessage="slugCheckMessage"
              :error="error"
              @save="saveSlug"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Hero / Title / Meta (mirrors read page) -->
    <div class="py-12 md:py-20">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <div class="font-600 text-md text-gray-400 flex items-center justify-center gap-3 mb-6">
            <time>{{ formatPostDate(post.publishedAt || post.createdAt) }}</time>
            <span>—</span>
            <span>{{ enhancedPost.readingTime }}</span>
          </div>
          <!-- Editable Title styled as H1 -->
          <textarea
            v-model="name"
            rows="1"
            class="w-full resize-none overflow-hidden text-4xl md:text-5xl lg:text-4xl font-serif font-700 text-center leading-tight bg-transparent outline-none focus:outline-none focus:ring-0"
            placeholder="Untitled"
            @input="autoResize($event)"
          />
          
          <!-- Editable description -->
          <NInput
            v-model="description"
            type="textarea"
            input="~"
            placeholder="Write a short description…"
            class="mt-4 max-w-3xl mx-auto text-center font-body font-600 color-gray-500 text-base md:text-lg leading-relaxed description-input"
            :rows="-1"
            ref="descriptionInput"
            @input="autoResizeDescription"
            @focus="autoResizeDescription"
          />
        </div>
      </div>
    </div>

    <!-- Featured Image (preview) -->
    <div v-if="post.image?.src" class="w-full px-4 relative group">
      <NuxtImg provider="hubblob" :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-auto max-h-[80vh] object-cover rounded-2xl" />
      <div v-if="uploadingCover" class="absolute left-0 bottom-0 w-full h-1 bg-black/20 rounded-b-2xl overflow-hidden">
        <div class="h-full bg-primary transition-all duration-300" :style="{ width: uploadProgress + '%' }" />
      </div>
      <!-- Overlay actions -->
      <div class="absolute top-4 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <NButton @click="triggerFileInput" btn="solid-white" size="xs" :disabled="uploadingCover" leading="i-ph-image">
          <span v-if="!uploadingCover">Replace</span>
          <span v-else>{{ uploadProgress }}%</span>
        </NButton>
        <NButton @click="deleteCoverImage" btn="solid-white" size="xs" leading="i-ph-trash" class="text-red-500" :disabled="uploadingCover">
          Delete
        </NButton>
      </div>
    </div>

    <!-- Info bar similar to read view -->
    <div class="border-b border-border bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto py-6">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div v-if="post.user" class="flex items-center gap-3">
              <img v-if="post.user.avatar" :src="post.user.avatar" :alt="post.user.name || 'User'" class="w-8 h-8 rounded-full" />
              <div v-if="post.user.name">
                <div class="font-semibold">{{ post.user.name }}</div>
              </div>
            </div>
            <div class="text-sm">
              <span class="opacity-70">Autosave enabled — editor content is saved automatically.</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editable Article Content using PostContent with floating toolbar -->
    <article class="py-12 md:py-16 bg-background">
      <div class="container mx-auto px-8 md:px-12">
        <div class="max-w-xl md:max-w-3xl mx-auto">
          <PostContent :content="articleContent" :editable="true" @update:content="onEditorUpdate" @editor-ready="onEditorReady" />
          <div class="mt-2 text-xs text-gray-500 flex justify-end items-center gap-2">
            <span v-if="savingArticle" class="i-lucide-loader animate-spin text-sm" aria-hidden />
            <span v-if="savingArticle">Autosaving…</span>
            <span v-else-if="lastArticleSavedAt">Saved {{ timeAgo }}</span>
          </div>
        </div>
      </div>
    </article>

    <!-- Hidden file input for cover image -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      @change="handleFileChange"
    />

    <!-- Save floating button (mobile convenience) -->
    <div class="fixed bottom-6 right-6 md:hidden">
      <NButton @click="saveAll" btn="ghost-gray" size="lg" :disabled="saving || !name || !slug">
        <span class="i-lucide-save mr-2" />Save
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import { watchDebounced, useDebounceFn, useTimeAgo } from '@vueuse/core'
import { nextTick } from 'vue'

const route = useRoute()
const router = useRouter()
const identifier = computed(() => route.params.identifier as string)

const session = await useUserSession()
const { enhancePost, formatPostDate } = usePost()

const post = ref<Post | null>(null)
const loading = ref(true)
const saving = ref(false)
// Separate autosave state so frequent editor saves don't toggle the header
// save button (which is used for manual / metadata saves).
const savingArticle = ref(false)
const lastArticleSavedAt = ref<number | null>(null)
// Human-readable "time ago" text for last autosave. useTimeAgo doesn't accept
// a nullable ref so we pass a computed fallback (0) and then hide the output
// when there's no saved timestamp.
const rawTimeAgo = useTimeAgo(computed(() => lastArticleSavedAt.value ?? 0))
const timeAgo = computed(() => (lastArticleSavedAt.value ? rawTimeAgo.value : ''))
let articleSpinnerTimer: ReturnType<typeof setTimeout> | null = null
const error = ref('')
const successMessage = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const uploadingCover = ref(false)
const uploadProgress = ref(0)

const name = ref('')
const description = ref('')
const descriptionInput = ref<any | null>(null)
const slug = ref('')
const status = ref<'draft' | 'published' | 'archived'>('draft')
const articleContent = ref({})
const enhancedPost = computed(() => post.value ? enhancePost(post.value) : ({ readingTime: '—' } as any))

const statusLabel = computed(() => {
  switch (status.value) {
    case 'published':
      return 'Published'
    case 'archived':
      return 'Archived'
    default:
      return 'Draft'
  }
})

const isSlugDialogOpen = ref(false)
const slugCandidate = ref('')
const slugCheckLoading = ref(false)
const slugTaken = ref(false)
const slugCheckMessage = ref('')

// Hold the tiptap editor instance once the PostContent emits it
const editor = ref<any | null>(null)

const onEditorReady = (ed: any) => {
  editor.value = ed
}

const undoEditor = () => {
  if (!editor.value) return
  try {
    editor.value.chain().focus().undo().run()
  } catch (e) {
    console.warn('Undo not available', e)
  }
}

const redoEditor = () => {
  if (!editor.value) return
  try {
    editor.value.chain().focus().redo().run()
  } catch (e) {
    console.warn('Redo not available', e)
  }
}

// Tooltip text for undo/redo — show a hint when there is nothing to undo/redo
const undoTooltip = computed(() => (editor?.value && editor.value.can().undo() ? 'Undo last editor action' : "Nothing to undo"))
const redoTooltip = computed(() => (editor?.value && editor.value.can().redo() ? 'Redo last editor action' : "Nothing to redo"))

const openSlugDialog = () => {
  slugCandidate.value = slug.value || ''
  isSlugDialogOpen.value = true
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const uploadCover = (file: File) => {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/posts/${identifier.value}/cover`)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(json)
        } catch (e) {
          reject(e)
        }
      }
    }
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        uploadProgress.value = Math.round((evt.loaded / evt.total) * 100)
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    xhr.send(formData)
  })
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length || !post.value) return
  const file = input.files[0]
  if (!file) return
  uploadingCover.value = true
  uploadProgress.value = 0
  error.value = ''
  try {
    const res: any = await uploadCover(file)
    if (res.success && res.image) {
      if (!post.value.image) post.value.image = {} as any
      post.value.image.src = res.image.src
      post.value.image.alt = res.image.alt
      successMessage.value = 'Cover image uploaded successfully'
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (e: any) {
    error.value = e?.message || e?.data?.message || 'Failed to upload cover image'
    console.error('Failed to upload cover:', e)
  } finally {
    uploadingCover.value = false
    input.value = ''
    setTimeout(() => (uploadProgress.value = 0), 800)
  }
}

const deleteCoverImage = async () => {
  if (!post.value?.image?.src) return
  if (!confirm('Are you sure you want to remove the cover image?')) return

  uploadingCover.value = true
  error.value = ''

  try {
    const res: any = await $fetch(`/api/posts/${identifier.value}/cover`, {
      method: 'DELETE',
    })

    if (res.success) {
      if (post.value.image) {
        post.value.image.src = ''
        post.value.image.alt = ''
      }
      successMessage.value = 'Cover image removed'
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to remove cover image'
    console.error('Failed to remove cover:', e)
  } finally {
    uploadingCover.value = false
  }
}

// When the dialog closes, clear any pending checks and reset state.
watch(isSlugDialogOpen, (open) => {
  if (!open) {
    // Cancel any in-flight slug validation and reset state
    if (slugCheckAbortController) {
      slugCheckAbortController.abort()
      slugCheckAbortController = null
    }
    slugCheckLoading.value = false
    slugTaken.value = false
    slugCheckMessage.value = ''
  }
})

const normalizeSlug = (value: string) => {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

watch(slugCandidate, (v, _ov) => {
  // Ensure live normalization while editing the dialog input
  if (!v) return
  const normalized = normalizeSlug(v)
  if (normalized !== v) slugCandidate.value = normalized
})

// We abort previous requests using AbortController to avoid stale results
let slugCheckAbortController: AbortController | null = null
const checkSlugUnique = async (value: string) => {
  if (!value || value === slug.value) {
    slugTaken.value = false
    slugCheckMessage.value = ''
    return
  }

  slugCheckLoading.value = true
  slugTaken.value = false
  slugCheckMessage.value = ''
  try {
    // Cancel previous in-flight request to avoid races and stale responses
    const params: any = { slug: value }
    if (post.value?.id) params.excludeId = post.value.id

    // Make a new abort controller and cancel any previous request
    if (slugCheckAbortController) slugCheckAbortController.abort()
    slugCheckAbortController = new AbortController()

    const res: any = await $fetch('/api/posts/slug/check', { params, signal: slugCheckAbortController.signal })
    if (res?.exists) {
      slugTaken.value = true
      slugCheckMessage.value = 'That slug is already in use.'
    }
    else {
      slugTaken.value = false
      slugCheckMessage.value = 'That slug is available.'
    }
  } catch (e: any) {
    // If request was aborted, ignore this response silently
    if (e?.name === 'AbortError') return
    // Non-blocking error
    slugCheckMessage.value = e?.data?.message || 'Failed to validate slug'
  } finally {
    slugCheckLoading.value = false
      // Clear controller when request is done so we don't attempt to abort a
      // completed controller later
      slugCheckAbortController = null
  }
}

watchDebounced(slugCandidate, (value) => {
  checkSlugUnique(value)
}, { debounce: 450 })

// Save only the slug via API and update local `slug` and `post`
const isNumericIdentifier = computed(() => /^\d+$/.test(String(identifier.value)))

const saveSlug = async () => {
  if (!post.value) return
  if (!slugCandidate.value) return

  saving.value = true
  error.value = ''
  try {
    const res: any = await $fetch(`/api/posts/${identifier.value}`, {
      method: 'PUT' as any,
      body: { slug: slugCandidate.value },
    })

    // Update local state (post and slug)
    if (res && typeof res === 'object' && 'post' in res) {
      post.value = res.post
      slug.value = res.post.slug
    } else {
      slug.value = slugCandidate.value
    }

    successMessage.value = 'Slug updated successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
    isSlugDialogOpen.value = false

    // If the edit page was opened with a slug identifier, update the route to
    // the new slug-based read URL so users can share/copy the canonical URL.
    if (!isNumericIdentifier.value && post.value?.slug) {
      await router.replace(`/posts/${post.value.slug}`)
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to update slug'
    console.error('Failed to update slug:', e)
  } finally {
    saving.value = false
  }
}

const menuItems = computed(() => {
  const items = [
    {
      label: 'Status',
      items: [
        { label: 'Draft', trailing: status.value === 'draft' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'draft') },
        { label: 'Published', trailing: status.value === 'published' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'published') },
        { label: 'Archived', trailing: status.value === 'archived' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'archived') },
      ]
    },
    { label: 'Edit Slug', onSelect: openSlugDialog, },
    { label: 'Delete Post', onSelect: deletePost, },
    {
      label: 'Cover Image',
      items: [
        post.value?.image?.src
          ? { label: 'Replace Cover Image', onSelect: triggerFileInput, leading: uploadingCover.value ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-image' }
          : { label: 'Add Cover Image', onSelect: triggerFileInput, leading: 'i-ph-image' },
        post.value?.image?.src
          ? { label: 'Delete Cover Image', onSelect: deleteCoverImage, leading: 'i-ph-trash' }
          : {},
      ]
    }
  ]

  return items
})

const fetchPost = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await $fetch<Post>(`/api/posts/${identifier.value}`)
    post.value = data
    
    // Check if user can edit
    if (data.user?.id !== session.user.value?.id) {
      error.value = 'You are not authorized to edit this post'
      router.push('/posts')
      return
    }
    
    // Populate form
    name.value = data.name
    description.value = data.description
    // Make sure the description field grows to fit initial content
    await nextTick()
    autoResizeDescription()
    slug.value = data.slug
    status.value = data.status
    articleContent.value = data.article || {}
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to load post'
    console.error('Failed to load post:', e)
  } finally {
    loading.value = false
  }
}

const saveMetadata = async () => {
  if (!post.value) return
  
  saving.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    const res: any = await $fetch(`/api/posts/${identifier.value}`, {
      method: 'PUT' as any,
      body: {
        name: name.value,
        description: description.value,
        slug: slug.value,
        status: status.value,
      },
    })

    if (res && typeof res === 'object' && 'post' in res) {
      post.value = res.post
      slug.value = res.post.slug
      // If this edit used a slug identifier, navigate to the canonical read URL
      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }

    successMessage.value = 'Post metadata updated successfully'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to update post metadata'
    console.error('Failed to update post:', e)
  } finally {
    saving.value = false
  }
}

const saveArticle = async (content: object) => {
  if (!post.value) return

  // Only show the autosave spinner if saving takes longer than this to avoid
  // quick blinks for very fast saves.
  articleSpinnerTimer = setTimeout(() => {
    savingArticle.value = true
  }, 300)

  error.value = ''
  successMessage.value = ''

  try {
    await $fetch(`/api/posts/${identifier.value}/article`, {
      method: 'PUT',
      body: {
        article: content,
      },
    })

    lastArticleSavedAt.value = Date.now()
    successMessage.value = 'Article content saved successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to save article content'
    console.error('Failed to save article:', e)
  } finally {
    // Cancel spinner timer and hide spinner shortly after completion so UI
    // doesn't flicker when saves are fast.
    if (articleSpinnerTimer) {
      clearTimeout(articleSpinnerTimer)
      articleSpinnerTimer = null
    }
    setTimeout(() => (savingArticle.value = false), 120)
  }
}

// Save both metadata and article
const saveAll = async () => {
  if (!post.value) return
  
  saving.value = true
  error.value = ''
  successMessage.value = ''
  
  try {
    // Save metadata first
    const res: any = await $fetch(`/api/posts/${identifier.value}`, {
      method: 'PUT' as any,
      body: {
        name: name.value,
        description: description.value,
        slug: slug.value,
        status: status.value,
      },
    })

    if (res && typeof res === 'object' && 'post' in res) {
      post.value = res.post
      slug.value = res.post.slug

      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }
    
    await $fetch(`/api/posts/${identifier.value}/article`, {
      method: 'PUT' as any,
      body: {
        article: articleContent.value,
      },
    })
    
    successMessage.value = 'Post saved successfully!'
    setTimeout(() => successMessage.value = '', 3000)
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to save post'
    console.error('Failed to save:', e)
  } finally {
    saving.value = false
  }
}

const deletePost = async () => {
  if (!post.value) return
  if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) return
  
  try {
    await $fetch(`/api/posts/${identifier.value}`, {
      method: 'DELETE' as any,
    })
    
    router.push('/posts')
  } catch (e: any) {
    error.value = e.data?.message || 'Failed to delete post'
    console.error('Failed to delete post:', e)
  }
}

// Auto-generate slug from name
watch(name, (newName) => {
  if (!slug.value || slug.value === post.value?.slug) {
    slug.value = newName.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }
})

// Auto-resize the NInput textarea when the description changes
watch(description, async () => {
  await nextTick()
  autoResizeDescription()
})

onMounted(() => {
  fetchPost()
})

// Debounce autosaves so the backend isn't hammered and the UI feels stable.
const debouncedSaveArticle = useDebounceFn(saveArticle, 700)

const onEditorUpdate = (json: object) => {
  debouncedSaveArticle(json)
}

// Autosize title textarea
const autoResize = (evt: Event) => {
  const el = evt.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// Find the textarea element wrapped by `NInput` and autosize it.
const autoResizeDescription = (evt?: Event | null) => {
  // Prefer the event target if provided (native textarea)
  let el: HTMLTextAreaElement | null = null
  if (evt) el = evt.target as HTMLTextAreaElement

  // Otherwise, try to locate a textarea inside the NInput wrapper
  if (!el && descriptionInput.value) {
    const wrapperEl: HTMLElement | null = (descriptionInput.value as any)?.$el ?? descriptionInput.value
    el = wrapperEl?.querySelector('textarea') ?? null
  }

  if (!el) return

  // Auto size
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
</script>

<style>
.dropdown-menu-group button {
  font-weight: 500;
}
.dropdown-menu-sub-content button {
  font-weight: 500;
}

/* Auto resizing for the post description NInput */
.description-input textarea {
  overflow: hidden; /* prevent scrollbars so we can size by content */
  resize: none; /* disable manual dragging */
}
</style>