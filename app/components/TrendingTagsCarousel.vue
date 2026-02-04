<template>
  <!-- Trending Tags Carousel -->
  <section class="bg-white dark:bg-gray-950 animate-entrance">
    <div class="container mx-auto px-10">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-sm md:text-sm font-text font-600 uppercase">Trending tags</h2>
        <div class="flex items-center gap-2">
          <div
            class="tag-btn-wrapper"
            @click.stop.prevent="handleArrowClick('left')"
            :aria-hidden="false"
            :class="{ 'group': true }"
            role="button"
            tabindex="0"
            @keydown.enter.prevent="handleArrowClick('left')"
            @keydown.space.prevent="handleArrowClick('left')"
          >
            <NButton
              @click="() => {}"
              btn="ghost-gray"
              class="p-2"
              :disabled="mounted && !canScrollLeft"
              :class="{ 'opacity-60': mounted && !canScrollLeft, 'afforded': leftAfforded }"
              aria-label="Previous"
            >
              <div class="i-ph-arrow-left-bold"></div>
            </NButton>
          </div>

          <div
            class="tag-btn-wrapper"
            @click.stop.prevent="handleArrowClick('right')"
            :aria-hidden="false"
            :class="{ 'group': true }"
            role="button"
            tabindex="0"
            @keydown.enter.prevent="handleArrowClick('right')"
            @keydown.space.prevent="handleArrowClick('right')"
          >
            <NButton
              @click="() => {}"
              btn="ghost-gray"
              class="p-2"
              :disabled="mounted && !canScrollRight"
              :class="{ 'opacity-60': mounted && !canScrollRight, 'afforded': rightAfforded }"
              aria-label="Next"
            >
              <div class="i-ph-arrow-right-bold"></div>
            </NButton>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" :ref="setTagsContainer" class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
        <div v-for="i in 6" :key="i" class="flex-shrink-0 w-72 md:w-80 p-5 md:p-6 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse">
          <div class="h-5 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-3"></div>
          <div class="space-y-2">
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
            <div class="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
          </div>
        </div>
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="Tags unavailable"
        description="We couldn't fetch tags right now. Try again later."
        secondary-to="/posts"
        secondary-label="View posts"
      />

      <!-- Empty: dummy tags that match final UI -->
      <div
        v-else-if="trendingTags.length === 0"
        :ref="setTagsContainer"
        class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
        <div
          v-for="(tag, i) in placeholderTags"
          :key="tag"
          class="flex-shrink-0 w-72 md:w-80 animate-entrance-item"
          :style="{ animationDelay: `${i * 60}ms` }"
        >
          <div
            class="flex flex-col h-full p-5 md:p-6 rounded-2xl"
            :style="{ backgroundColor: colorForTag(tag) }"
          >
            <div class="space-y-2.5 md:space-y-3 flex-1">
              <h3 class="text-lg md:text-xl font-serif font-800 text-black">{{ tag }}</h3>
              <p class="text-xs md:text-sm leading-relaxed text-black/80 font-500 line-clamp-3">No posts yet. Add this tag to your first post.</p>
            </div>
            <div class="mt-3 md:mt-4">
              <span class="inline-block px-4 py-2 bg-white rounded-full text-xs font-600 text-black uppercase">
                Explore
              </span>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        :ref="setTagsContainer"
        class="relative flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
          <div
          v-for="(tag, i) in trendingTags"
          :key="tag.id"
          class="flex-shrink-0 w-72 md:w-80 animate-entrance-item"
          :style="{ animationDelay: `${i * 60}ms` }"
        >
          <NuxtLink
            :to="{ path: '/tags', query: { ...(route.query || {}), tag: tag.name } }"
            class="flex flex-col h-full p-5 md:p-6 rounded-2xl transition-all hover:shadow-md"
            :style="{ backgroundColor: colorForTag(tag.name) }"
          >
            <div class="space-y-2.5 md:space-y-3 flex-1">
              <h3 class="text-lg md:text-xl font-serif font-800 text-black">{{ tag.name }}</h3>
              <p class="text-xs md:text-sm leading-relaxed text-black/80 font-500 line-clamp-3">{{ descriptionForTag(tag) }}</p>
            </div>
            <div class="mt-3 md:mt-4">
              <span class="inline-block px-4 py-2 bg-white rounded-full text-xs font-600 text-black uppercase">
                View Posts
              </span>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import type { ApiTag } from '~~/shared/types/tags'

const tagsContainer = ref<HTMLElement | null>(null)
const route = useRoute()
const mounted = ref(false)
function setTagsContainer(el: Element | ComponentPublicInstance | null) {
  tagsContainer.value = el as HTMLElement | null
  // debug log removed
}

