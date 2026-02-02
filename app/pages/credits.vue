<template>
  <section class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <header class="mb-10 text-center animate-entrance" style="animation-delay:80ms;">
      <h1 class="font-title text-4xl font-800 tracking-tight">Credits & Acknowledgments</h1>
      <p class="font-body mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        Huge thanks to the open-source projects, icon sets, fonts, and services that make this site possible.
      </p>
    </header>

    <div class="grid gap-6">
      <!-- Frameworks & Core -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:160ms;">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-700 mb-4">Frameworks & Core</h2>
          <ul class="grid sm:grid-cols-2 gap-3 font-body font-500 text-gray-700 dark:text-gray-200">
            <li>
              <a href="https://nuxt.com" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">Nuxt 4</a>
              <span class="color-gray-400"> — app framework (server routes via Nitro)</span>
            </li>
            <li>
              <a href="https://vuejs.org" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">Vue 3</a>
              <span class="color-gray-400"> — UI runtime</span>
            </li>
            <li>
              <a href="https://pinia.vuejs.org" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">Pinia</a>
              <span class="color-gray-400"> — state management</span>
            </li>
            <li>
              <a href="https://router.vuejs.org" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">Vue Router</a>
              <span class="color-gray-400"> — routing</span>
            </li>
            <li>
              <a href="https://image.nuxt.com" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">@nuxt/image</a>
              <span class="color-gray-400"> — image optimization</span>
            </li>
            <li>
              <a href="https://github.com/atinux/nuxt-auth-utils" target="_blank" rel="noopener" class="font-700 hover:underline decoration-offset-4 hover:text-primary-600">nuxt-auth-utils</a>
              <span class="color-gray-400"> — auth helpers</span>
            </li>
          </ul>
        </div>
      </NCard>

      <!-- Platform & Data -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:220ms;">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-700 mb-4">Platform & Data</h2>
          <ul class="grid sm:grid-cols-2 gap-3 font-body font-500 text-gray-700 dark:text-gray-200">
            <li>
              <a href="https://hub.nuxt.com" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">@nuxthub/core</a>
              <span class="color-gray-400"> — blob, cache, database, kv, browser features</span>
            </li>
            <li>
              <a href="https://developers.cloudflare.com/workers/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Cloudflare tooling</a>
              <span class="color-gray-400"> — Wrangler and Workers-compatible utilities</span>
            </li>
          </ul>
        </div>
      </NCard>

      <!-- UI & Styling -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:280ms;">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-700 mb-4">UI & Styling</h2>
          <ul class="grid sm:grid-cols-2 gap-3 font-body font-500 text-gray-700 dark:text-gray-200">
            <li>
              <a href="https://una-ui.com" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Una UI</a>
              <span class="color-gray-400"> — component primitives (prefix N)</span>
            </li>
            <li>
              <a href="https://unocss.dev" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">UnoCSS</a>
              <span class="color-gray-400"> — utility-first CSS with Wind3, Attributify, Tagify, Icons & Animations presets</span>
            </li>
            <li>
              <a href="https://iconify.design" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Iconify</a>
              <span class="color-gray-400"> — icon system; Packs: Phosphor, Lucide, Tabler, Radix Icons, Line-MD</span>
            </li>
            <li>
              <a href="https://www.fontshare.com/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Fontshare</a>
              <span class="color-gray-400"> — webfonts: Clash Display, General Sans, Satoshi, Zodiak</span>
            </li>
            <li>
              <a href="https://color-mode.nuxtjs.org/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">@nuxtjs/color-mode</a>
              <span class="color-gray-400"> — light/dark theme</span>
            </li>
            <li>
              <a href="https://woords.trexthemes.dev/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Woords template</a>
              <span class="color-gray-400"> — layout inspiration</span>
            </li>
          </ul>
        </div>
      </NCard>

      <!-- Content & Editing -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:340ms;">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-700 mb-4">Content & Editing</h2>
          <ul class="grid sm:grid-cols-2 gap-3 font-body font-500 text-gray-700 dark:text-gray-200">
            <li>
              <a href="https://tiptap.dev/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Tiptap</a>
              <span class="color-gray-400"> — rich‑text editor and extensions</span>
            </li>
            <li>
              <a href="https://github.com/jimp-dev/jimp" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Jimp</a>
              <span class="color-gray-400"> — image manipulation</span>
            </li>
            <li>
              <a href="https://pptr.dev/" target="_blank" rel="noopener" class="font-600 hover:underline decoration-offset-4 hover:text-primary-600">Puppeteer</a>
              <span class="color-gray-400"> — automation tools (and Cloudflare-compatible build)</span>
            </li>
          </ul>
        </div>
      </NCard>

      <!-- Images & Media Pipeline -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:400ms;">
        <div class="p-6 sm:p-8">
          <h2 class="text-xl font-700 mb-4">Images & Media Pipeline</h2>
          <ul class="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            <li v-for="item in pexelsAttributions" :key="item.href">
              <NTooltip :_tooltipContent="{ side: 'top', sideOffset: 8, align: 'center' }" :_tooltipProvider="{ delayDuration: 300 }">
                <template #default>
                  <a :href="item.href" target="_blank" rel="noopener" class="block group">
                    <NuxtImg
                      :src="item.src"
                      width="80"
                      height="80"
                      :alt="item.alt"
                      class="w-16 h-16 rounded-md object-cover ring-1 ring-gray-200 dark:ring-gray-800 group-hover:ring-primary-500 transition-colors"
                    />
                    <span class="sr-only">{{ item.caption }}</span>
                  </a>
                </template>
                <template #content>
                  <span class="text-xs font-600">{{ item.caption }}</span>
                </template>
              </NTooltip>
            </li>
          </ul>
        </div>
      </NCard>

      <!-- Thank you -->
      <NCard class="p-0 overflow-hidden animate-entrance" style="animation-delay:460ms;">
        <div class="p-6 sm:p-8">
          <h2 class="font-text text-xl font-700 mb-4">Thank you</h2>
          <p class="font-body font-500 text-gray-700 dark:text-gray-200">
            We're grateful to all maintainers, contributors, and communities behind these tools and services.
            If we missed anyone, please let us know and we'll add the credit.
          </p>
        </div>
      </NCard>
    </div>
  </section>
