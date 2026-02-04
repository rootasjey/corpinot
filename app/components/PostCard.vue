<template>
  <div
    :class="[
      'group relative inline-block w-full mb-6 break-inside-avoid transition-all duration-500 ease-out will-change-transform',
      { 'opacity-0 translate-y-3': !entered, 'opacity-100 translate-y-0': entered }
    ]"
    :style="{ transitionDelay: `${idx * 35}ms` }"
    @pointerdown="() => $emit('long-press-start', post.slug)"
    @pointerup="$emit('long-press-cancel')"
    @pointercancel="$emit('long-press-cancel')"
    @mouseleave="$emit('long-press-cancel')"
  >
    <ClientOnly>
      <div v-if="isAdmin && selectionMode" class="absolute right-12 top-5 z-2">
        <NCheckbox :model-value="selectedSlugs.has(post.slug)" @update:model-value="$emit('toggle-selected', post.slug)" />
      </div>
    </ClientOnly>

    <NLink
      :to="link"
      @click="(e: MouseEvent) => $emit('post-click', e, post)"
      :class="[
        'group block bg-background border border-border rounded-lg overflow-hidden hover:shadow-xl hover:scale-101 transition-all duration-300 transform active:scale-99 active:shadow-none',
        { 'scale-90': duplicatingPosts.has(post.slug), 'pointer-events-none opacity-70': duplicatingPosts.has(post.slug) }
      ]"
      :aria-busy="duplicatingPosts.has(post.slug)"
    >
      <article class="h-full flex flex-col items-stretch relative">
        <div v-if="post.image?.src" class="w-full overflow-hidden flex-shrink-0">
          <PostImage :src="post.image.src" :alt="post.image.alt || post.name" class="w-full h-full object-cover aspect-[16/10] transition-transform duration-500 group-hover:scale-110" />
        </div>

        <div class="flex-1 p-6 flex flex-col">
          <PostMeta :post="post" :duplicating="duplicatingPosts.has(post.slug)" />
        </div>
      </article>
    </NLink>

    <ClientOnly>
      <div v-if="isAdmin" class="absolute right-3 top-3 z-10">
        <PostMenu :items="menuItemsForPost(post)" :disabled="duplicatingPosts.has(post.slug)" />
      </div>
    </ClientOnly>

    <div v-if="duplicatingPosts.has(post.slug)" class="absolute inset-0 pointer-events-auto duplicate-overlay z-0" aria-hidden="true" />
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import PostMeta from '~/components/PostMeta.vue'
import PostMenu from '~/components/PostMenu.vue'

const props = defineProps<{
  post: Post
  idx: number
  link: string
  isAdmin: boolean
  selectionMode: boolean
  selectedSlugs: Set<string>
  duplicatingPosts: Set<string | number>
  menuItemsForPost: (p: Post) => any
  entered: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-selected', slug: string): void
  (e: 'long-press-start', slug: string): void
  (e: 'long-press-cancel'): void
  (e: 'post-click', eev: MouseEvent, post: Post): void
}>()
</script>

