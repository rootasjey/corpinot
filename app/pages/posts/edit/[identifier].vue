<template>
  <div v-if="post" class="min-h-screen">
    <!-- Top action bar -->
    <div class="sticky z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-200" :style="{ top: `${toolbarTop}px` }">
      <div class="container mx-auto px-4 md:px-8 py-2 md:py-3">
        <div class="flex items-center justify-between gap-2">
          <NButton link to="/posts" btn="ghost-gray" size="xs" class="px-2">
            <span class="i-ph-arrow-bend-down-left-bold" /> <span class="hidden sm:inline">{{ $t('pages.postEditor.allPosts') }}</span>
          </NButton>
          <div class="flex items-center gap-1 md:gap-2">
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

            <div class="hidden sm:flex items-center gap-2">
              <NButton :to="`/posts/${post.slug}`" btn="~" size="xs" class="border b-dashed hover:b-solid" target="_blank">
                <span class="i-lucide-external-link mr-2" /><span class="hidden sm:inline">{{ $t('common.preview') }}</span>
              </NButton>
              <NDropdownMenu :items="exportMenuItems" :_dropdownMenuContent="{ side: 'bottom' }">
                <NButton btn="~" size="xs" class="border b-dashed hover:b-solid">
                  <NIcon :name="exportingZip ? 'i-lucide-loader' : 'i-ph-download-simple'" :class="{ 'animate-spin': exportingZip }" />
                </NButton>
              </NDropdownMenu>
            </div>

            <NButton @click="saveAll" btn="~" size="xs" :disabled="saving || !name || !slug" class="border b-dashed hover:b-solid" >
              <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
            </NButton>
            <NDropdownMenu :items="menuItems" class="menu-items">
              <NButton icon label="i-ph-dots-three-vertical" btn="~" size="xs" class="border b-dashed hover:b-solid" />
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

    <!-- Hero / Title / Meta extracted to component -->
    <PostMetadataEditor
      :name="name"
      :description="description"
      :reading-time="enhancedPost.readingTime"
      :date-label="formatPostDate(post.publishedAt || post.createdAt)"
      :post-id="post?.id || null"
      :tags="postTags"
      @update:name="name = $event"
      @update:description="description = $event"
      @update:tags="onTagsUpdated"
    />

    <!-- Featured Image (preview / placeholder) -->
    <div v-if="previewSrc || post.image?.src" class="w-full px-4 relative group">
      <img v-if="previewSrc" :src="previewSrc" :alt="post.image?.alt || post.name" class="w-full h-auto max-h-[80vh] object-cover rounded-2xl" />
      <NuxtImg v-else provider="hubblob" :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-auto max-h-[80vh] object-cover rounded-2xl" />

      <div v-if="uploadingCover" class="absolute left-0 bottom-0 w-full h-1 bg-black/20 rounded-b-2xl overflow-hidden">
        <div class="h-full bg-primary transition-all duration-300" :style="{ width: uploadProgress + '%' }" />
      </div>

      <!-- Overlay actions -->
      <div class="absolute top-4 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <NButton @click="triggerFileInput" btn="solid-white" size="xs" :disabled="uploadingCover" leading="i-ph-image">
          <span v-if="!uploadingCover">{{ $t('pages.postEditor.replace') }}</span>
          <span v-else>{{ uploadProgress }}%</span>
        </NButton>
        <NButton v-if="post.image?.src" @click="openDeleteCoverDialog" btn="solid-white" size="xs" leading="i-ph-trash" class="text-red-500" :disabled="uploadingCover">
          {{ $t('pages.postEditor.delete') }}
        </NButton>
        <NButton v-else-if="previewSrc && !uploadingCover" @click="clearPreview" btn="solid-white" size="xs" leading="i-ph-x">
          {{ $t('pages.postEditor.cancel') }}
        </NButton>
      </div>
    </div>

    <!-- Info bar similar to read view -->
    <div class="border-b border-border bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto py-6">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div v-if="post.user" class="flex items-center gap-3">
              <NuxtImg 
                provider="hubblob" 
                v-if="post.user.avatar" 
                :src="post.user.avatar" 
                :alt="post.user.name || 'User'" 
                fit="cover"
                class="w-8 h-8 rounded-full border" 
              />
              <div v-if="post.user.name">
                <div class="font-semibold">{{ post.user.name }}</div>
              </div>
            </div>
            <div class="text-sm">
              <span class="opacity-70">{{ $t('pages.postEditor.autosaveEnabled') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Editable Article Content using PostContent with floating toolbar -->
    <article class="py-12 md:py-16 bg-background">
      <div class="container mx-auto px-8 md:px-12">
        <div class="max-w-xl md:max-w-3xl mx-auto">
          <PostContent
            :content="articleContent"
            :editable="true"
            :ai-enabled="aiEnabled"
            :ai-loading="aiLoading"
            :on-ai-command="startAI"
            :on-configure-models="openAiProviderDialog"
            @update:content="onEditorUpdate"
            @editor-ready="onEditorReady"
          />
          <div class="mt-2 text-xs text-gray-500 flex justify-end items-center gap-2">
            <span v-if="savingArticle" class="i-lucide-loader animate-spin text-sm" aria-hidden />
            <span v-if="savingArticle">{{ $t('pages.postEditor.autosaving') }}</span>
            <span v-else-if="lastArticleSavedAt">{{ $t('pages.postEditor.saved', { timeAgo }) }}</span>
          </div>
        </div>
      </div>
    </article>

    <transition name="fade">
      <div v-if="aiSession" class="fixed bottom-5 right-5 z-40 w-[320px] rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur">
        <div class="flex items-center justify-between px-4 pt-3">
          <div class="flex items-center gap-2 font-semibold text-sm">
            <span class="i-lucide-sparkles text-primary" />
            <span>{{ aiStatus === 'streaming' ? $t('pages.postEditor.aiWriting') : $t('pages.postEditor.aiSuggestionReady') }}</span>
          </div>
          <NBadge badge="soft" color="primary">{{ aiStatus === 'streaming' ? $t('pages.postEditor.streaming') : $t('common.preview') }}</NBadge>
        </div>
        <div class="flex justify-end gap-2 px-4 py-3">
          <NButton btn="ghost-gray" size="xs" :disabled="aiLoading" @click="retryAI">{{ $t('pages.postEditor.retry') }}</NButton>
          <NButton btn="ghost-gray" size="xs" :disabled="aiLoading" @click="revertAI">{{ $t('pages.postEditor.revert') }}</NButton>
          <NButton btn="primary" size="xs" :disabled="aiLoading || aiStatus === 'streaming'" @click="commitAiDraft">{{ $t('pages.postEditor.applyChanges') }}</NButton>
        </div>
      </div>
    </transition>

    <NDialog v-model:open="translationsDialogOpen" dialog="md">
      <NDialogContent>
        <NDialogHeader>
          <NDialogTitle>{{ $t('editor.translationsManager.title') }}</NDialogTitle>
        </NDialogHeader>
        <TranslationsManager
          v-if="post"
          :post-id="post.id"
          :current-language="post.language"
          @translation-created="onTranslationCreated"
        />
      </NDialogContent>
    </NDialog>

    <NDialog v-model:open="translateDialogOpen">
      <NDialogContent class="max-w-md">
        <NDialogHeader>
          <NDialogTitle>{{ $t('pages.postEditor.translateSelection') }}</NDialogTitle>
        </NDialogHeader>

        <NDialogDescription>
          <p class="text-sm text-slate-600 dark:text-slate-300">{{ $t('pages.postEditor.translateDescription') }}</p>
        </NDialogDescription>

        <div class="mt-4 space-y-3">
          <div class="text-sm font-semibold flex items-center gap-2">
            <span class="i-lucide-languages" />
            <span>{{ $t('pages.postEditor.sourceLanguage') }}</span>
          </div>
          <div class="text-sm text-slate-600 dark:text-slate-400">{{ sourceLanguageLabel }} (from post)</div>

          <label class="text-sm font-semibold flex items-center gap-2" for="translate-target">
            <span class="i-lucide-flag" />
            <span>{{ $t('pages.postEditor.targetLanguage') }}</span>
          </label>
          <select
            id="translate-target"
            v-model="translateTargetLanguage"
            class="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60"
          >
            <option
              v-for="opt in languageOptions"
              :key="opt.value"
              :value="opt.value"
              :disabled="opt.value === sourceLanguage"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <NDialogFooter class="flex items-center gap-2 justify-end mt-5">
          <NButton btn="ghost-gray" size="sm" :disabled="aiLoading" @click="cancelTranslateDialog">{{ $t('pages.postEditor.cancel') }}</NButton>
          <NButton btn="primary" size="sm" :disabled="aiLoading" @click="confirmTranslate">{{ $t('pages.postEditor.translate') }}</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <AiProviderDialog
      v-model:open="aiProviderDialogOpen"
      v-model:provider="aiProvider"
    />

    <!-- Delete post confirmation -->
    <NDialog v-model:open="confirmDeleteDialogOpen">
      <NDialogContent class="max-w-md">
        <NDialogHeader>
          <NDialogTitle>{{ $t('pages.postEditor.deletePost') }}</NDialogTitle>
        </NDialogHeader>

        <NDialogDescription>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.postEditor.deletePostConfirm') }}</p>
        </NDialogDescription>

        <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
          <NButton btn="ghost-gray" size="sm" @click="confirmDeleteDialogOpen = false">{{ $t('pages.postEditor.cancel') }}</NButton>
          <NButton btn="danger" size="sm" @click="performDeletePost" :loading="deletePostLoading">{{ $t('pages.postEditor.delete') }}</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Remove cover image confirmation -->
    <NDialog v-model:open="confirmDeleteCoverOpen">
      <NDialogContent class="max-w-md">
        <NDialogHeader>
          <NDialogTitle>{{ $t('pages.postEditor.removeCoverTitle') }}</NDialogTitle>
        </NDialogHeader>

        <NDialogDescription>
          <p class="text-sm text-gray-700 dark:text-gray-300">{{ $t('pages.postEditor.removeCoverConfirm') }}</p>
        </NDialogDescription>

        <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
          <NButton btn="ghost-gray" size="sm" @click="confirmDeleteCoverOpen = false">{{ $t('pages.postEditor.cancel') }}</NButton>
          <NButton btn="danger" size="sm" @click="confirmDeleteCover" :loading="deleteCoverLoading">{{ $t('pages.postEditor.delete') }}</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>

    <!-- Hidden file input for cover image -->
    <input
      ref="fileInput"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="uploadingCover"
      @change="onCoverFileChange"
    />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import type { ApiTag } from '~~/shared/types/tags'
import { computed, onMounted, ref, watch } from 'vue'
import { useDebounceFn, useTimeAgo } from '@vueuse/core'
import type { AILength, AICommand } from '~/composables/useAIWriter'
import PostContent from '~/components/PostContent.vue'
import PostMetadataEditor from '~/components/PostMetadataEditor.vue'
import { usePost } from '~/composables/usePost'
import { usePostsApi } from '~/composables/usePostsApi'
import { usePostImages } from '~/composables/usePostImages'
import { useSlugValidation } from '~/composables/useSlugValidation'
import { usePostAI } from '~/composables/usePostAI'
import { useAISettings } from '~/composables/useAISettings'
import { deriveSlugFromName } from '~/utils/slug'
import { useTagStore } from '~/stores/tags'
import { useAIWriter } from '~/composables/useAIWriter'
import AiProviderDialog from '~/components/editor/AiProviderDialog.vue'
import { useHeaderToolbarOffset } from '~/composables/useHeaderToolbarOffset'

const route = useRoute()
const router = useRouter()
const identifier = computed(() => route.params.identifier as string)

const { user } = useUserSession()
const { top: toolbarTop } = useHeaderToolbarOffset({ baseOffsetPx: 0 })
const { enhancePost, formatPostDate } = usePost()
const tagStore = useTagStore()
const { fetchPost: fetchPostApi, updatePost, updateArticle, deletePost: deletePostApi, exportPostZip } = usePostsApi()
const { streamSuggestion, cancel } = useAIWriter()

const post = ref<Post | null>(null)
const postTags = ref<ApiTag[]>([])
const loading = ref(true)
const saving = ref(false)
const savingArticle = ref(false)
const lastArticleSavedAt = ref<number | null>(null)
const rawTimeAgo = useTimeAgo(computed(() => lastArticleSavedAt.value ?? 0))
const timeAgo = computed(() => (lastArticleSavedAt.value ? rawTimeAgo.value : ''))
let articleSpinnerTimer: ReturnType<typeof setTimeout> | null = null
const error = ref('')
const successMessage = ref('')
const exportingZip = ref(false)

// Delete confirmations (use Una UI dialogs instead of window.confirm)
const confirmDeleteDialogOpen = ref(false)
const deletePostLoading = ref(false)
const confirmDeleteCoverOpen = ref(false)
const deleteCoverLoading = ref(false)

const name = ref('')
const description = ref('')
const slug = ref('')
const status = ref<'draft' | 'published' | 'archived'>('draft')
const articleContent = ref({})

const runtimeConfig = useRuntimeConfig()
const aiEnabled = computed(() => runtimeConfig.public?.features?.aiWriter === true)
const aiLength = ref<AILength>('medium')
const { provider: aiProvider, getModelForAction } = useAISettings()
const aiProviderDialogOpen = ref(false)

const editor = ref<any | null>(null)

async function saveArticle(content: object) {
  if (!post.value) return

  articleSpinnerTimer = setTimeout(() => {
    savingArticle.value = true
  }, 300)

  error.value = ''
  successMessage.value = ''

  try {
    await updateArticle(identifier.value, content)
    lastArticleSavedAt.value = Date.now()
    successMessage.value = 'Article content saved successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save article content'
    console.error('Failed to save article:', e)
  } finally {
    if (articleSpinnerTimer) {
      clearTimeout(articleSpinnerTimer)
      articleSpinnerTimer = null
    }
    setTimeout(() => (savingArticle.value = false), 120)
  }
}

const debouncedSaveArticle = useDebounceFn(saveArticle, 700)

const { fileInput, uploadingCover, uploadProgress, previewSrc, clearPreview, triggerFileInput, handleFileChange, deleteCoverImage } = usePostImages(
  () => identifier.value,
  () => post.value,
)

const enhancedPost = computed(() => (post.value ? enhancePost(post.value) : ({ readingTime: '—' } as any)))
const isNumericIdentifier = computed(() => /^\d+$/.test(String(identifier.value)))

const { $t } = useI18n()
const languageOptions = [
  { value: 'en', label: $t('pages.postEditor.en') },
  { value: 'fr', label: $t('pages.postEditor.fr') },
  { value: 'es', label: $t('pages.postEditor.es') },
  { value: 'de', label: $t('pages.postEditor.de') },
  { value: 'it', label: $t('pages.postEditor.it') },
]
const sourceLanguage = computed(() => post.value?.language || 'en')
const sourceLanguageLabel = computed(() => languageOptions.find(o => o.value === sourceLanguage.value)?.label || sourceLanguage.value)
const postLanguage = computed(() => post.value?.language || 'en')
const translateDialogOpen = ref(false)
const translationsDialogOpen = ref(false)
const translateTargetLanguage = ref('en')
const pendingAICommand = ref<AICommand | null>(null)

const {
  aiLoading,
  aiError,
  aiSession,
  aiStatus,
  startAI: startAIInternal,
  commitAiDraft,
  retryAI,
  revertAI,
  cancelAI,
} = usePostAI({
  editor,
  identifier,
  aiEnabled,
  aiLength,
  aiProvider,
  getModelForAction,
  sourceLanguage,
  streamSuggestion,
  cancelStream: cancel,
  articleContent,
  onAutosave: (content) => debouncedSaveArticle(content as object),
})

const { 
  slugCandidate, 
  slugCheckLoading, 
  slugTaken, 
  slugCheckMessage, 
  setSlugCandidate, 
  reset: resetSlugValidation
} = useSlugValidation({
  currentSlug: () => slug.value,
  postId: () => post.value?.id,
})

const isSlugDialogOpen = ref(false)

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

const guessTargetLanguage = () => {
  const alt = languageOptions.find(o => o.value !== sourceLanguage.value)
  return alt?.value || 'en'
}

const startAI = async (command: AICommand) => {
  if (typeof command !== 'string' && command.action === 'translate' && !command.targetLanguage) {
    pendingAICommand.value = command
    translateTargetLanguage.value = guessTargetLanguage()
    translateDialogOpen.value = true
    return
  }

  await startAIInternal(command)
}

function openAiProviderDialog() {
  aiProviderDialogOpen.value = true
}

watch(aiError, (msg) => {
  if (!msg) return
  useToast().toast({ title: $t('pages.postEditor.aiError'), description: msg, toast: 'danger' })
})

const confirmTranslate = async () => {
  const cmd = pendingAICommand.value

  // Ensure we have an object command (not a string literal) and it's a translate action
  if (!cmd || typeof cmd === 'string' || cmd.action !== 'translate') {
    translateDialogOpen.value = false
    pendingAICommand.value = null
    return
  }

  const payload: AICommand = {
    action: 'translate',
    targetLanguage: translateTargetLanguage.value,
    sourceLanguage: cmd.sourceLanguage || sourceLanguage.value,
  }

  translateDialogOpen.value = false
  pendingAICommand.value = null
  await startAIInternal(payload)
}

const cancelTranslateDialog = () => {
  translateDialogOpen.value = false
  pendingAICommand.value = null
}

const undoTooltip = computed(() => (editor?.value && editor.value.can().undo() ? $t('pages.postEditor.undo') : $t('pages.postEditor.undoEmpty')))
const redoTooltip = computed(() => (editor?.value && editor.value.can().redo() ? $t('pages.postEditor.redo') : $t('pages.postEditor.redoEmpty')))

const openSlugDialog = () => {
  setSlugCandidate(slug.value || '')
  isSlugDialogOpen.value = true
}

watch(isSlugDialogOpen, (open) => {
  if (!open) {
    resetSlugValidation()
    error.value = ''
  }
})

const saveSlug = async () => {
  if (!post.value || !slugCandidate.value) return

  saving.value = true
  error.value = ''
  try {
    const res = await updatePost(identifier.value, { slug: slugCandidate.value })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug
      postTags.value = res.post.tags ?? postTags.value
    } else {
      slug.value = slugCandidate.value
    }

    successMessage.value = 'Slug updated successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
    isSlugDialogOpen.value = false

    if (!isNumericIdentifier.value && post.value?.slug) {
      await router.replace(`/posts/${post.value.slug}`)
    }
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to update slug'
    console.error('Failed to update slug:', e)
  } finally {
    saving.value = false
  }
}

const menuItems = computed(() => {
  const items = [
    {
      label: $t('pages.posts.status'),
      items: [
        { label: $t('pages.posts.draft'), trailing: status.value === 'draft' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'draft') },
        { label: $t('pages.posts.published'), trailing: status.value === 'published' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'published') },
        { label: $t('pages.posts.archived'), trailing: status.value === 'archived' ? 'i-ph-check' : undefined, onSelect: () => (status.value = 'archived') },
      ],
    },
    {
      label: $t('common.language'),
      items: languageOptions.map(lang => ({
        label: lang.label,
        trailing: postLanguage.value === lang.value ? 'i-ph-check' : undefined,
        onSelect: () => updatePostLanguage(lang.value),
      })),
    },
    { label: $t('editor.translationsManager.title'), onSelect: () => { translationsDialogOpen.value = true }, leading: 'i-ph-translate' },
    { label: $t('pages.postEditor.editSlug'), onSelect: openSlugDialog },
    { label: $t('common.deletePost'), onSelect: openDeleteDialog },
    { label: $t('pages.postEditor.exportZip'), onSelect: exportPostZipFile, leading: exportingZip.value ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple' },
    {
      label: $t('pages.posts.cover'),
      items: [
        post.value?.image?.src
          ? { label: $t('pages.posts.replaceCover'), onSelect: triggerFileInput, leading: uploadingCover.value ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-image' }
          : { label: $t('pages.posts.addCover'), onSelect: triggerFileInput, leading: 'i-ph-image' },
        post.value?.image?.src
          ? { label: $t('pages.posts.removeCover'), onSelect: openDeleteCoverDialog, leading: 'i-ph-trash' }
          : {},
      ],
    },
  ]

  return items
})

const exportMenuItems = computed(() => [
  { label: $t('pages.postEditor.exportJson'), onSelect: exportPost, leading: 'i-ph-file-json' },
  { label: $t('pages.postEditor.exportZipAssets'), onSelect: exportPostZipFile, leading: exportingZip.value ? 'i-ph-spinner-gap-bold animate-spin' : 'i-ph-download-simple' },
])

const fetchPost = async () => {
  loading.value = true
  error.value = ''

  try {
    const data = await fetchPostApi(identifier.value)
    post.value = data

    if (data.user?.id !== user.value?.id) {
      error.value = 'You are not authorized to edit this post'
      router.push('/posts')
      return
    }

    name.value = data.name
    description.value = data.description || ''
    slug.value = data.slug
    status.value = data.status
    articleContent.value = data.article || {}
    postTags.value = data.tags ?? []
    tagStore.fetchTags().catch(() => {})
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to load post'
    console.error('Failed to load post:', e)
  } finally {
    loading.value = false
  }
}

const onTagsUpdated = (tags: ApiTag[]) => {
  postTags.value = tags
  if (post.value) post.value.tags = tags
}

const saveMetadata = async () => {
  if (!post.value) return

  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const res = await updatePost(identifier.value, {
      name: name.value,
      description: description.value,
      slug: slug.value,
      status: status.value,
    })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug
      postTags.value = res.post.tags ?? postTags.value
      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }

    successMessage.value = 'Post metadata updated successfully'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to update post metadata'
    console.error('Failed to update post:', e)
  } finally {
    saving.value = false
  }
}

