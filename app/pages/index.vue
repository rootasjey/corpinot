<template>
  <div class="bg-gray-50 dark:bg-gray-950">
    <!-- Client-only mobile experience -->
    <ClientOnly>
      <component
        v-if="mobileIndex && isMobile"
        :is="mobileIndex"
      />
    </ClientOnly>

    <!-- Desktop / SSR experience -->
    <div v-if="!isMobile">
      <div class="animate-entrance"><TopPinnedPosts /></div>
      <div class="animate-entrance"><NewsletterSubscription /></div>
      <div class="animate-entrance"><TrendingTagsCarousel /></div>
      <div class="animate-entrance"><FeaturedPostsGrid /></div>
      <div class="animate-entrance"><ProjectsCarousel /></div>
      <div class="animate-entrance"><RecentPostsGrid /></div>
    </div> 
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

const isMobile = useIsMobile()
const config = useRuntimeConfig()

const mobileIndex = computed(() => {
  if (!import.meta.client) return null
  return defineAsyncComponent(() => import('~~/app/components/MobileIndex.vue'))
})

const ogImageUrl = `${config.public.siteUrl}/og/home/default.png`

useSeoMeta({
  title: 'Corpinot - Personal Thoughts, Shared Openly',
  description: 'Personal thoughts shared openly on Corpinot',
  ogTitle: 'Corpinot',
  ogDescription: 'Personal thoughts shared openly',
  ogImage: ogImageUrl,
  ogUrl: config.public.siteUrl,
  twitterCard: 'summary_large_image',
  twitterImage: ogImageUrl,
})
</script>

<style>
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
