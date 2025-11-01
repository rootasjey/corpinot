<template>
  <!-- Projects Carousel -->
  <section class="relative py-12 md:py-16 bg-gray-900 dark:bg-black text-white grid-pattern">
    <div class="container mx-auto px-8 md:px-12 lg:px-16">
      <!-- Title centered, controls on the right -->
      <div class="relative mb-6 md:mb-8">
        <h2 class="font-serif font-700 text-center mx-auto max-w-2xl text-2xl md:text-4xl">
          Explore our latest projects and creative work
        </h2>
        <div v-if="!pending && !error && projects.length" class="absolute right-0 top-1/2 -translate-y-1/2 flex">
          <NButton
            @click="scrollProjects('left')"
            btn="ghost-gray"
            class="p-2"
            aria-label="Previous"
          >
            <div class="i-ph-arrow-left-bold"></div>
          </NButton>
          <NButton
            @click="scrollProjects('right')"
            btn="ghost-gray"
            class="p-2"
            aria-label="Next"
          >
            <div class="i-ph-arrow-right-bold"></div>
          </NButton>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="pending" class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-2">
        <div v-for="i in 5" :key="i" class="flex-shrink-0 w-72 md:w-80 lg:w-[22rem] animate-pulse">
          <div class="relative overflow-hidden rounded-xl aspect-[4/5] bg-gray-800"></div>
        </div>
      </div>

      <!-- Error -->
      <EmptyState
        v-else-if="error"
        title="Projects unavailable"
        description="We couldn't fetch projects. Please try again later."
        variant="card"
        icon="i-ph-folder-duotone"
      />

      <!-- Content -->
      <div
        v-else
        ref="projectsContainer"
        class="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style="scrollbar-width: none; -ms-overflow-style: none"
      >
        <article
          v-for="project in projects"
          :key="project.slug"
          class="flex-shrink-0 w-72 md:w-80 lg:w-[22rem] group"
        >
          <NuxtLink :to="`/posts/${project.slug}`" class="block">
            <!-- Taller image with overlayed text -->
            <div class="relative overflow-hidden rounded-xl aspect-[4/5]">
              <img
                :src="project.image"
                :alt="project.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <!-- Gradient overlay for readability -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
              <!-- Labels and title -->
              <div class="absolute inset-0 flex flex-col justify-end p-4 md:p-6">
                <span class="inline-flex w-fit px-3 py-1.5 text-[11px] tracking-wide uppercase font-semibold bg-white/10 border border-white/15 rounded-full mb-3">
                  Project
                </span>
                <h3 class="text-white text-lg md:text-xl font-serif font-700 leading-snug line-clamp-3">
                  {{ project.title }}
                </h3>
              </div>
            </div>
          </NuxtLink>
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Post } from '~~/shared/types/post'

const { enhancePost } = usePost()

const projectsContainer = ref<HTMLElement>()

function scrollProjects(direction: 'left' | 'right') {
  if (!projectsContainer.value) return
  const scrollAmount = 400
  const scrollDirection = direction === 'left' ? -scrollAmount : scrollAmount
  projectsContainer.value.scrollBy({ left: scrollDirection, behavior: 'smooth' })
}

// Fetch posts with "project" tag
const { data, pending, error } = await useFetch<Post[]>('/api/posts', {
  query: { tag: 'project' }
})

const projects = computed(() => {
  if (data.value && data.value.length > 0) {
    return data.value.map(p => enhancePost(p)).map(post => ({
      slug: post.slug,
      title: post.name,
      image: post.image?.src || 'https://images.pexels.com/photos/1181467/pexels-photo-1181467.jpeg'
    }))
  }
  
  // Dummy projects when empty
  return [
    {
      slug: 'a-game-of-life',
      title: 'A Game of Life: Building the Conway\'s Simulation',
      image: 'https://images.pexels.com/photos/776654/pexels-photo-776654.jpeg?w=800&h=600&fit=crop',
    },
    {
      slug: 'mobile-app-design',
      title: 'Mobile App Design: Creating Intuitive User Experiences',
      image: 'https://images.pexels.com/photos/8780204/pexels-photo-8780204.jpeg?w=800&h=600&fit=crop',
    },
    {
      slug: 'brand-identity-redesign',
      title: 'Brand Identity Redesign: From Concept to Launch',
      image: 'https://images.pexels.com/photos/2993940/pexels-photo-2993940.jpeg?w=800&h=600&fit=crop',
    },
    {
      slug: 'web-application-dashboard',
      title: 'Web Application Dashboard: Data Visualization Project',
      image: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?w=800&h=600&fit=crop',
    },
    {
      slug: 'automation-workflow',
      title: 'Automation Workflow: Streamlining Business Processes',
      image: 'https://images.pexels.com/photos/168866/pexels-photo-168866.jpeg?w=800&h=600&fit=crop',
    },
  ]
})
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

/* Subtle grid background, inspired by the reference */
.grid-pattern {
  position: relative;
}

.grid-pattern::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.06) 1px, transparent 1px);
  background-size: 56px 56px, 56px 56px;
  background-position: -1px -1px;
  mask-image: radial-gradient(ellipse at center, black, transparent 85%);
}
</style>
