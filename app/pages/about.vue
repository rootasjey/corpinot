<template>
  <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
    <section class="max-w-7xl mx-auto px-6 py-28">
      <div class="grid md:grid-cols-2 gap-12 items-center">
        <!-- Typographic hero -->
        <div class="order-2 md:order-1">
          <div class="inline-flex items-center gap-3 mb-6">
            <p class="uppercase tracking-widest text-xs md:text-sm font-500 text-gray-700 dark:text-gray-400">{{ $t('pages.about.heading') }}</p>
            <span class="inline-flex items-center text-xs bg-gray-100 dark:bg-gray-800 font-600 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1">v{{ appVersion }}</span>
          </div>

          <h1 class="font-title font-extrabold text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tighter text-slate-900 dark:text-white animate-entrance" style="animation-delay:80ms;">{{ $t('pages.about.mainTitle') }}</h1>

          <p class="mt-6 text-lg md:text-xl text-gray-700 dark:text-gray-300 max-w-2xl animate-entrance" style="animation-delay:220ms;">{{ $t('pages.about.intro') }}</p>

          <div class="mt-8 flex flex-wrap items-center gap-3 animate-entrance" style="animation-delay:360ms;">
            <NuxtLink to="/posts" class="btn btn-lg inline-flex items-center gap-2">{{ $t('pages.about.browsePosts') }}</NuxtLink>
            <a href="https://github.com/rootasjey/corpinot" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm underline underline-offset-4">{{ $t('pages.about.openSource') }} <span class="i-ph-github-logo w-4 h-4"></span></a>
          </div>

          <div class="mt-10 grid grid-cols-3 gap-4 max-w-md">
            <div class="text-sm font-semibold">Technology</div>
            <div class="text-sm font-semibold">Programming</div>
            <div class="text-sm font-semibold">Films & Books</div>
          </div>

          <div class="mt-8 text-sm text-gray-500 dark:text-gray-400 max-w-md">{{ $t('pages.about.description') }}</div>

          <!-- Metrics -->
          <div class="mt-8">
            <div class="grid grid-cols-3 gap-6">
              <div class="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/40 text-center animate-entrance" style="animation-delay:420ms;">
                <div class="text-center p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/40 animate-entrance" style="animation-delay:420ms;">
                <div ref="postsEl" class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white" aria-live="polite">{{ postsCount.display }}</div>
                <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ $t('pages.about.metricsPublished') }}</div>
                </div>
              </div>

              <div class="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/40 text-center animate-entrance" style="animation-delay:560ms;">
                <div ref="projectsEl" class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white" aria-live="polite">{{ projectsCount.display }}</div>
                <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ $t('pages.about.metricsProjects') }}</div>
              </div>

              <div class="p-4 rounded-xl bg-white/60 dark:bg-gray-900/40 border border-gray-200/40 text-center animate-entrance" style="animation-delay:700ms;">
                <div ref="authorsEl" class="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white" aria-live="polite">{{ authorsCount.display }}</div>
                <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ $t('pages.about.metricsAuthors') }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Cover image -->
        <div class="order-1 md:order-2">
          <div class="relative rounded-3xl overflow-hidden shadow-2xl">
            <NuxtImg src="/images/corpinot-cover.jpeg" :alt="$t('pages.about.coverAlt')" class="w-full h-80 object-cover md:h-[36rem] lg:h-[44rem]" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent mix-blend-multiply"></div>
            <div class="absolute bottom-6 left-6 text-white">
              <div class="text-sm uppercase tracking-widest">{{ $t('pages.about.overlayLabel') }}</div>
              <div class="text-lg font-semibold">{{ $t('pages.about.overlaySub') }}</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-10 border-t border-gray-200/60 dark:border-gray-800/60">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-8xl font-serif font-bold">{{ $t('pages.about.openSourceHeading') }}</h2>
        <p class="mt-3 text-gray-600 dark:text-gray-300">{{ $t('pages.about.openSourceText') }}</p>
      </div>
    </section>

    <section class="py-12 border-t border-gray-200/60 dark:border-gray-800/60">
      <div class="max-w-7xl mx-auto px-4">
        <h2 class="text-8xl font-serif font-bold mb-6">{{ $t('pages.about.faqHeading') }}</h2>

        <NAccordion type="single" default-value="q1" accordion="divider border" class="bg-transparent text-2xl">
          <NAccordionItem value="q1" :label="$t('pages.about.faqWhoLabel')">
            <template #content>
              <p class="mt-2 text-gray-600 dark:text-gray-300">{{ $t('pages.about.faqWhoContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem value="q2" :label="$t('pages.about.faqTopicsLabel')">
            <template #content>
              <p class="mt-2 text-gray-600 dark:text-gray-300">{{ $t('pages.about.faqTopicsContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem value="q3" :label="$t('pages.about.faqOpenSourceLabel')">
            <template #content>
              <p class="mt-2 text-gray-600 dark:text-gray-300">{{ $t('pages.about.faqOpenSourceContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem value="q4" :label="$t('pages.about.faqContributeLabel')">
            <template #content>
              <p class="mt-2 text-gray-600 dark:text-gray-300">{{ $t('pages.about.faqContributeContent') }}</p>
            </template>
          </NAccordionItem>

          <NAccordionItem value="q5" :label="$t('pages.about.faqNewsletterLabel')">
            <template #content>
              <p class="mt-2 text-gray-600 dark:text-gray-300">{{ $t('pages.about.faqNewsletterContent') }}</p>
            </template>
          </NAccordionItem>
        </NAccordion>
      </div>
    </section>

    <NewsletterSubscription />

    <section class="py-12">
      <div class="max-w-4xl mx-auto px-4 text-center">
        <h2 class="text-2xl font-serif font-bold">{{ $t('pages.about.contactHeading') }}</h2>
        <p class="mt-3 text-gray-600 dark:text-gray-300">{{ $t('pages.about.contactText') }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()
const config = useRuntimeConfig()

useSeoMeta({
  title: $t('pages.about.metaTitle'),
  ogTitle: $t('pages.about.metaTitle'),
  description: $t('pages.about.metaDescription'),
  ogDescription: $t('pages.about.metaDescription'),
  ogUrl: `${config.public.siteUrl}/about`,
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl}/about` }],
})
const appVersion = (config.public?.appVersion as string) || '0.0.0'

// fetch small site stats for metrics
const { data: stats, pending: statsPending, error: statsError } = await useFetch('/api/stats')

import { ref, computed } from 'vue'
import { useCountUp } from '~/composables/useCountUp'

// refs to attach to DOM nodes so animation starts on intersection
const postsEl = ref<HTMLElement | null>(null)
const projectsEl = ref<HTMLElement | null>(null)
const authorsEl = ref<HTMLElement | null>(null)

// composable instances
const postsCount = useCountUp(postsEl, computed(() => stats?.value?.posts))
const projectsCount = useCountUp(projectsEl, computed(() => stats?.value?.projects))
const authorsCount = useCountUp(authorsEl, computed(() => stats?.value?.authorsWithPosts ?? stats?.value?.authorsTotal))

function formatNumber(n: number | undefined | null) {
  if (n === null || n === undefined) return '—'
  return new Intl.NumberFormat().format(n)
}
</script>

<style scoped>
/* subtle entrance animation */
.animate-entrance {
  opacity: 0;
  transform: translateY(8px) scale(0.996);
  animation: entrance 640ms cubic-bezier(0.2,0.9,0.2,1) forwards;
}

@keyframes entrance {
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-entrance {
    transition: none !important;
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
</style>
