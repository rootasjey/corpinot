<template>
  <section class="-mt-15 relative isolate min-h-[88vh] overflow-hidden bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 text-white">
    <!-- Ambient glow behind the slides -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_35%)]" />
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_80%_0%,rgba(163,230,53,0.12),transparent_30%)]" />
    </div>

    <div class="relative flex h-full flex-col">
      <div
        ref="slidesContainer"
        class="flex-1 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide"
      >
        <div class="flex h-full">
          <article
            v-for="(post, index) in slides"
            :key="post.slug ?? index"
            class="relative min-w-full snap-start"
          >
            <NuxtLink
              :to="post.slug ? `/posts/${post.slug}` : '#'"
              class="block h-[82vh] overflow-hidden rounded-[32px] border border-white/10 bg-slate-900"
            >
              <NuxtImg
                v-if="post.image?.src"
                :provider="post.image.src.startsWith('/posts/') ? 'hubblob' : undefined"
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="absolute inset-0 h-full w-full object-cover"
                format="webp"
                loading="lazy"
              />
              <div class="absolute inset-0 bg-gradient-to-b from-black/40 via-black/15 to-black/70" />
              <div class="absolute inset-0 bg-[linear-gradient(120deg,rgba(15,23,42,0.55)_0%,rgba(15,23,42,0.15)_40%,transparent_70%)]" />

              <div class="relative flex h-full flex-col justify-between p-6">
                <div class="mt-12 flex items-center justify-between text-xs text-white/80">
                  <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold uppercase tracking-[0.18em]">
                    <span class="i-ph-sparkle-duotone text-base" />
                    {{ post.tags?.[0]?.name || 'Featured' }}
                  </span>
                  <span v-if="post.formattedDate">{{ post.formattedDate }}</span>
                </div>

                <div class="space-y-4">
                  <div class="space-y-3">
                    <p class="text-sm text-white/80">
                      {{ post.user?.name ? `By ${post.user.name}` : 'Editorial pick' }}
                    </p>
                    <h1 class="text-3xl leading-tight sm:text-4xl font-serif font-bold">
                      {{ post.name }}
                    </h1>
                  </div>
                  <p v-if="post.description" class="text-base text-white/80 leading-relaxed line-clamp-3">
                    {{ post.description }}
                  </p>
                  <div class="flex flex-wrap items-center gap-3">
                    <NuxtLink
                      :to="post.slug ? `/posts/${post.slug}` : '#'"
                      class="inline-flex items-center gap-2 rounded-full bg-white text-gray-900 px-4 py-2 font-semibold shadow-lg shadow-black/20"
                    >
                      Read article
                      <div class="i-ph-arrow-right-bold" />
                    </NuxtLink>
                    <div class="flex items-center gap-2 text-xs text-white/70">
                      <span v-if="post.readingTime">{{ post.readingTime }}</span>
                      <span v-if="post.readingTime && post.user?.name">•</span>
                      <span v-if="post.user?.name">{{ post.user.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </article>
        </div>
      </div>

      <div class="-mt-15 flex items-center justify-between px-6 pb-6 z-2">
        <div class="flex gap-2">
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="activeIndex === 0 || pending"
            @click="goPrev"
            aria-label="Previous story"
          >
            <div class="i-ph-arrow-left-bold" />
          </button>
          <button
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="activeIndex >= slides.length - 1 || pending"
            @click="goNext"
            aria-label="Next story"
          >
            <div class="i-ph-arrow-right-bold" />
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-white/70">{{ activeIndex + 1 }} / {{ slides.length }}</span>
          <div class="flex items-center gap-1">
            <span
              v-for="(post, dotIndex) in slides"
              :key="post.slug ?? dotIndex"
              class="h-2 rounded-full bg-white/30 transition-all duration-300"
              :class="activeIndex === dotIndex ? 'w-6 bg-white' : 'w-2'"
            />
          </div>
        </div>
      </div>

      <div v-if="error && !pending" class="pointer-events-none absolute left-6 bottom-16 text-xs text-white/70">
        Showing sample stories while we reconnect.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useEventListener, useThrottleFn } from '@vueuse/core'
import type { Post } from '~~/shared/types/post'
import type { ApiTag } from '~~/shared/types/tags'

const { enhancePost } = usePost()
const FEATURED_POST_TAG = 'featured post'

const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: FEATURED_POST_TAG, limit: 6 },
})

