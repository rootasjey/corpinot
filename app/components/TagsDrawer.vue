<template>
  <NDrawer v-model:open="isDrawerOpen">
    <template #header>
      <div class="flex items-center justify-between px-4 py-3">
        <div class="text-sm font-semibold">{{ $t('components.tagsDrawer.title') }}</div>
        <div class="flex items-center gap-2">
          <NButton size="sm" btn="ghost-gray" @click="$emit('update:open', false)">{{ $t('common.close') }}</NButton>
        </div>
      </div>
    </template>

    <template #body>
      <div class="p-4">
        <div class="flex items-center gap-3 mb-4">
          <input
            ref="searchInputRef"
            v-model="localSearch"
            @input="emitUpdateSearch"
            type="search"
            :placeholder="$t('pages.tags.searchPlaceholder')"
            class="w-full px-4 py-2 rounded-xl bg-white/70 dark:bg-gray-800/60 placeholder-gray-400 outline-none"
          />

          <div v-if="isAdmin">
            <NButton btn="outline-gray" size="xs" rounded="2" leading="i-ph-plus-bold" @click="onNew">{{ $t('common.new') }}</NButton>
          </div>
        </div>

        <div class="mb-4">
          <button
            @click="select(null)"
            :class="['px-3 py-2 rounded-full text-sm font-semibold mr-2 mb-2', selectedTag === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100']"
          >
            {{ $t('common.all') }}
          </button>
        </div>

        <ul class="space-y-3 pb-24 max-h-[60vh] overflow-y-auto">
          <li v-for="tag in filteredTags" :key="tag.id">
            <div class="flex items-center justify-between p-1 rounded-xl">
              <button
                @click="select(tag.name)"
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
                    <div class="text-xs text-gray-500 dark:text-gray-400">{{ tag.category || $t('pages.tags.general') }}</div>
                    <div v-if="tag.description" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ tag.description }}</div>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <div class="text-xs text-gray-600 dark:text-gray-300 font-semibold">{{ tagCounts[tag.name] || 0 }}</div>
                </div>
              </button>

              <div v-if="isAdmin" class="ml-2">
                <NDropdownMenu :items="dropdownItems(tag)">
                  <NButton icon btn="ghost-gray" size="xs" @click.stop.prevent>
                    <NIcon name="i-ph-dots-three-vertical" />
                  </NButton>
                </NDropdownMenu>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import type { ApiTag } from '~~/shared/types/tags'
import type { PropType } from 'vue'

const { $t } = useI18n()
const props = defineProps({
  open: { type: Boolean, required: true },
  tags: { type: Array as PropType<ApiTag[]>, default: () => [] },
  search: { type: String, default: '' },
  selectedTag: { type: [String, Object] as PropType<string | null>, default: null },
  tagCounts: { type: Object as PropType<Record<string, number>>, default: () => ({}) },
  isAdmin: { type: Boolean, default: false },
})

const emits = defineEmits(['update:open', 'update:search', 'select', 'new', 'edit', 'delete'])

const localSearch = ref(props.search)
watch(() => props.search, (v) => (localSearch.value = v))

function emitUpdateSearch() {
  emits('update:search', localSearch.value)
}

// Local open computed so we don't write to props directly (v-model on a prop is not writable)
const isDrawerOpen = computed({
  get: () => props.open,
  set: (v: boolean) => emits('update:open', v),
})

const searchInputRef = ref<HTMLInputElement | null>(null)
watch(() => isDrawerOpen.value, (v) => {
  if (v) {
    nextTick(() => searchInputRef.value?.focus())
  }
})

const filteredTags = computed(() => {
  const q = localSearch.value.trim().toLowerCase()
  if (!q) return props.tags
  return props.tags.filter((t) => t.name.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q))
})

function colorForTag(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 80% 85%)`
}

function select(name: string | null) {
  emits('select', name)
  emits('update:open', false)
}

function onNew() {
  emits('new')
}

function dropdownItems(tag: ApiTag) {
  return [
    { label: $t('common.edit'), onSelect: () => emits('edit', tag), leading: 'i-ph-pencil' },
    { label: $t('common.delete'), onSelect: () => emits('delete', tag), leading: 'i-ph-trash', color: 'danger' },
  ]
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
</style>
