<template>
  <NuxtLayout>
    <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100 min-h-screen relative overflow-hidden">
      <!-- Subtle background blur circles (matching about page style) -->
      <div class="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div class="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-yellow-300/10 dark:bg-yellow-400/5 blur-3xl"></div>
        <div class="absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-400/5 dark:bg-purple-500/5 blur-3xl"></div>
      </div>

      <div class="relative max-w-4xl mx-auto px-4 py-16 md:py-24 flex flex-col items-center justify-center min-h-screen">
        <!-- Error Code -->
        <div class="mb-6">
          <p class="error-code text-8xl md:text-size-54 font-extrabold leading-none">
            {{ error?.statusCode || '500' }}
          </p>
        </div>

        <!-- Title -->
        <h1 class="text-3xl md:text-4xl lg:text-5xl font-serif font-800 text-center mb-4">
          {{ errorTitle }}
        </h1>

        <!-- Message -->
        <p class="font-body font-500 text-center text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mb-10">
          {{ errorMessage }}
        </p>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row gap-6 mb-12">
          <NButton
            btn="~"
            rounded="full"
            @click="handleError"
            class="px-6 py-5 bg-black dark:bg-white text-white 
              dark:text-black text-sm font-500 uppercase tracking-wide 
              rounded hover:bg-gray-800 dark:hover:bg-gray-200 
              hover:scale-x-104 active:scale-x-96
              transition flex items-center gap-2"
          >
            <div class="i-ph-house-bold w-4 h-4"></div>
            Go Home
          </NButton>
          <NButton
            btn="~"
            rounded="full"
            @click="$router.back()"
            class="px-6 py-5 border border-gray-300 dark:border-gray-700 
              text-sm font-500 uppercase tracking-wide rounded 
              hover:bg-gray-50 dark:hover:bg-gray-900 
              hover:scale-x-104 active:scale-x-96
              transition flex items-center gap-2"
          >
            <div class="i-ph-arrow-left-bold w-4 h-4"></div>
            Go Back
          </NButton>
        </div>

        <!-- Quick Links (for 404) -->
        <div v-if="is404" class="w-full max-w-2xl border-t border-gray-200/60 dark:border-gray-800/60 pt-10">
          <p class="text-center text-sm uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">
            Explore instead
          </p>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <NuxtLink
              v-for="link in quickLinks"
              :key="link.to"
              :to="link.to"
              class="p-4 rounded-xl transition-colors text-center group"
            >
              <div :class="link.icon" class="w-6 h-6 mx-auto mb-2 text-gray-600 dark:text-gray-400 group-hover:text-blue-500 transition-colors"></div>
              <p class="text-sm font-600 text-gray-700 dark:text-gray-200">{{ link.label }}</p>
            </NuxtLink>
          </div>
        </div>

        <!-- Debug Section (Admin Only) -->
        <div v-if="error?.stack && isAdmin" class="mt-12 w-full max-w-3xl">
          <details class="rounded-xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 overflow-hidden">
            <summary class="cursor-pointer px-6 py-4 text-sm font-600 uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2">
              <div class="i-ph-bug-duotone w-5 h-5"></div>
              Debug Info (Admin)
            </summary>
            <pre class="px-6 py-4 bg-gray-50 dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 overflow-x-auto border-t border-gray-200/60 dark:border-gray-800/60">{{ error.stack }}</pre>
          </details>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: Object as () => NuxtError
})

const { loggedIn, user } = useUserSession()

const handleError = () => clearError({ redirect: '/' })

const is404 = computed(() => props.error?.statusCode === 404)

const isAdmin = computed(() => {
  return loggedIn.value && user.value?.role === 'admin'
})

const errorTitle = computed(() => {
  if (is404.value) return 'Page Not Found'
  return 'Something Went Wrong'
})

const errorMessage = computed(() => {
  if (is404.value) {
    return 'The page you\'re looking for doesn\'t exist or has been moved.'
  }
  return props.error?.message || 'An unexpected error occurred. We\'re looking into it.'
})

const quickLinks = [
  { to: '/', label: 'Home', icon: 'i-ph-house-duotone' },
  { to: '/posts', label: 'Posts', icon: 'i-ph-newspaper-duotone' },
  { to: '/tags', label: 'Tags', icon: 'i-ph-tag-duotone' },
  { to: '/about', label: 'About', icon: 'i-ph-info-duotone' }
]
</script>

<style scoped>
.error-code {
  color: transparent;
  /* -webkit-text-stroke: 2px #e5e7eb; */
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

/* Optional: Add a subtle rainbow effect */
@keyframes stroke-rainbow {
  0% {
    -webkit-text-stroke-color: #FF8F8F;
  }
  25% {
    -webkit-text-stroke-color: #FFF1CB;
  }
  50% {
    -webkit-text-stroke-color: #C2E2FA;
  }
  75% {
    -webkit-text-stroke-color: #B7A3E3;
  }
  100% {
    -webkit-text-stroke-color: #FF8F8F;
  }
}
</style>