type HeroSlide = Partial<Post> & {
  slug: string
  name: string
  formattedDate?: string
  readingTime?: string
  image?: {
    src: string
    alt?: string
    ext?: string
  }
  tags?: ApiTag[]
}

const fallbackSlides: HeroSlide[] = [
  {
    slug: 'andes-expedition',
    name: 'Andes Sunrise Expedition',
    description: 'A dawn ascent through pastel clouds and razor peaks above Patagonia.',
    formattedDate: 'Nov 20, 2025',
    readingTime: '4 min read',
    image: {
      src: 'https://images.pexels.com/photos/33260741/pexels-photo-33260741.jpeg?w=1200&auto=format&fit=crop',
      alt: 'Mountain ridge at sunrise',
      ext: 'jpeg',
    },
    user: { name: 'Camila Rocha' },
    tags: [{ name: 'Adventure' } as ApiTag],
  },
  {
    slug: 'atlantic-coastline',
    name: 'Atlantic Coastline by Rail',
    description: 'Slow travel across fishing villages, seaside cliffs, and salt-scented winds.',
    formattedDate: 'Oct 04, 2025',
    readingTime: '5 min read',
    image: {
      src: 'https://images.pexels.com/photos/1683724/pexels-photo-1683724.jpeg?w=1200&auto=format&fit=crop',
      alt: 'Train passing near the ocean',
      ext: 'jpeg',
    },
    user: { name: 'Hugo Martins' },
    tags: [{ name: 'Slow Travel' } as ApiTag],
  },
  {
    slug: 'saharan-night',
    name: 'Tracing Constellations in the Sahara',
    description: 'A nomad-led night under a violet sky, mapped by starlight and dunes.',
    formattedDate: 'Sep 12, 2025',
    readingTime: '6 min read',
    image: {
      src: 'https://images.pexels.com/photos/1703316/pexels-photo-1703316.jpeg?w=1200&auto=format&fit=crop',
      alt: 'Desert night sky with stars',
      ext: 'jpeg',
    },
    user: { name: 'Lina Haddad' },
    tags: [{ name: 'Culture' } as ApiTag],
  },
]

const slides = computed<HeroSlide[]>(() => {
  const posts = (data.value ?? []).map(post => enhancePost(post)) as HeroSlide[]
  return posts.length ? posts : fallbackSlides
})

const slidesContainer = ref<HTMLElement | null>(null)
const activeIndex = ref(0)

function scrollToIndex(index: number) {
  const el = slidesContainer.value
  if (!el) return
  const clamped = Math.min(Math.max(index, 0), slides.value.length - 1)
  activeIndex.value = clamped
  el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
}

function goNext() {
  scrollToIndex(activeIndex.value + 1)
}

function goPrev() {
  scrollToIndex(activeIndex.value - 1)
}

function updateActiveIndex() {
  const el = slidesContainer.value
  if (!el) return
  const width = el.clientWidth || 1
  activeIndex.value = Math.round(el.scrollLeft / width)
}

const throttledUpdate = useThrottleFn(updateActiveIndex, 120)
useEventListener(slidesContainer, 'scroll', throttledUpdate)

watch(slides, async () => {
  await nextTick()
  scrollToIndex(0)
})
</script>

<style scoped>
:global(.scrollbar-hide::-webkit-scrollbar) {
  display: none;
}

:global(.scrollbar-hide) {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