</template>

<script setup lang="ts">
type Attribution = {
  href: string
  src: string
  alt: string
  caption: string
}

const pexelsAttributions: Attribution[] = [
  {
    href: 'https://www.pexels.com/fr-fr/photo/deux-personnes-sur-la-falaise-de-la-montagne-1647962/',
    src: 'https://images.pexels.com/photos/1647962/pexels-photo-1647962.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Valdemaras D. on Pexels',
    caption: 'Photo by Valdemaras D. — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/en-bois-bois-figurine-ligne-7422438/',
    src: 'https://images.pexels.com/photos/7422438/pexels-photo-7422438.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Ann H on Pexels (wood figurine)',
    caption: 'Photo by Ann H — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/mon-plan-secret-pour-diriger-le-livre-du-monde-1765033/',
    src: 'https://images.pexels.com/photos/1765033/pexels-photo-1765033.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Ann H on Pexels (book)',
    caption: 'Photo by Ann H — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/bureau-en-bois-brun-159618/',
    src: 'https://images.pexels.com/photos/159618/still-life-school-retro-ink-159618.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by Pixabay on Pexels (desk)',
    caption: 'Photo by Pixabay — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/panneau-de-bienvenue-en-acier-noir-1406282/',
    src: 'https://images.pexels.com/photos/1406282/pexels-photo-1406282.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo by H&CO on Pexels (welcome sign)',
    caption: 'Photo by H&CO — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/gros-plan-sur-la-photo-du-jeu-de-societe-monopoly-776654/',
    src: 'https://images.pexels.com/photos/776654/pexels-photo-776654.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Ylanite Koppens',
    caption: 'Photo by Ylanite Koppens — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/brouiller-echecs-strategie-jeu-de-plateau-8780204/',
    src: 'https://images.pexels.com/photos/8780204/pexels-photo-8780204.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Ana-Maria Antonenco',
    caption: 'Photo by Ana-Maria Antonenco — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/nature-morte-profondeur-de-champ-photographie-macro-photo-macro-2993940/',
    src: 'https://images.pexels.com/photos/2993940/pexels-photo-2993940.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Jonathan Robles',
    caption: 'Photo by Jonathan Robles — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/vue-aerienne-du-terrain-de-football-1171084/',
    src: 'https://images.pexels.com/photos/1171084/pexels-photo-1171084.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Mike',
    caption: 'Photo by Mike — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/blocs-lego-vert-rouge-et-jaune-168866/',
    src: 'https://images.pexels.com/photos/168866/pexels-photo-168866.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Markus Spiske',
    caption: 'Photo by Markus Spiske — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/2157805/',
    src: 'https://images.pexels.com/photos/2157805/pexels-photo-2157805.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de byMALENS',
    caption: 'Photo de byMALENS — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/abstrait-de-mur-avec-ornement-geometrique-3695238/',
    src: 'https://images.pexels.com/photos/3695238/pexels-photo-3695238.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Damir Mijailovic',
    caption: 'Photo de Damir Mijailovic — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/creatif-texture-colore-orange-4202952/',
    src: 'https://images.pexels.com/photos/4202952/pexels-photo-4202952.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Karola G',
    caption: 'Photo de Karola G — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/avion-commercial-dans-un-ciel-bleu-clair-33260741/',
    src: 'https://images.pexels.com/photos/33260741/pexels-photo-33260741.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Jr  Satilite',
    caption: 'Photo de Jr  Satilite — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/ecole-de-meduses-sous-l-eau-1683724/',
    src: 'https://images.pexels.com/photos/1683724/pexels-photo-1683724.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Valdemaras D.',
    caption: 'Photo de Valdemaras D. — Pexels',
  },
  {
    href: 'https://www.pexels.com/fr-fr/photo/les-gens-au-desert-pendant-la-nuit-1703316/',
    src: 'https://images.pexels.com/photos/1703316/pexels-photo-1703316.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=120&h=120',
    alt: 'Photo de Tomáš Malík',
    caption: 'Photo de Tomáš Malík — Pexels',
  },
]

definePageMeta({
  title: 'Credits',
  description: 'Acknowledgments for the open-source tools, fonts, icons, and services used in this project.',
})
</script>

<style scoped>
.animate-entrance {
  opacity: 0;
  transform: translateY(8px) scale(0.996);
  animation: entrance 640ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
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
