<template>
  <div>
    <HeroFeaturedPosts />
    <NewsletterSubscription />
    <TrendingTagsCarousel />
    <FeaturedPostsGrid />
    <ProjectsCarousel />
    <RecentPostsGrid />
  </div>
</template>

<script setup lang="ts">
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
