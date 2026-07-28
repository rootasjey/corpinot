<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <span class="text-xs text-gray-500 dark:text-gray-400">
        {{ $t('editor.translationsManager.currentLanguage', { language: currentLanguage }) }}
      </span>
      <NButton v-if="!showCreateForm" btn="outline-gray" size="xs" @click="showCreateForm = true" :disabled="creating">
        {{ $t('editor.translationsManager.createTranslation') }}
      </NButton>
    </div>

    <div v-if="loading" class="text-sm text-gray-500 dark:text-gray-400">{{ $t('common.loading') }}</div>

    <div v-else-if="error" class="text-sm text-red-500">{{ error }}</div>

    <div v-else-if="!translations.length && !showCreateForm" class="text-sm text-gray-500 dark:text-gray-400">
      {{ $t('editor.translationsManager.noTranslations') }}
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="t in translations"
        :key="t.id"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
      >
        <div class="flex items-center gap-3 min-w-0">
          <span class="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 shrink-0">{{ t.language }}</span>
          <div class="min-w-0">
            <div class="text-sm font-medium truncate">{{ t.name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              {{ t.authorName }}
              <span v-if="t.status !== 'published'" class="ml-2 text-yellow-600 dark:text-yellow-400">({{ $t('pages.posts.' + t.status) }})</span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <NButton btn="ghost-gray" size="xs" :to="`/posts/edit/${t.id}`" leading="i-ph-pencil">
            {{ $t('editor.translationsManager.edit') }}
          </NButton>
          <NButton btn="ghost-gray" size="xs" leading="i-ph-link-break" @click="unlinkTranslation(t.id)" :disabled="unlinking">
            {{ $t('editor.translationsManager.unlink') }}
          </NButton>
        </div>
      </div>
    </div>

    <!-- Inline create form -->
    <div v-if="showCreateForm" class="mt-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('editor.translationsManager.createNew', { language: targetLanguageLabel }) }}
      </p>
      <div>
        <select
          v-model="targetLanguage"
          class="w-full px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm"
        >
          <option v-for="opt in availableLanguages" :key="opt.value" :value="opt.value" :disabled="opt.disabled">
            {{ opt.label }}
          </option>
        </select>
      </div>
      <div class="flex justify-end gap-2">
        <NButton btn="ghost-gray" size="xs" @click="showCreateForm = false">{{ $t('common.cancel') }}</NButton>
        <NButton btn="solid-blue" size="xs" @click="createTranslation" :disabled="!targetLanguage || creating">
          <span v-if="!creating">{{ $t('editor.translationsManager.createTranslation') }}</span>
          <span v-else>{{ $t('editor.translationsManager.creating') }}</span>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

const props = defineProps<{
  postId: number
  currentLanguage: string
}>()

const emit = defineEmits<{
  (e: 'translationCreated', postId: number): void
}>()

const router = useRouter()
const translations = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const unlinking = ref(false)
const showCreateForm = ref(false)
const targetLanguage = ref('')

const languageOptions = [
  { value: 'en', label: $t('pages.postEditor.en') },
  { value: 'fr', label: $t('pages.postEditor.fr') },
  { value: 'es', label: $t('pages.postEditor.es') },
  { value: 'de', label: $t('pages.postEditor.de') },
  { value: 'it', label: $t('pages.postEditor.it') },
]

const availableLanguages = computed(() => {
  const existing = translations.value.map(t => t.language)
  return languageOptions
    .filter(opt => opt.value !== props.currentLanguage)
    .map(opt => ({
      ...opt,
      disabled: existing.includes(opt.value),
    }))
})

const targetLanguageLabel = computed(() => {
  const opt = availableLanguages.value.find(o => o.value === targetLanguage.value)
  return opt?.label || ''
})

async function fetchTranslations() {
  loading.value = true
  error.value = ''
  try {
    const data = await $fetch(`/api/posts/${props.postId}/translations`)
    translations.value = data || []
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to load translations'
  } finally {
    loading.value = false
  }
}

async function createTranslation() {
  if (!targetLanguage.value) return
  creating.value = true
  try {
    const newPost = await $fetch(`/api/posts/${props.postId}/translations`, {
      method: 'POST',
      body: { language: targetLanguage.value },
    })
    showCreateForm.value = false
    emit('translationCreated', newPost.id)
    await router.push(`/posts/edit/${newPost.id}`)
  } catch (e: any) {
    useToast().toast({
      title: $t('editor.translationsManager.createFailed'),
      description: e?.data?.message || '',
      toast: 'danger',
    })
  } finally {
    creating.value = false
  }
}

async function unlinkTranslation(targetId: number) {
  unlinking.value = true
  try {
    await $fetch(`/api/posts/${props.postId}/translations/unlink`, {
      method: 'POST',
      body: { postId: targetId },
    })
    translations.value = translations.value.filter(t => t.id !== targetId)
  } catch (e: any) {
    useToast().toast({
      title: $t('editor.translationsManager.unlinkFailed'),
      description: e?.data?.message || '',
      toast: 'danger',
    })
  } finally {
    unlinking.value = false
  }
}

onMounted(fetchTranslations)
</script>
