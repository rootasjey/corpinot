<template>
  <div>
    <!-- Cards grid -->
    <div v-if="viewMode !== 'list'" class="mx-auto columns-1 sm:columns-2 lg:columns-3">
      <PostCard
        v-for="(post, i) in posts"
        :key="post.slug"
        :post="post"
        :idx="i"
        :link="linkForPost(post)"
        :isAdmin="isAdmin"
        :selectionMode="selectionMode"
        :selectedSlugs="selectedSlugs"
        :duplicatingPosts="duplicatingPosts"
        :menuItemsForPost="menuItemsForPost"
        :entered="entered"
        @toggle-selected="$emit('toggle-selected', $event)"
        @long-press-start="$emit('long-press-start', $event)"
        @long-press-cancel="$emit('long-press-cancel')"
        @post-click="(e, p) => $emit('post-click', e, p)"
      />
    </div>

    <!-- List view -->
    <div v-else class="mx-auto space-y-4">
      <PostRow
        v-for="(post, i) in posts"
        :key="post.slug"
        :post="post"
        :idx="i"
        :link="linkForPost(post)"
        :isAdmin="isAdmin"
        :selectionMode="selectionMode"
        :selectedSlugs="selectedSlugs"
        :duplicatingPosts="duplicatingPosts"
        :menuItemsForPost="menuItemsForPost"
        :entered="entered"
        @toggle-selected="$emit('toggle-selected', $event)"
        @long-press-start="$emit('long-press-start', $event)"
        @long-press-cancel="$emit('long-press-cancel')"
        @post-click="(e, p) => $emit('post-click', e, p)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
import PostCard from '~/components/PostCard.vue'
import PostRow from '~/components/PostRow.vue'

const props = defineProps<{
  posts: Post[]
  viewMode: 'cards' | 'list'
  isAdmin: boolean
  selectionMode: boolean
  selectedSlugs: Set<string>
  duplicatingPosts: Set<string | number>
  coverUploadingPosts?: Set<string | number>
  menuItemsForPost: (p: Post) => any
  linkForPost: (p: Post) => string
  entered: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-selected', slug: string): void
  (e: 'long-press-start', slug: string): void
  (e: 'long-press-cancel'): void
  (e: 'post-click', eev: MouseEvent, post: Post): void
}>()
</script>

<style scoped>
.post-list-row {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 0.5rem;
}
.post-list-thumb {
  width: 144px;
  height: 96px;
  object-fit: cover;
  flex-shrink: 0;
  border-radius: 0.375rem;
  overflow: hidden;
}
.post-list-row a:focus {
  outline: 2px solid rgba(59,130,246,0.12);
  outline-offset: 2px;
}
</style>