function scrollTags(direction: 'left' | 'right') {
  if (!tagsContainer.value) return
  // debug log removed
  // Avoid scrolling if content fits in container
  if (tagsContainer.value.scrollWidth <= tagsContainer.value.clientWidth) return
  const scrollAmount = 400
  const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount
  tagsContainer.value.scrollBy({ left: scrollDirection, behavior: 'smooth' })
}

function handleArrowClick(direction: 'left' | 'right') {
  if (direction === 'left' && canScrollLeft.value) {
    scrollTags(direction)
    return
  }
  if (direction === 'right' && canScrollRight.value) {
    scrollTags(direction)
    return
  }

  // show affordance animation for the clicked direction
  if (direction === 'left') {
    leftAfforded.value = true
    setTimeout(() => (leftAfforded.value = false), 240)
  } else {
    rightAfforded.value = true
    setTimeout(() => (rightAfforded.value = false), 240)
  }
}

// Detect whether the container is scrollable so we can hide/disable controls
const isScrollable = ref(false)
const leftAfforded = ref(false)
const rightAfforded = ref(false)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)
let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null

function updateIsScrollable() {
  if (!tagsContainer.value) {
    isScrollable.value = false
    canScrollLeft.value = false
    canScrollRight.value = false
    return
  }
  const sw = tagsContainer.value.scrollWidth
  const cw = tagsContainer.value.clientWidth
  const sl = tagsContainer.value.scrollLeft
  isScrollable.value = sw > cw
  canScrollLeft.value = sl > 0
  // use a small epsilon to avoid rounding issues
  canScrollRight.value = sl + cw < sw - 1
  // debug log removed
}

onMounted(() => {
  // Update after first render
  nextTick(updateIsScrollable)
  window.addEventListener('resize', updateIsScrollable)
  mounted.value = true
})

// Reattach observes when the underlying scroll container changes
watch(tagsContainer, (el, oldEl) => {
  // disconnect previous observers if any
  if (resizeObserver && oldEl) resizeObserver.disconnect()
  if (mutationObserver && oldEl) mutationObserver.disconnect()

  if (!el) return

  // ResizeObserver to detect container size changes
  if (typeof ResizeObserver !== 'undefined') {
    if (!resizeObserver) resizeObserver = new ResizeObserver(() => updateIsScrollable())
    resizeObserver.observe(el)
  }

  // MutationObserver to detect content changes
  if (typeof MutationObserver !== 'undefined') {
    if (!mutationObserver) mutationObserver = new MutationObserver(() => setTimeout(updateIsScrollable, 60))
    mutationObserver.observe(el, { childList: true, subtree: true })
  }
  // Also attach a scroll event listener to update left/right states while users scroll.
  if (el) el.addEventListener('scroll', updateIsScrollable)
  if (oldEl) oldEl.removeEventListener('scroll', updateIsScrollable)
  // Initial check for the new element
  nextTick(updateIsScrollable)
}, { immediate: true })

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsScrollable)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (mutationObserver) {
    mutationObserver.disconnect()
    mutationObserver = null
  }
})

// Recompute when tags change
// Recompute when tags change

// Fetch tags
const tagStore = useTagStore()
const pending = ref(true)
const error = ref<string | null>(null)

try {
  await tagStore.fetchTags()
} catch (e: any) {
  error.value = e?.message || 'Failed to load tags'
} finally {
  pending.value = false
}

const trendingTags = computed<ApiTag[]>(() => tagStore.allTags.slice(0, 6))

// Recompute when tags change
watch(() => trendingTags.value.length, () => {
  nextTick(updateIsScrollable)
})

const placeholderTags = ['Getting Started', 'Nuxt', 'Design', 'Tips', 'Guides', 'Announcements']

function colorForTag(name: string) {
  // Simple deterministic pastel color from string
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  const hue = Math.abs(hash) % 360
  return `hsl(${hue} 80% 85%)`
}

function descriptionForTag(tag: ApiTag) {
  if (tag.description && tag.description.trim().length > 0) {
    return tag.description
  }
  return tag.category ? `Category: ${tag.category}` : `Explore posts tagged “${tag.name}”`
}
</script>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Button wrapper */
.tag-btn-wrapper {
  display: inline-flex;
  align-items: center;
}

/* Small affordance animation */
.afforded {
  animation: afford 240ms ease;
}

@keyframes afford {
  0% { transform: none }
  30% { transform: translateY(-6px) scale(1.02) }
  100% { transform: none }
}

/* Overlay for inactive scroller */
.overlay-inactive {
  transition: opacity .18s ease;
  opacity: .85;
}
</style>
