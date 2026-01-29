<template>
  <section class="mt-6 space-y-5">
    <div class="flex items-center justify-between px-1">
      <div>
        <NuxtLink to="/projects" class="inline-block mb-1">
          <h2 class="text-[11px] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Projects</h2>
        </NuxtLink>
      </div>
      
      <NuxtLink
        to="/projects"
        class="text-[11px] uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-1"
        aria-label="View all projects"
      >
        <span>See all</span>
        <NIcon name="i-ph-arrow-up-right" />
      </NuxtLink>
    </div>

    <div
      v-if="pending"
      class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-4 px-4 pb-4"
    >
      <div
        v-for="index in 2"
        :key="index"
        class="grid grid-cols-2 gap-3 min-w-[calc(100vw-4rem)] flex-shrink-0 snap-start rounded-3xl border border-white/30 bg-white/5 dark:border-white/10 dark:bg-white/5 p-4"
      >
        <div
          v-for="placeholder in 4"
          :key="placeholder"
          class="flex flex-col items-center gap-3"
        >
          <div class="h-20 w-20 rounded-2xl bg-gray-200/70 dark:bg-gray-700 animate-pulse"></div>
          <div class="h-4 w-24 rounded-full bg-gray-200/60 dark:bg-gray-700/80 animate-pulse"></div>
        </div>
      </div>
    </div>

    <EmptyState
      v-else-if="error"
      title="Projects unavailable"
      description="We couldn't fetch projects. Please try again later."
      variant="card"
      icon="i-ph-folder-duotone"
    />

    <div
      v-else
      class="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 pb-4"
    >
      <div
        v-for="(chunk, chunkIndex) in projectChunks"
        :key="chunkIndex"
        class="grid grid-cols-2 gap-3 p-2 min-w-[calc(100vw-4rem)] flex-shrink-0 snap-start rounded-3xl border border-gray-200/60 bg-white/80 dark:border-white/10 dark:bg-gray-900/80"
      >
        <NuxtLink
          v-for="project in chunk"
          :key="project.slug"
          :to="`/posts/${project.slug}`"
          class="h-48 w-38 flex flex-col items-center gap-3 rounded-2xl bg-gradient-to-b from-slate-50/80 to-white/90 
            p-1 text-center transition hover:border-primary/60 dark:border-white/10 
            dark:from-white/5 dark:to-white/0"
        >
          <div class="rounded-2xl overflow-hidden flex-1 
            bg-slate-100 dark:bg-slate-800 shadow-md 
            hover:shadow-lg hover:scale-105 active:scale-99 active:shadow-none transition-all duration-300">
            <NuxtImg
              :provider="project.image.startsWith('/posts/') ? 'hubblob' : undefined"
              :src="project.image"
              :alt="project.title"
              class="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <p class="max-w-34 text-sm font-500 leading-tight text-slate-900 dark:text-white line-clamp-2 max-h-[3rem] overflow-hidden">
            {{ project.title }}
          </p>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Post } from '~~/shared/types/post'
import {
  FEATURED_PROJECT_FALLBACK_IMAGE,
  FEATURED_PROJECT_TAG,
  FEATURED_PROJECTS_KEY,
  FALLBACK_PROJECTS,
  type FeaturedProjectSummary,
} from '~/utils/featuredProjects'

const { enhancePost } = usePost()

const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: FEATURED_PROJECT_TAG, limit: 12 },
  key: FEATURED_PROJECTS_KEY,
})

const projects = computed<FeaturedProjectSummary[]>(() => {
  if (data.value?.length) {
    return data.value
      .map(post => enhancePost(post))
      .map(post => ({
        slug: post.slug,
        title: post.name,
        image: post.image?.src || FEATURED_PROJECT_FALLBACK_IMAGE,
      }))
  }

  return FALLBACK_PROJECTS
})

const projectChunks = computed(() => chunkProjects(projects.value, 4))

function chunkProjects(items: FeaturedProjectSummary[], size: number) {
  const groups: FeaturedProjectSummary[][] = []

  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }

  return groups
}
</script>
