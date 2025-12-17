<template>
  <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none select-none" aria-hidden="true">
        <div class="absolute -top-40 -right-20 w-[36rem] h-[36rem] rounded-full bg-yellow-300/20 blur-3xl"></div>
        <div class="absolute -bottom-40 -left-20 w-[36rem] h-[36rem] rounded-full bg-purple-400/10 blur-3xl"></div>
      </div>
      <div class="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div class="flex items-center gap-4">
          <p class="uppercase tracking-widest text-xs md:text-sm text-gray-500 dark:text-gray-400">ABOUT</p>
          <p class="uppercase tracking-widest text-xs md:text-sm font-500 text-gray-500 dark:text-gray-400">v{{ appVersion }}</p>
        </div>
        <h1 class="font-title text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
          We're Woords — crafted for curious minds and creative builders.
        </h1>
        <p class="mt-6 max-w-2xl text-base md:text-lg text-gray-600 dark:text-gray-300">
          Our mission is simple: publish sharp, practical ideas — and make them delightful to read. No fluff. No clickbait. Just signal.
        </p>
      </div>
    </section>

    <!-- Intro split -->
    <section class="py-10 md:py-16">
      <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 class="text-2xl md:text-3xl font-serif font-bold mb-4">What we do</h2>
          <p class="text-gray-600 dark:text-gray-300 leading-relaxed">
            We cover engineering, product, design, AI, and the systems that power modern software. Expect weekly deep-dives, practical tutorials, and thoughtful takes on what matters next.
          </p>
          <ul class="mt-6 space-y-3 text-gray-700 dark:text-gray-200">
            <li class="flex items-start gap-3"><div class="i-ph-check-circle-duotone text-yellow-500 w-5 h-5 mt-0.5"></div><span>Hands‑on guides and patterns you can use today</span></li>
            <li class="flex items-start gap-3"><div class="i-ph-check-circle-duotone text-yellow-500 w-5 h-5 mt-0.5"></div><span>Interviews with practitioners building real products</span></li>
            <li class="flex items-start gap-3"><div class="i-ph-check-circle-duotone text-yellow-500 w-5 h-5 mt-0.5"></div><span>Opinionated essays — data‑informed, never dogmatic</span></li>
          </ul>
        </div>
        <div class="relative">
          <div class="aspect-[4/3] rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 border border-gray-200/60 dark:border-gray-800/60 flex items-center justify-center">
            <div class="text-center px-6">
              <div class="i-ph-newspaper-duotone w-16 h-16 text-gray-400 mx-auto mb-4"></div>
              <p class="text-gray-500 dark:text-gray-400">Stories, guides, and ideas — carefully edited and beautifully presented.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="py-10 md:py-16 border-y border-gray-200/60 dark:border-gray-800/60 bg-gray-50/60 dark:bg-gray-900/40">
      <div class="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 text-center">
        <div>
          <div class="text-3xl md:text-4xl font-extrabold">250+</div>
          <div class="mt-1 text-xs uppercase tracking-widest text-gray-500">Posts</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-extrabold">120k</div>
          <div class="mt-1 text-xs uppercase tracking-widest text-gray-500">Monthly readers</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-extrabold">35</div>
          <div class="mt-1 text-xs uppercase tracking-widest text-gray-500">Contributors</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl font-extrabold">48</div>
          <div class="mt-1 text-xs uppercase tracking-widest text-gray-500">Countries</div>
        </div>
      </div>
    </section>

    <!-- Values -->
    <section class="py-10 md:py-16">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-serif font-bold mb-8">What we believe</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="i-ph-target-duotone text-yellow-500 w-7 h-7"></div>
            <h3 class="mt-3 font-bold text-lg">Signal over noise</h3>
            <p class="mt-2 text-gray-600 dark:text-gray-300">We value clarity and depth. If it’s not useful or delightful, it doesn’t ship.</p>
          </div>
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="i-ph-lightbulb-duotone text-yellow-500 w-7 h-7"></div>
            <h3 class="mt-3 font-bold text-lg">Curiosity wins</h3>
            <p class="mt-2 text-gray-600 dark:text-gray-300">We chase good questions and follow them wherever they lead.</p>
          </div>
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="i-ph-hand-heart-duotone text-yellow-500 w-7 h-7"></div>
            <h3 class="mt-3 font-bold text-lg">Respect readers</h3>
            <p class="mt-2 text-gray-600 dark:text-gray-300">Your time is precious. We edit ruthlessly and design for calm.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline -->
    <section class="py-10 md:py-16 border-t border-gray-200/60 dark:border-gray-800/60">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-serif font-bold mb-8">Our path</h2>
        <ol class="relative border-s border-gray-200 dark:border-gray-800 ml-1">
          <li class="mb-10 ms-6">
            <span class="absolute -start-3 flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full ring-8 ring-white dark:ring-gray-900"></span>
            <h3 class="font-semibold">2023 — The spark</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-1">We launched Woords to explore modern product, engineering, and AI in public.</p>
          </li>
          <li class="mb-10 ms-6">
            <span class="absolute -start-3 flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full ring-8 ring-white dark:ring-gray-900"></span>
            <h3 class="font-semibold">2024 — Growing with readers</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Introduced weekly digests and opened to guest contributors.</p>
          </li>
          <li class="mb-10 ms-6">
            <span class="absolute -start-3 flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full ring-8 ring-white dark:ring-gray-900"></span>
            <h3 class="font-semibold">2025 — Beyond posts</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Publishing playbooks and mini‑courses, focused on pragmatic craft.</p>
          </li>
          <li class="ms-6">
            <span class="absolute -start-3 flex items-center justify-center w-6 h-6 bg-yellow-400 rounded-full ring-8 ring-white dark:ring-gray-900"></span>
            <h3 class="font-semibold">Next — Where you come in</h3>
            <p class="text-gray-600 dark:text-gray-300 mt-1">Have a story or idea? We’d love to hear it.</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Team -->
    <section class="py-10 md:py-16">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-serif font-bold mb-8">Team</h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 text-black font-bold grid place-items-center">RJ</div>
            <h3 class="mt-4 font-semibold">Root Asjey</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Editor & Engineer</p>
          </div>
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 text-black font-bold grid place-items-center">GP</div>
            <h3 class="mt-4 font-semibold">Guest Partners</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Contributors</p>
          </div>
          <div class="p-6 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60">
            <div class="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-black font-bold grid place-items-center">YC</div>
            <h3 class="mt-4 font-semibold">You, the Community</h3>
            <p class="text-sm text-gray-600 dark:text-gray-300">Ideas, feedback, and support</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-10 md:py-16 border-t border-gray-200/60 dark:border-gray-800/60">
      <div class="max-w-6xl mx-auto px-4">
        <h2 class="text-2xl md:text-3xl font-serif font-bold mb-8">FAQ</h2>
        <div class="space-y-4">
          <details class="group rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-5">
            <summary class="cursor-pointer list-none flex items-center justify-between">
              <span class="font-medium">Can I pitch an article?</span>
              <div class="i-ph-caret-down group-open:rotate-180 transition-transform"></div>
            </summary>
            <p class="mt-3 text-gray-600 dark:text-gray-300">Absolutely. Share a one‑paragraph outline and why it matters. We welcome practical, original ideas.</p>
          </details>
          <details class="group rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-5">
            <summary class="cursor-pointer list-none flex items-center justify-between">
              <span class="font-medium">Do you accept sponsorships?</span>
              <div class="i-ph-caret-down group-open:rotate-180 transition-transform"></div>
            </summary>
            <p class="mt-3 text-gray-600 dark:text-gray-300">Selective, relevant sponsors only — tools we’d personally use and recommend.</p>
          </details>
          <details class="group rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-5">
            <summary class="cursor-pointer list-none flex items-center justify-between">
              <span class="font-medium">Is there a newsletter?</span>
              <div class="i-ph-caret-down group-open:rotate-180 transition-transform"></div>
            </summary>
            <p class="mt-3 text-gray-600 dark:text-gray-300">Yes — weekly highlights and bonuses. Subscribe below.</p>
          </details>
        </div>
      </div>
    </section>

    <!-- Newsletter CTA -->
    <NewsletterSubscription />

    <!-- Contact CTA -->
    <section class="py-14">
      <div class="max-w-3xl mx-auto px-4 text-center">
        <h2 class="text-2xl md:text-3xl font-serif font-bold">Say hello</h2>
        <p class="mt-3 text-gray-600 dark:text-gray-300">Questions, pitches, ideas? Email us at
          <a href="mailto:hello@corpinot.cc" class="underline decoration-yellow-400 underline-offset-4">hello@corpinot.cc</a>
        </p>
      </div>
    </section>

    <section class="py-6">
      <div class="max-w-6xl mx-auto px-4 text-center">
        <p class="text-sm text-gray-500 dark:text-gray-400">Version v{{ appVersion }}</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'About — Woords',
  ogTitle: 'About — Woords',
  description: 'Who we are, what we publish, and how we work. Meet Woords.',
  ogDescription: 'Who we are, what we publish, and how we work. Meet Woords.',
})

const config = useRuntimeConfig()
const appVersion = (config.public?.appVersion as string) || '0.0.0'
</script>
