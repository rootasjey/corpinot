<template>
  <NDialog v-model:open="open">
    <NDialogContent class="max-w-xl">
      <NDialogHeader>
        <NDialogTitle>Edit post</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        Edit basic fields for the post — title, description, slug, and status.
      </NDialogDescription>

      <div class="mt-4 space-y-4">
        <div>
          <label class="text-sm font-medium mb-1 block">Title</label>
          <NInput v-model="localName" input="outline" class="w-full" :maxlength="255" autofocus />
          <p v-if="nameError" class="text-sm text-danger mt-1">{{ nameError }}</p>
        </div>

        <div>
          <label class="text-sm font-medium mb-1 block">Description</label>
          <NInput v-model="localDescription" input="outline" type="textarea" :rows="4" class="w-full" :maxlength="1000" />
          <p v-if="descriptionError" class="text-sm text-danger mt-1">{{ descriptionError }}</p>
        </div>

        <div>
          <label class="text-sm font-medium mb-1 block">Slug</label>
          <!-- Reuse EditSlugDialog UI for slug input and status messaging -- we embed it as a controlled input rather than opening its own dialog -->
          <div class="flex items-center gap-3">
            <NInput v-model="slugCandidateLocal" input="outline" class="w-full" :maxlength="255" />
            <NButton size="sm" btn="ghost-gray" @click="resetSlug">Reset</NButton>
          </div>

          <div class="text-sm min-h-[1rem] mt-2">
            <span v-if="slugCheckLoading" class="text-foreground/70"><NIcon name="i-ph-spinner animate-spin" /> Checking slug availability…</span>
            <span v-else-if="slugError" class="text-danger">{{ slugError }}</span>
            <span v-else-if="slugTaken" class="text-danger">{{ slugCheckMessage }}</span>
            <span v-else-if="slugCheckMessage" class="text-success"><NIcon name="i-ph-check-circle" /> {{ slugCheckMessage }}</span>
            <span v-else class="invisible">placeholder</span>
          </div>
        </div>

        <div>
          <label class="text-sm font-medium mb-1 block">Status</label>
          <NSelect 
            v-model="localStatus" 
            :items="statusOptions" 
            item-key="label"
            value-key="label"
          />
        </div>

        <div v-if="serverError" class="text-sm text-danger">{{ serverError }}</div>
      </div>

      <NDialogFooter class="flex items-center gap-2 justify-end mt-4">
        <NButton btn="ghost-gray" size="sm" @click="onCancel">Cancel</NButton>
        <NButton btn="soft-blue" size="sm" :disabled="disableSave || saving" @click="onSave">
          <NIcon v-if="saving" name="i-lucide-loader" class="animate-spin" />
          <span v-else>Save</span>
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'
import { useSlugValidation } from '~/composables/useSlugValidation'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  post: { type: Object as () => Post | null, required: false },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

type PostStatusItem = {
  label: string
  value: Post['status']
}

const localName = ref('')
const localDescription = ref('')
const localStatus = ref<PostStatusItem>({ label: 'Draft', value: 'draft' })
const statusOptions: PostStatusItem[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
]
const slugCandidateLocal = ref('')
const serverError = ref('')
const nameError = ref('')
const descriptionError = ref('')
const slugError = ref('')
const saving = ref(false)

const { updatePost } = usePostsApi()

// Slug validation composable (uses /api/posts/slug/check)
const slugValidation = useSlugValidation({
  currentSlug: () => props.post?.slug,
  postId: () => props.post?.id,
})

const { slugCandidate, slugCheckLoading, slugTaken, slugCheckMessage, setSlugCandidate, reset: resetSlugCheck } = slugValidation

watch(
  () => props.post,
  (p) => {
    if (!p) return
    localName.value = p.name || ''
    localDescription.value = p.description || ''
    localStatus.value = statusOptions.find(option => option.value === (p.status || 'draft')) || { label: 'Draft', value: 'draft' }
    slugCandidateLocal.value = p.slug || ''
    setSlugCandidate(p.slug || '')
    serverError.value = ''
    nameError.value = ''
    descriptionError.value = ''
    slugError.value = ''
  },
  { immediate: true }
)

// Keep slugCandidate in sync with the local input
watch(slugCandidateLocal, (v) => {
  setSlugCandidate(v || '')
})

function resetSlug() {
  slugCandidateLocal.value = props.post?.slug || ''
  setSlugCandidate(slugCandidateLocal.value)
}

const disableSave = computed(() => {
  if (!localName.value || localName.value.trim().length === 0) return true
  if (slugCheckLoading.value) return true
  if (slugTaken.value) return true
  return false
})

async function onSave() {
  if (!props.post) return
  nameError.value = ''
  descriptionError.value = ''
  slugError.value = ''
  serverError.value = ''

  if (!localName.value || localName.value.trim().length === 0) {
    nameError.value = 'Title is required.'
    return
  }
  if (localDescription.value && localDescription.value.length > 1000) {
    descriptionError.value = 'Description is too long.'
    return
  }

  saving.value = true
  try {
    const payload: any = {
      name: localName.value.trim(),
      description: localDescription.value.trim() || undefined,
      status: localStatus.value.value,
    }
    const normalizedSlug = slugCandidate.value
    if (normalizedSlug && normalizedSlug !== props.post.slug) payload.slug = normalizedSlug

    const res = await updatePost(props.post.slug || (props.post.id as number), payload)
    if (res?.post) {
      emit('saved', res.post)
      open.value = false
    }
  } catch (err: any) {
    // Handle slug conflict
    if (err?.status === 409 || (err?.data && err.data.code === 'slug_conflict')) {
      slugError.value = 'That slug is already in use.'
    } else {
      serverError.value = err?.data?.message || String(err)
    }
  } finally {
    saving.value = false
  }
}

function onCancel() {
  open.value = false
  serverError.value = ''
}
</script>

<style scoped>
/* small tweaks for dialog layout */
</style>