const saveAll = async () => {
  if (!post.value) return

  saving.value = true
  error.value = ''
  successMessage.value = ''

  try {
    const res = await updatePost(identifier.value, {
      name: name.value,
      description: description.value,
      slug: slug.value,
      status: status.value,
    })

    if (res?.post) {
      post.value = res.post
      slug.value = res.post.slug

      if (!isNumericIdentifier.value && post.value?.slug) {
        await router.replace(`/posts/${post.value.slug}`)
      }
    }

    await updateArticle(identifier.value, articleContent.value)

    successMessage.value = 'Post saved successfully!'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to save post'
    console.error('Failed to save:', e)
  } finally {
    saving.value = false
  }
}

const onTranslationCreated = (newPostId: number) => {
  useToast().toast({
    title: $t('editor.translationsManager.createSuccess'),
    toast: 'success',
  })
}

async function updatePostLanguage(lang: string) {
  if (!post.value) return
  try {
    await $fetch(`/api/posts/${identifier.value}`, {
      method: 'PUT',
      body: { language: lang },
    })
    if (post.value) post.value.language = lang
    useToast().toast({
      title: `Language changed to ${lang.toUpperCase()}`,
      toast: 'success',
    })
  } catch (e: any) {
    useToast().toast({
      title: 'Failed to update language',
      description: e?.data?.message || '',
      toast: 'danger',
    })
  }
}

