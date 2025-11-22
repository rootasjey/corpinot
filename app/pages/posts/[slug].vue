<template>
  <div v-if="post" class="min-h-screen">
    <!-- Hero Section - Dark Header with Title -->
    <div class="py-16 md:py-24">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-4xl mx-auto text-center">
          <!-- Date and Reading Time -->
          <div class="font-600 text-md text-gray-400 flex items-center justify-center gap-3 mb-6">
            <time>{{ formatPostDate(post.publishedAt || post.createdAt) }}</time>
            <span>—</span>
            <span>{{ enhancedPost.readingTime }}</span>
          </div>
          
          <!-- Title -->
          <h1 class="max-w-3xl mx-auto text-4xl md:text-5xl lg:text-4xl font-serif font-700 mb-6 leading-tight">
            {{ post.name }}
          </h1>
          
          <!-- Excerpt/Description -->
          <p class="font-body font-600 color-gray-500 text-base md:text-lg leading-relaxed mb-8 max-w-3xl mx-auto">
            {{ post.description }}
          </p>

          <!-- Tags/Badges -->
          <div class="flex items-center justify-center flex-wrap gap-3">
            <div
              class="bg-[#F2F3F4] text-color-black dark:bg-gray-600 dark:text-color-white rounded-full 
                px-4 py-1 text-xs font-semibold flex items-center gap-2"
            >
              <NIcon name="i-ph-lightning-fill" />
              <span>FEATURED POST</span>
            </div>
            <div
              v-for="tag in post.tags"
              :key="tag.id"
              class="uppercase bg-[#F2F3F4] text-color-black dark:bg-gray-600 dark:text-color-white rounded-full px-4 py-1 text-xs font-semibold flex items-center"
            >
              {{ tag.name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Featured Image -->
    <div v-if="post.image?.src" class="w-full px-4">
      <NuxtImg
        provider="hubblob"
        :src="post.image.src" 
        :alt="post.image.alt || post.name"
        class="w-full h-auto max-h-[90vh] object-cover rounded-2xl"
      />
    </div>

    <!-- Post Info Bar Below Image -->
    <div class="border-b border-border bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto py-6">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <!-- Author Info -->
            <div v-if="post.user" class="flex items-center gap-3">
              <img 
                v-if="post.user.avatar"
                :src="post.user.avatar" 
                :alt="post.user.name || 'User'"
                class="w-8 h-8 rounded-full"
              />
              <div v-if="post.user.name">
                <div class="font-semibold">{{ post.user.name }}</div>
              </div>
            </div>

            <!-- Social Share Buttons -->
            <div class="flex gap-2">
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Twitter"
              >
                <div class="i-ph-x-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Facebook"
              >
                <div class="i-ph-facebook-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share via Email"
              >
                <div class="i-ph-envelope w-5 h-5" />
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Article Content -->
    <article class="py-12 md:py-16 bg-background">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto">
          <!-- Tiptap Content Renderer -->
          <PostContent v-if="post.article" :content="post.article" />
        </div>
      </div>
    </article>

    <!-- Author Bio Section -->
    <section v-if="post.user" class="py-12 md:py-16 dark:bg-gray-950">
      <div class="container mx-auto px-4 md:px-8">
        <div class="max-w-3xl mx-auto border-t pt-8">
          <div class="flex items-center justify-between gap-8 flex-wrap md:flex-nowrap">
            <!-- Left: Avatar and Name -->
            <div class="flex items-center gap-6">
              <img 
                v-if="post.user.avatar"
                :src="post.user.avatar" 
                :alt="post.user.name || 'User'"
                class="w-12 h-12 rounded-full flex-shrink-0 ring-4 ring-white/10"
              />
              <div>
                <h3 class="text-md font-bold mb-1">{{ post.user.name }}</h3>
              </div>
            </div>

            <!-- Social Share Buttons -->
            <div class="flex gap-2">
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Twitter"
              >
                <div class="i-ph-x-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share on Facebook"
              >
                <div class="i-ph-facebook-logo w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Share via Email"
              >
                <div class="i-ph-envelope w-5 h-5" />
              </NButton>
              <NButton
                icon
                size="sm"
                btn="ghost-gray"
                class="hover:bg-muted"
                aria-label="Copy Link"
              >
                <div class="i-ph-copy w-5 h-5" />
              </NButton>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Related Posts Section - TODO: Implement related posts API -->
    <!-- <section class="py-16 bg-muted/30">
      <div class="container mx-auto px-4 md:px-8">
        <h2 class="uppercase font-600 text-size-4 mb-4">You Might Also Like</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          Related posts will go here
        </div>
      </div>
    </section> -->
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const route = useRoute()
const slug = route.params.slug as string
const { enhancePost, formatPostDate } = usePost()

// Fetch post data from API
const { data: post, error } = await useFetch<Post>(`/api/posts/${slug}`)

if (error.value || !post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post not found'
  })
}

// Enhance post with computed properties
const enhancedPost = computed(() => enhancePost(post.value!))

useHead({
  title: post.value.name,
  meta: [
    { name: 'description', content: post.value.description || '' },
    { property: 'og:title', content: post.value.name },
    { property: 'og:description', content: post.value.description || '' },
    { property: 'og:image', content: post.value.image?.src || '' },
  ]
})
</script>

<style scoped>
.social-btn {
  transition: all 0.3s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
}
</style>
