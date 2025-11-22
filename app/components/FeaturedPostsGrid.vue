<template>
  <!-- Featured Posts Grid -->
  <section class="py-12 bg-white dark:bg-gray-950">
    <div class="container mx-auto px-4 max-w-7xl">
      <h2 class="text-xs md:text-sm font-semibold tracking-wider mb-3 uppercase text-gray-900 dark:text-gray-100">
        Featured Posts
      </h2>

      <!-- Loading -->
      <div v-if="pending" class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 md:mb-12">
        <CardSkeleton v-for="i in 3" :key="i" :lines="3" />
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="Featured posts unavailable"
        description="We couldn't fetch featured content. Please try again later."
        secondary-to="/posts"
        secondary-label="View all posts"
        variant="card"
        icon="i-ph-newspaper-duotone"
      />

      <!-- First row: single large article with image left, text right -->
      <article v-else-if="featuredPosts[0]" class="group mb-10 md:mb-12">
        <NuxtLink :to="`/posts/${featuredPosts[0].slug}`" class="block">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <!-- Image left -->
            <div class="md:col-span-6">
              <div v-if="featuredPosts[0].image?.src" class="relative overflow-hidden rounded-2xl aspect-[4/3]">
                <img
                  :src="featuredPosts[0].image.src"
                  :alt="featuredPosts[0].image.alt || featuredPosts[0].name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <!-- Text right -->
            <div class="md:col-span-6 space-y-4">
              <span v-if="featuredPosts[0].tags && featuredPosts[0].tags.length > 0" class="inline-block px-3.5 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">
                {{ featuredPosts[0].tags[0]?.name }}
              </span>
              <h3 class="text-2xl md:text-3xl lg:text-4xl font-serif font-bold leading-tight group-hover:opacity-80 transition-opacity">
                {{ featuredPosts[0].name }}
              </h3>
              <div class="flex items-center gap-2 text-sm font-600 text-gray-500 dark:text-gray-400">
                <time>{{ featuredPosts[0].formattedDate }}</time>
                <span>—</span>
                <span>{{ featuredPosts[0].user?.name }}</span>
              </div>
              <p v-if="featuredPosts[0].description" class="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {{ featuredPosts[0].description }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </article>

      <!-- Below: remaining articles in a responsive grid -->
      <div v-if="featuredPosts.length > 1" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <article
          v-for="post in featuredPosts.slice(1, 5)"
          :key="post.slug"
          class="group flex flex-col"
        >
          <NuxtLink :to="`/posts/${post.slug}`" class="block flex flex-col h-full">
            <div v-if="post.image?.src" class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4">
              <img
                :src="post.image.src"
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />

            </div>
            <div class="space-y-3 flex-1 flex flex-col">
              <span v-if="post.tags && post.tags.length > 0" class="inline-block w-fit px-3 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">
                {{ post.tags[0]?.name }}
              </span>
              <h3 class="text-lg md:text-xl font-serif font-bold leading-snug group-hover:opacity-80 transition-opacity line-clamp-2 flex-1">
                {{ post.name }}
              </h3>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                <time>{{ post.formattedDate }}</time>
                <span>—</span>
                <span>{{ post.user?.name }}</span>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
      
      <!-- Empty: dummy layout matching final UI -->
      <div v-else>
        <!-- Top spotlight article placeholder -->
        <article class="group mb-10 md:mb-12">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <!-- Image left -->
            <div class="md:col-span-6">
              <div class="relative overflow-hidden rounded-2xl aspect-[4/3] bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                <NuxtImg
                  src="https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg"
                  alt="Placeholder image"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Text right -->
            <div class="md:col-span-6 space-y-4">
              <span class="inline-block px-3.5 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">
                Getting Started
              </span>
              <h3 class="text-2xl md:text-3xl lg:text-4xl font-serif font-bold leading-tight">
                A Blogging Edge for Your Thoughts
              </h3>
              <div class="flex items-center gap-2 text-sm font-600 text-gray-500 dark:text-gray-400">
                <time>{{ today }}</time>
                <span>—</span>
                <span>Newme</span>
              </div>
              <p class="font-body font-500 text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                A Nuxt powered blogging platform. 
                Built for simplicity and speed on top of modern web technologies.
                It's made with UnaUI, UnoCSS, Tiptap editor, and deploys on (NuxtHub) Cloudflare workers.
              </p>
            </div>
          </div>
        </article>

        <!-- Below: 4 placeholders -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <article v-for="post in placeholderPosts" :key="post.slug" class="group flex flex-col">
            <div class="relative overflow-hidden rounded-2xl aspect-[4/3] mb-4 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
              <NuxtImg
                :src="post.image.src"
                :alt="post.image.alt || 'Placeholder image'"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="space-y-3 flex-1 flex flex-col">
              <span class="inline-block w-fit px-3 py-1.5 text-xs font-semibold tracking-wide bg-lime-300 dark:bg-lime-400 text-gray-900 rounded-full uppercase">{{ post.tags?.length ? post.tags[0]?.name : 'Tag' }}</span>
              <h3 class="text-lg md:text-xl font-serif font-bold leading-snug line-clamp-2 flex-1">{{ post.name }}</h3>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                <time>{{ post.formattedDate || today }}</time>
                <span>—</span>
                <span>{{ post.user?.name || 'Author' }}</span>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'
const { enhancePost } = usePost()

const { data, pending, error } = await useFetch<Post[]>('/api/posts')

const featuredPosts = computed(() => (data.value ?? []).slice(0, 5).map(p => enhancePost(p)))

const today = new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })

// Placeholder posts used when there are no featured posts available from the API.
// These provide realistic titles, tags, dates and authors for UI/UX preview.
// Use a flexible shape for placeholder posts since helpers add derived fields like formattedDate
const placeholderPosts: Array<Record<string, any>> = [
  {
    slug: 'getting-started-nuxt',
    name: 'Getting Started with Nuxt',
    image: {
      src: 'https://images.pexels.com/photos/2157805/pexels-photo-2157805.jpeg',
      alt: 'Getting Started with Nuxt'
    },
    tags: [{ name: 'Nuxt' } as any],
    formattedDate: 'Sep 25, 2025',
    user: { name: 'Ava' }
  },
  {
    slug: 'all-the-necessary-parts',
    name: 'All the necessary parts',
    image: {
      src: 'https://images.pexels.com/photos/3695238/pexels-photo-3695238.jpeg',
      alt: 'All the necessary parts'
    },
    tags: [{ name: 'Design' } as any],
    formattedDate: 'Oct 01, 2025',
    user: { name: 'Leo' }
  },
  {
    slug: 'customize-your-experience',
    name: 'Customize Your Experience',
    image: {
      src: 'https://images.pexels.com/photos/4202952/pexels-photo-4202952.jpeg',
      alt: 'Customize Your Experience'
    },
    tags: [{ name: 'Productivity' } as any],
    formattedDate: 'Aug 07, 2025',
    user: { name: 'Chris' }
  },
  {
    slug: 'deploying-with-hub',
    name: 'Deploying with Nuxt Hub',
    image: {
      src: 'https://images.pexels.com/photos/33260741/pexels-photo-33260741.jpeg',
      alt: 'Deploying with Nuxt Hub'
    },
    tags: [{ name: 'Deploy' } as any],
    formattedDate: 'Nov 01, 2025',
    user: { name: 'Root' }
  }
]
</script>
