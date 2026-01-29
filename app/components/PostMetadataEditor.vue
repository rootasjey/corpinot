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
              <NBadge v-for="tag in localTags" :key="tag.id" badge="~" rounded="full" class="inline-flex items-center gap-2 px-3 py-1 text-black bg-gray-100 dark:bg-black dark:text-white dark:border hover:scale-105 active:scale-95 transition-transform cursor-pointer">
                <NLink :to="`/tags?tag=${tag.name}`" class="uppercase font-semibold text-xs">{{ tag.name }}</NLink>
                <NTooltip>
                  <template #content>
                    <span class="font-600 text-gray-300 dark:text-gray-600">Remove <strong class="text-white dark:text-black underline decoration-offset-4">{{ tag.name }}</strong> tag</span>
                  </template>
                  <button aria-label="Remove tag" @click="removeTag(tag.id)" :disabled="isAssigningTags" class="line-height-1 opacity-70 hover:opacity-100 hover:scale-105 active:scale-95 transition-transform">
                    <NIcon name="i-ph-x-bold" size="3" />
                  </button>
                </NTooltip>
              </NBadge>

              <NCombobox
                ref="tagCombobox"
                v-if="editingTagActive"
                v-model="selectedTag"
                :items="comboboxItems"
                by="id"
                value-key="id"
                label-key="name"
                v-model:open="comboboxOpen"
                :_combobox-input="{
                  placeholder: 'Search or create tag...',
                  modelValue: editingTagName,
                  'onUpdate:modelValue': (v: string) => editingTagName = v,
                  onKeydown: handleComboboxInputKeydown,
                  autofocus: true,
                }"
                :_combobox-empty="{
                  class: 'py-2',
                }"
                size="xs"
                class="inline-block min-w-48"
              >
                <template #trigger>
                  <span class="inline-flex items-center gap-2 px-3 py-1 text-sm dark:bg-black rounded-full cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900">
                    <span class="text-xs font-500">{{ selectedTag?.name || 'Add tag...' }}</span>
                  </span>
                </template>

                <template #label="{ item }">
                  <div class="flex items-center gap-2">
                    <NIcon v-if="item.id === -1" name="i-ph-plus-circle" class="text-xs" />
                    <span class="uppercase font-semibold text-xs">{{ item.name }}</span>
                  </div>
                </template>

                <template #empty>
                  <div class="px-2">
                    <div v-if="isCreateActionAvailable" class="flex items-center">
                      <NButton
                        size="xs"
                        btn="ghost-gray"
                        class="w-full justify-start text-left focus:outline-none focus:bg-gray-300 dark:focus:bg-gray-800 focus:ring-0 focus:border-none"
                        :class="{ 'bg-gray-200 dark:bg-gray-800': isCreateActionHighlighted }"
                        tabindex="0"
                        @keydown="handleCreateButtonKeydown"
                        @click="addTagByName(trimmedEditingTagName)"
                      >
                        <NIcon name="i-ph-plus-circle" class="mr-2" />
                        <span class="uppercase font-semibold text-xs">Create "{{ trimmedEditingTagName }}"</span>
                      </NButton>
                    </div>
                    <div v-else class="px-3 text-sm text-slate-500">This tag is already added.</div>
                  </div>
                </template>
              </NCombobox>

              <NTooltip v-else>
                <template #content>
                  <span class="font-600">Add tag</span>
                </template>
                <NButton :icon="localTags.length > 0" rounded="full" size="xs" btn="ghost-gray" 
                    class="border b-dashed hover:scale-110 active:scale-95 transition-transform" 
                    :class="{
                      'h-6 w-6': localTags.length > 0,
                    }"
                    @click="startNewTag" 
                    aria-label="Add tag">
                  <NIcon name="i-ph-plus-bold" />
                  <span v-if="localTags.length === 0">Add tag</span>
                </NButton>
              </NTooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch, onMounted, type ComponentPublicInstance } from 'vue'
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
const isAssigningTags = ref(false)
const selectedTag = ref<ApiTag | null>(null)
const comboboxOpen = ref(false)
const tagCombobox = ref<ComponentPublicInstance | null>(null)

