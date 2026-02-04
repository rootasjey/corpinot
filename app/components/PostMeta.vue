<template>
  <div>
    <div v-if="duplicating" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />

    <div v-if="post.status && post.status !== 'published'" class="flex items-center gap-2 mb-2">
      <NBadge v-if="post.status === 'draft'" badge="soft dark:solid" color="gray">Draft</NBadge>
      <NBadge v-if="post.status === 'archived'" badge="soft" color="gray">Archived</NBadge>
      <NBadge v-if="duplicating" badge="soft" color="warning">Duplicating…</NBadge>
    </div>

    <h2 :class="titleClass">{{ post.name }}</h2>

    <p v-if="post.description" :class="descClass">{{ post.description }}</p>

    <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
      <NBadge v-for="tag in post.tags.slice(0,3)" :key="tag.id" size="xs" badge="soft-gray">{{ tag.name }}</NBadge>
    </div>

    <div class="flex items-center justify-between pt-4 border-t b-dashed border-border mt-4" v-if="showMeta">
      <div v-if="post.user" class="flex items-center gap-3">
        <NuxtImg v-if="post.user.avatar" :src="post.user.avatar" :alt="post.user.name || 'User'" class="w-8 h-8 rounded-full" />
        <span class="text-sm font-medium">{{ post.user.name }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <time>{{ post.formattedDate }}</time>
        <span>•</span>
        <span>{{ post.readingTime }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mt-2" v-else-if="layout === 'row'">
      <time>{{ post.formattedDate }}</time>
      <span>•</span>
      <span>{{ post.readingTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const props = defineProps<{
  post: Post
  layout?: 'card' | 'row'
  duplicating?: boolean
  showMeta?: boolean
}>()

const titleClass = computed(() => props.layout === 'row' ? 'text-lg font-semibold line-clamp-2 mb-1' : 'text-2xl font-bold mb-3 line-clamp-2')
const descClass = computed(() => props.layout === 'row' ? 'text-slate-500 dark:text-slate-400 mb-2 line-clamp-2' : 'text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1')
const layout = props.layout ?? 'card'
const showMeta = props.showMeta ?? (layout === 'card')
</script>
