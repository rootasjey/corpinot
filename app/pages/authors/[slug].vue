<template>
  <section class="py-14 md:py-18 bg-white dark:bg-gray-950">
    <div class="container mx-auto px-6 max-w-5xl space-y-10">
      <div class="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="flex items-start gap-4">
          <NuxtImg provider="hubblob" v-if="author?.avatar" :src="author.avatar" :alt="author.name" class="w-24 h-24 rounded-full object-cover" />
          <div v-else class="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-2xl font-semibold">
            {{ authorInitials }}
          </div>
          <div class="space-y-2">
            <h1 class="text-3xl font-800 font-serif leading-tight">{{ author?.name }}</h1>
            <p v-if="author?.job" class="text-sm text-gray-500 dark:text-gray-400">{{ author.job }}</p>
            <p v-if="author?.location" class="text-sm text-gray-500 dark:text-gray-400">{{ author.location }}</p>
            <div v-if="authorSocials.length" class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-300">
              <a
                v-for="social in authorSocials"
                :key="social.platform + social.url"
                :href="social.url"
                target="_blank"
                rel="noopener noreferrer"
                class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-2"
              >
                <NIcon :name="platformIcon(social.platform)" class="text-lg" />
                <span>{{ social.platform }}</span>
              </a>
            </div>
          </div>
        </div>
        <NuxtLink to="/authors" class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">← Back to authors</NuxtLink>
      </div>

      <p v-if="author?.biography" class="text-lg text-gray-700 dark:text-gray-300 max-w-4xl leading-relaxed">{{ author.biography }}</p>

      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-700">Articles</h2>
          <span class="text-sm text-gray-500 dark:text-gray-400">{{ posts.length }} published</span>
        </div>

        <div v-if="postsPending" class="grid gap-4 md:grid-cols-2">
          <div v-for="i in 4" :key="i" class="h-32 rounded-2xl bg-gray-100 dark:bg-gray-900 animate-pulse"></div>
        </div>

        <div v-else-if="postsError" class="text-red-600 dark:text-red-400">{{ postsError }}</div>

        <div v-else-if="!posts.length" class="text-gray-600 dark:text-gray-400">No articles yet.</div>

        <div v-else class="grid gap-4 md:grid-cols-2">
          <NuxtLink
            v-for="post in posts"
            :key="post.slug"
            :to="`/posts/${post.slug}`"
            class="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-900 space-y-2"
          >
            <p class="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{{ post.status === 'published' ? 'Published' : post.status }}</p>
            <h3 class="text-xl font-semibold leading-tight line-clamp-2">{{ post.name }}</h3>
            <p v-if="post.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{{ post.description }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createError } from 'h3'
import type { PostStatus } from '~~/shared/types/post'

type Author = {
  id: number
  name: string
  slug?: string
  avatar: string
  biography: string
  job: string
  location: string
  socials: { platform: string; url: string }[]
}

type PostSummary = {
  id: number
  slug: string
  name: string
  description: string | null
  status: PostStatus
}

const route = useRoute()
const slug = String(route.params.slug)

const { data: authorData, error: authorError } = await useFetch<Author>(`/api/authors/${slug}`)
const author = computed(() => authorData.value)

const authorInitials = computed(() => {
  if (!author.value?.name) return ''
  return author.value.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
})

const authorSocials = computed(() => author.value?.socials ?? [])

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let p = platform.toLowerCase().trim()
  if (p.startsWith('http')) {
    try {
      const h = new URL(p).hostname
      p = h.replace(/^www\./, '')
    } catch (_) {}
  }
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'i-lucide-twitter'
  if (p.includes('github')) return 'i-lucide-github'
  if (p.includes('linkedin')) return 'i-lucide-linkedin'
  if (p.includes('instagram')) return 'i-lucide-instagram'
  if (p.includes('facebook')) return 'i-lucide-facebook'
  if (p.includes('tiktok')) return 'i-lucide-music'
  if (p.includes('youtube') || p.includes('youtu.be')) return 'i-lucide-youtube'
  if (p.includes('website') || p.includes('site') || p.includes('blog') || p.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

const {
  data: postsData,
  pending: postsPending,
  error: postsError,
} = await useFetch<PostSummary[]>(`/api/posts`, {
  params: { author: slug, status: 'published' },
})

const posts = computed(() => postsData.value ?? [])

if (authorError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Author not found' })
}

const config = useRuntimeConfig()
const ogImageUrl = computed(() => `${config.public.siteUrl}/og/author/${slug}.png`)

useSeoMeta({
  title: () => `${author.value?.name} - Corpinot`,
  description: () => author.value?.biography || `Articles by ${author.value?.name}`,
  ogTitle: () => author.value?.name || '',
  ogDescription: () => author.value?.biography || `Articles by ${author.value?.name}`,
  ogImage: ogImageUrl,
  ogUrl: () => `${config.public.siteUrl}/authors/${slug}`,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})
</script>