// Open the delete-post confirmation dialog
const openDeleteDialog = () => {
  confirmDeleteDialogOpen.value = true
}

// Perform the deletion after the user confirms
const performDeletePost = async () => {
  if (!post.value) return
  deletePostLoading.value = true
  error.value = ''

  try {
    await deletePostApi(identifier.value)
    confirmDeleteDialogOpen.value = false
    router.push('/posts')
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to delete post'
    console.error('Failed to delete post:', e)
  } finally {
    deletePostLoading.value = false
  }
} 

const exportPost = async () => {
  if (!post.value) return

  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      post: {
        ...post.value,
        article: articleContent.value ?? post.value.article ?? {},
      },
    }

    const json = JSON.stringify(exportData, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const filenameSlug = slug.value || post.value.slug || `post-${post.value.id || 'export'}`
    a.download = `${filenameSlug}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    successMessage.value = 'Post exported'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Failed to export post'
    console.error('Failed to export post:', e)
  }
}

const exportPostZipFile = async () => {
  if (!post.value) return
  exportingZip.value = true
  try {
    const blobRes = await exportPostZip(identifier.value)
    const url = URL.createObjectURL(blobRes)
    const a = document.createElement('a')
    a.href = url
    const filenameSlug = slug.value || post.value.slug || `post-${post.value.id || 'export'}`
    a.download = `${filenameSlug}.zip`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    successMessage.value = 'Post exported (ZIP)'
    setTimeout(() => (successMessage.value = ''), 3000)
  } catch (e: any) {
    error.value = e?.message || 'Failed to export ZIP'
    console.error('Failed to export ZIP:', e)
  } finally {
    exportingZip.value = false
  }
}

watch(name, (newName) => {
  if (!slug.value || slug.value === post.value?.slug) {
    slug.value = deriveSlugFromName(newName)
  }
})

const onEditorUpdate = (json: object) => {
  articleContent.value = json
  if (aiStatus.value === 'streaming') return
  debouncedSaveArticle(json)
}

const onCoverFileChange = async (event: Event) => {
  error.value = ''
  successMessage.value = ''
  try {
    await handleFileChange(event)
    if (post.value?.image?.src) {
      successMessage.value = 'Cover image uploaded successfully'
      setTimeout(() => (successMessage.value = ''), 3000)
    }
  } catch (e: any) {
    error.value = e?.message || 'Failed to upload cover image'
  }
}

const openDeleteCoverDialog = () => {
  if (!post.value?.image?.src) return
  confirmDeleteCoverOpen.value = true
}

const confirmDeleteCover = async () => {
  if (!post.value?.image?.src) {
    confirmDeleteCoverOpen.value = false
    return
  }

  deleteCoverLoading.value = true
  error.value = ''
  try {
    await deleteCoverImage()
    successMessage.value = 'Cover image removed'
    setTimeout(() => (successMessage.value = ''), 3000)
    confirmDeleteCoverOpen.value = false
  } catch (e: any) {
    error.value = e?.message || 'Failed to remove cover image'
    console.error('Failed to remove cover image:', e)
  } finally {
    deleteCoverLoading.value = false
  }
} 

onMounted(() => {
  fetchPost()
})
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