const filteredTagSuggestions = computed(() => {
  const query = (editingTagName.value || '').trim()
  if (!query) return tagStore.allTags.filter(t => !localTags.value.some(pt => pt.id === t.id))
  return tagStore.searchTags(query).filter(t => !localTags.value.some(pt => pt.id === t.id))
})

const comboboxItems = computed(() => {
  const suggestions = filteredTagSuggestions.value
  const query = (editingTagName.value || '').trim()
  
  // If there's a query and no exact match, add "Create new" option only when suggestions exist
  if (query && !tagStore.findTagByName(query) && suggestions.length > 0) {
    return [
      ...suggestions,
      { id: -1, name: `Create "${query}"` }
    ]
  }
  
  return suggestions
})

const trimmedEditingTagName = computed(() => (editingTagName.value || '').trim())
const isCreateActionAvailable = computed(() => {
  const query = trimmedEditingTagName.value
  return !!query && !tagStore.findTagByName(query) && filteredTagSuggestions.value.length === 0
})

const isCreateActionHighlighted = ref(false)

const handleComboboxInputKeydown = (evt: KeyboardEvent) => {
  if (!isCreateActionAvailable.value) return

  if (evt.key === 'Enter') {
    evt.preventDefault()
    addTagByName(trimmedEditingTagName.value)
    return
  }

  if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
    evt.preventDefault()
    isCreateActionHighlighted.value = !isCreateActionHighlighted.value
  }
}

const handleCreateButtonKeydown = (evt: KeyboardEvent) => {
  if (!isCreateActionAvailable.value) return
  if (evt.key === 'ArrowDown' || evt.key === 'ArrowUp') {
    evt.preventDefault()
    isCreateActionHighlighted.value = false
    const rootEl = (evt.currentTarget as HTMLElement | null)?.closest('[data-slot="combobox"]')
    const inputEl = rootEl?.querySelector('input') as HTMLInputElement | null
    inputEl?.focus()
  }
}

watch(isCreateActionAvailable, (isAvailable) => {
  if (!isAvailable) {
    isCreateActionHighlighted.value = false
  }
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
    // Keep combobox active so users can add more tags quickly
    editingTagName.value = ''
    selectedTag.value = null
    isCreateActionHighlighted.value = false
    comboboxOpen.value = true
    await nextTick()
    const rootEl = (tagCombobox.value as any)?.$el ?? (tagCombobox.value as any)
    const inputEl = rootEl?.querySelector('input') as HTMLInputElement | null
    inputEl?.focus()
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
    // Keep combobox active to allow adding more tags
    editingTagName.value = ''
    selectedTag.value = null
    isCreateActionHighlighted.value = false
    comboboxOpen.value = true
    await nextTick()
    const rootEl = (tagCombobox.value as any)?.$el ?? (tagCombobox.value as any)
    const inputEl = rootEl?.querySelector('input') as HTMLInputElement | null
    inputEl?.focus()
  } finally {
    isAssigningTags.value = false
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
  selectedTag.value = null
  // Ensure tags are loaded so the create option shows even when there are no items yet
  await tagStore.initialize()
  comboboxOpen.value = true
  await nextTick()
}

const cancelNewTag = () => {
  editingTagActive.value = false
  editingTagName.value = ''
  selectedTag.value = null
  comboboxOpen.value = false
}

// Watch for tag selection from combobox
watch(selectedTag, async (tag) => {
  if (!tag) return
  
  if (tag.id === -1) {
    // Create new tag from the typed name
    const query = editingTagName.value.replace(/^Create "/, '').replace(/"$/, '')
    if (query) {
      await addTagByName(query)
    }
  } else {
    // Add existing tag
    await addTag(tag)
  }
})

// Watch for combobox close without selection
watch(comboboxOpen, (isOpen) => {
  if (!isOpen && !selectedTag.value && editingTagActive.value) {
    // Combobox closed without selection - just cancel
    cancelNewTag()
  }
})

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
