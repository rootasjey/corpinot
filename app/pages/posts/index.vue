<template>
  <div class="min-h-screen py-12 md:py-16">
    <div class="container mx-auto px-4 md:px-8">
      <!-- Page Header -->
      <div v-if="(posts?.length || 0) > 0" class="text-center mb-12 md:mb-16">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
          Latest Posts
        </h1>
        <p class="text-lg md:text-xl text-muted max-w-2xl mx-auto">
          Explore stories, ideas, and insights from our writers
        </p>
      </div>

      <!-- Posts Grid -->
      <div v-if="posts && posts.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <NuxtLink
          v-for="post in enhancedPosts"
          :key="post.slug"
          :to="`/posts/${post.slug}`"
          class="group"
        >
          <article class="h-full flex flex-col bg-background rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
            <!-- Image -->
            <div v-if="post.image?.src" class="aspect-[16/10] overflow-hidden">
              <img 
                :src="post.image.src" 
                :alt="post.image.alt || post.name"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            <!-- Content -->
            <div class="flex-1 flex flex-col p-6">
              <!-- Tags -->
              <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-3">
                <NButton
                  v-for="tag in post.tags.slice(0, 3)"
                  :key="tag.id"
                  size="xs"
                  variant="soft"
                >
                  {{ tag.name }}
                </NButton>
              </div>

              <!-- Title -->
              <h2 class="text-2xl font-bold mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                {{ post.name }}
              </h2>

              <!-- Excerpt -->
              <p v-if="post.description" class="text-muted mb-4 line-clamp-2 flex-1">
                {{ post.description }}
              </p>

              <!-- Meta -->
              <div class="flex items-center justify-between pt-4 border-t border-border">
                <div v-if="post.user" class="flex items-center gap-3">
                  <img 
                    v-if="post.user.avatar"
                    :src="post.user.avatar" 
                    :alt="post.user.name || 'User'"
                    class="w-8 h-8 rounded-full"
                  />
                  <span class="text-sm font-medium">{{ post.user.name }}</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-muted">
                  <time>{{ post.formattedDate }}</time>
                  <span>•</span>
                  <span>{{ post.readingTime }}</span>
                </div>
              </div>
            </div>
          </article>
        </NuxtLink>
      </div>

      <!-- Loading state -->
      <div v-else-if="pending" class="text-center py-12">
        <p class="text-muted">Loading posts...</p>
      </div>

      <!-- Empty state (styled like error page) -->
      <div v-else class="text-center py-12">
        <div class="mb-6">
          <!-- Large glyph to mirror `app/error.vue` style (indicates empty state)
               Using '0' here to indicate zero posts — purely stylistic. -->
          <p class="error-code text-8xl md:text-size-54 font-extrabold leading-none">0</p>
        </div>

        <h2 class="text-3xl md:text-4xl lg:text-5xl font-serif font-800 mb-4">No posts yet</h2>

        <p class="font-body font-500 text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-8">
          There are no posts to display right now — yet. Create the first article, or explore other sections of the site.
        </p>

        <div class="flex flex-col sm:flex-row gap-6 justify-center mb-12">
          <NuxtLink to="/" class="px-6 py-5 bg-black dark:bg-white text-white dark:text-black text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-800 dark:hover:bg-gray-200 transition flex items-center gap-2">
            <div class="i-ph-house-bold w-4 h-4"></div>
            Go Home
          </NuxtLink>

          <NuxtLink to="/credits" class="px-6 py-5 border border-gray-300 dark:border-gray-700 text-sm font-500 uppercase tracking-wide rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition flex items-center gap-2">
            <div class="i-ph-arrow-left-bold w-4 h-4"></div>
            Browse Credits
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Post } from '~~/shared/types/post'

const { enhancePost } = usePost()

// Fetch posts from API
const { data: posts, pending, error } = await useFetch<Post[]>('/api/posts')

// Enhance posts with computed properties
const enhancedPosts = computed(() => {
  if (!posts.value) return []
  return posts.value.map(post => enhancePost(post))
})

useHead({
  title: 'Posts - Woords',
  meta: [
    { name: 'description', content: 'Explore our latest articles on travel, culture, and lifestyle.' }
  ]
})
</script>

<style scoped>
.error-code {
  color: transparent;
  -webkit-text-stroke: 2px #F5E5E1;
  cursor: default;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.dark .error-code {
  -webkit-text-stroke: 2px #374151;
}

.error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
  transform: scale(0.99);
  animation: stroke-rainbow 3s linear infinite;
}

.dark .error-code:hover {
  -webkit-text-stroke: 3px #FF8F8F;
}

@keyframes stroke-pulse {
  0%, 100% {
    -webkit-text-stroke-width: 3px;
    filter: drop-shadow(0 0 0px #FF8F8F);
  }
  50% {
    -webkit-text-stroke-width: 4px;
    filter: drop-shadow(0 0 20px rgba(234, 179, 8, 0.6));
  }
}

@keyframes stroke-rainbow {
  0% { -webkit-text-stroke-color: #FF8F8F; }
  25% { -webkit-text-stroke-color: #FFF1CB; }
  50% { -webkit-text-stroke-color: #C2E2FA; }
  75% { -webkit-text-stroke-color: #B7A3E3; }
  100% { -webkit-text-stroke-color: #FF8F8F; }
}
</style>
