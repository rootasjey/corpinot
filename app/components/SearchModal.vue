<template>
  <NDialog v-model:open="isOpen" :closeOnEsc="true">
    <NDialogContent class="max-w-3xl w-full">
      <NDialogHeader>
        <NDialogTitle>Search</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        <div class="flex flex-col gap-4 min-h-[340px]">
          <div>
            <NInput
              id="global-search-input"
              v-model="query"
              placeholder="Search posts and tags — Press Esc to close"
              input="outline-blue"
              autofocus
              @keydown.up.stop.prevent="moveUp"
              @keydown.down.stop.prevent="moveDown"
              @keydown.enter.stop.prevent="selectHighlighted"
              @keydown.esc.stop.prevent="close"
              @keydown.j.stop.prevent="moveDown"
              @keydown.k.stop.prevent="moveUp"
              class="shadow-none ring-none w-full"
            />
          </div>

          <div class="relative flex-1 min-h-[220px] max-h-[60vh]">
            <div v-if="pending && showSkeleton" class="absolute inset-0 flex flex-col gap-3 p-1 overflow-hidden min-h-full">
              <div v-for="i in 6" :key="i" class="h-12 bg-gray-200 dark:bg-gray-800 rounded-md animate-pulse"></div>
            </div>

            <div
              v-else-if="!results.length"
              class="absolute inset-0 flex items-start justify-center px-3 py-4 text-sm text-gray-600 dark:text-gray-400"
            >
              No results
            </div>

            <ul
              v-else
              class="absolute inset-0 overflow-y-auto space-y-2 pr-1 pb-2"
            >
              <li
                v-for="(r, idx) in results"
                :key="`${r.type}-${r.id}`"
                :class="['p-3 rounded-lg cursor-pointer flex items-start gap-3 transition-colors', highlightedIndex === idx ? 'bg-gray-100 dark:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-900']"
                @click="select(r)"
                @mouseenter="highlightedIndex = idx"
              >
                <div class="flex-auto min-w-0">
                  <div class="text-sm font-semibold break-words leading-tight">{{ r.name }}</div>
                  <div v-if="r.type === 'post'" class="text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2">{{ r.description }}</div>
                  <div v-else-if="r.type === 'author'" class="text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2">{{ r.biography }}</div>
                  <div v-else-if="r.type === 'tag'" class="text-xs text-gray-500 dark:text-gray-400">Tag</div>
                </div>
                <div class="text-xs text-gray-400">{{ r.type.toUpperCase() }}</div>
              </li>
            </ul>
          </div>
        </div>
      </NDialogDescription>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDebounceFn } from '@vueuse/core'
import useGlobalSearch from '~/composables/useGlobalSearch'
import { onMounted, onBeforeUnmount } from 'vue'

const { isOpen, close: closeModal, initialQuery } = useGlobalSearch()
const router = useRouter()

const query = ref(initialQuery.value || '')
const results = ref<Array<any>>([])
const pending = ref(false)
const highlightedIndex = ref(-1)
const showSkeleton = ref(false)
let skeletonTimer: ReturnType<typeof setTimeout> | null = null

watch(isOpen, async (val) => {
  if (val) {
    // set query to initialQuery
    query.value = initialQuery.value || ''
    await nextTick()
    // focus input
    const el = document.getElementById('global-search-input') as HTMLInputElement | null
    el?.focus()
    // auto fetch if query exists
    if (query.value.trim()) fetchResults()
  } else {
    query.value = ''
    results.value = []
    highlightedIndex.value = -1
    clearSkeletonTimer()
  }
})

function handleGlobalKey(e: KeyboardEvent) {
  if (!isOpen.value) return
  if (e.key === 'ArrowDown') { e.preventDefault(); moveDown() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveUp() }
  else if (e.key === 'Enter') { e.preventDefault(); selectHighlighted() }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKey)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKey)
})

function startSkeletonTimer() {
  clearSkeletonTimer()
  skeletonTimer = setTimeout(() => {
    showSkeleton.value = true
  }, 180)
}

function clearSkeletonTimer() {
  if (skeletonTimer) {
    clearTimeout(skeletonTimer)
    skeletonTimer = null
  }
  showSkeleton.value = false
}

const fetchResults = useDebounceFn(async () => {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    pending.value = false
    clearSkeletonTimer()
    return
  }
  pending.value = true
  startSkeletonTimer()
  try {
    const res = await $fetch('/api/search', { params: { q } }) as any
    const merged = [] as any[] // posts first, then authors, then tags
    if (res.posts) merged.push(...res.posts)
    if (res.authors) merged.push(...res.authors)
    if (res.tags) merged.push(...res.tags)
    results.value = merged
    highlightedIndex.value = results.value.length ? 0 : -1
  } catch (e) {
    results.value = []
  } finally {
    pending.value = false
    clearSkeletonTimer()
  }
}, 300)

watch(query, () => fetchResults())

function close() {
  closeModal()
}

function moveDown() {
  if (!results.value.length) return
  highlightedIndex.value = (highlightedIndex.value + 1) % results.value.length
}

function moveUp() {
  if (!results.value.length) return
  highlightedIndex.value = (highlightedIndex.value - 1 + results.value.length) % results.value.length
}

function selectHighlighted() {
  const idx = highlightedIndex.value
  if (idx < 0 || idx >= results.value.length) return
  select(results.value[idx])
}

async function select(item: any) {
  closeModal()
  if (item.type === 'post') {
    await router.push(`/posts/${item.slug}`)
  } else if (item.type === 'tag') {
    await router.push({ path: '/tags', query: { tag: item.name } })
  } else if (item.type === 'author') {
    await router.push({ path: `/authors/${item.id}` })
  }
}
</script>
