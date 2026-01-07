<template>
  <div class="py-12 md:py-20">
    <div class="container mx-auto px-4 md:px-8">
      <div class="max-w-4xl mx-auto text-center">
        <div class="font-600 text-md text-gray-400 flex items-center justify-center gap-3 mb-6">
          <time>{{ dateLabel }}</time>
          <span>—</span>
          <span>{{ readingTime }}</span>
        </div>

        <textarea
          ref="nameInput"
          v-model="nameProxy"
          rows="1"
          class="w-full resize-none overflow-hidden text-4xl md:text-5xl lg:text-4xl font-serif font-700 text-center leading-tight bg-transparent outline-none focus:outline-none focus:ring-0"
          placeholder="Untitled"
          @input="autoResize"
        />

        <NInput
          v-model="descriptionProxy"
          type="textarea"
          input="~"
          placeholder="Write a short description…"
          class="mt-4 max-w-3xl mx-auto text-center font-body font-600 color-gray-500 text-base md:text-lg leading-relaxed description-input"
          :rows="-1"
          ref="descriptionInput"
          @input="autoResizeDescription"
          @focus="autoResizeDescription"
        />

        <div class="mt-4 max-w-3xl mx-auto">
          <div class="relative mt-3">
            <div class="flex justify-center items-center gap-2 flex-wrap">
              <span v-for="tag in localTags" :key="tag.id" class="inline-flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-black dark:border rounded-full">
                <span class="uppercase font-semibold text-xs">{{ tag.name }}</span>
                <button aria-label="Remove tag" @click="removeTag(tag.id)" :disabled="isAssigningTags" class="text-xs opacity-70 hover:opacity-100">✕</button>
              </span>

              <div v-if="editingTagActive" class="inline-flex items-center gap-2 px-3 py-1 text-sm dark:bg-black rounded-full">
                <input
                  ref="editingInputRef"
                  v-model="editingTagName"
                  @keydown.enter.prevent="addTagByName(editingTagName)"
                  @keydown.esc.prevent="cancelNewTag"
                  @blur="editingTagName ? addTagByName(editingTagName) : cancelNewTag"
                  class="bg-transparent outline-none border px-4 py-1 rounded-full text-sm"
                  placeholder="Tag name"
                />
                <button @click="cancelNewTag" class="text-xs opacity-70 hover:opacity-100">✕</button>
              </div>
              <div v-else>
                <NButton :icon="localTags.length > 0" size="xs" btn="ghost-gray" class="border b-dashed" @click="startNewTag" aria-label="Add tag">
                  <NIcon name="i-ph-plus" />
                  <span v-if="localTags.length === 0">Add tag</span>
                </NButton>
              </div>
            </div>
            <ul v-if="filteredTagSuggestions.length && editingTagActive && editingTagName" class="absolute z-20 w-full mt-1 bg-background border border-border rounded-md max-h-40 overflow-auto">
              <li v-for="s in filteredTagSuggestions" :key="s.id">
                <button class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-black/10" @click.prevent="addTag(s)">{{ s.name }}</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted } from 'vue'
import { useTagStore } from '~/stores/tags'
import type { ApiTag } from '~~/shared/types/tags'

interface Props {
  name: string
  description: string
  readingTime: string
  dateLabel: string
  postId?: number | null
  tags: ApiTag[]
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:tags': [value: ApiTag[]]
}>()

const tagStore = useTagStore()

const nameProxy = computed({
  get: () => props.name,
  set: (val: string) => emit('update:name', val),
})

const descriptionProxy = computed({
  get: () => props.description,
  set: (val: string) => emit('update:description', val),
})

const localTags = ref<ApiTag[]>(props.tags || [])
watch(() => props.tags, (tags) => { localTags.value = tags || [] })

const nameInput = ref<HTMLTextAreaElement | null>(null)
const descriptionInput = ref<any | null>(null)
const editingTagActive = ref(false)
const editingTagName = ref('')
const editingInputRef = ref<HTMLInputElement | null>(null)
const isAssigningTags = ref(false)

const filteredTagSuggestions = computed(() => {
  const query = (editingTagName.value || '').trim()
  if (!query) return tagStore.allTags.filter(t => !localTags.value.some(pt => pt.id === t.id))
  return tagStore.searchTags(query).filter(t => !localTags.value.some(pt => pt.id === t.id))
})

const addTagByName = async (name: string) => {
  if (!props.postId || !name) return
  isAssigningTags.value = true
  try {
    let tag = tagStore.findTagByName(name)
    if (!tag) {
      const created = await tagStore.createTag(name)
      if (!created) throw new Error('Failed to create tag')
      tag = created
    }
    const tagIds = Array.from(new Set([...localTags.value.map(t => t.id), tag.id]))
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
    editingTagActive.value = false
    editingTagName.value = ''
  } finally {
    isAssigningTags.value = false
  }
}

const addTag = async (tag: ApiTag | undefined | null) => {
  if (!props.postId || !tag) return
  isAssigningTags.value = true
  try {
    const tagIds = Array.from(new Set([...localTags.value.map(t => t.id), tag.id]))
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
  } finally {
    isAssigningTags.value = false
    editingTagActive.value = false
    editingTagName.value = ''
  }
}

const removeTag = async (tagId: number) => {
  if (!props.postId) return
  isAssigningTags.value = true
  try {
    const tagIds = localTags.value.filter(t => t.id !== tagId).map(t => t.id)
    const assigned = await tagStore.assignPostTags(props.postId as number, tagIds)
    localTags.value = assigned
    emit('update:tags', assigned)
  } finally {
    isAssigningTags.value = false
  }
}

const startNewTag = async () => {
  editingTagActive.value = true
  editingTagName.value = ''
  await nextTick()
  editingInputRef.value?.focus()
}

const cancelNewTag = () => {
  editingTagActive.value = false
  editingTagName.value = ''
}

const autoResize = (evt?: Event | null) => {
  let el: HTMLTextAreaElement | null = null
  if (evt) el = evt.target as HTMLTextAreaElement
  else el = nameInput.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

const autoResizeDescription = (evt?: Event | null) => {
  let el: HTMLTextAreaElement | null = null
  if (evt) el = evt.target as HTMLTextAreaElement
  if (!el && descriptionInput.value) {
    const wrapperEl: HTMLElement | null = (descriptionInput.value as any)?.$el ?? descriptionInput.value
    el = wrapperEl?.querySelector('textarea') ?? null
  }
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

watch(() => props.description, async () => {
  await nextTick()
  autoResizeDescription()
})

watch(() => props.name, async () => {
  await nextTick()
  autoResize()
})

onMounted(async () => {
  await nextTick()
  autoResize()
  autoResizeDescription()
})
</script>

<style scoped>
.description-input textarea {
  overflow: hidden;
  resize: none;
}
</style>
