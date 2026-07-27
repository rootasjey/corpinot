<template>
  <footer class="bg-[#F8F9FA] text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-t border-gray-200 dark:border-gray-800 py-4 md:py-10">
    <div class="container mx-auto px-4">
      <!-- Compact mobile row -->
      <div class="md:hidden flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-wide">
        <NuxtLink to="/" class="inline-flex items-baseline gap-1 select-none text-sm font-title font-bold leading-none">{{ $t('nav.brand') }}</NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/about" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.about') }}</NuxtLink>
          <NuxtLink to="/credits" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.credits') }}</NuxtLink>
        </div>
        <span class="text-gray-500 dark:text-gray-400">v{{ appVersion }}</span>
      </div>

      <!-- Full footer for md+ -->
      <div class="hidden md:block">
        <!-- Brand -->
        <div class="flex items-center justify-center">
          <NuxtLink to="/" class="inline-flex items-baseline gap-1 select-none">
            <span class="text-3xl md:text-4xl font-title font-bold leading-none">{{ $t('nav.brand') }}</span>
          </NuxtLink>
        </div>

        <!-- Navigation Links -->
        <nav class="mt-6 md:mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs md:text-sm font-semibold uppercase tracking-wide">
          <NuxtLink to="/signup" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.signup') }}</NuxtLink>
          <NuxtLink to="/signin" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.signin') }}</NuxtLink>
          <NuxtLink to="https://github.com/rootasjey/corpinot" external target="_blank" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.gitHubRepository') }}</NuxtLink>
          <NuxtLink to="/about" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.about') }}</NuxtLink>
          <NuxtLink to="/credits" class="hover:text-black dark:hover:text-white transition-colors">{{ $t('footer.credits') }}</NuxtLink>
        </nav>

        <!-- Divider -->
        <div class="mt-8 md:mt-10 border-t border-gray-200 dark:border-gray-800"></div>

        <!-- Copyright -->
        <div class="font-500 text-center text-xs md:text-sm text-gray-400 dark:text-gray-400 mt-6">
          © {{ currentYear }}
          <NuxtLink to="https://github.com/rootasjey" external target="_blank" class="hover:text-black dark:hover:text-white transition-colors">Jérémie CORPINOT</NuxtLink>.
          {{ $t('nav.tagline') }}
          <div class="mt-1 text-xs text-gray-400 dark:text-gray-500">v{{ appVersion }}</div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
const config = useRuntimeConfig()
const appVersion = (config.public?.appVersion as string) || '0.0.0'
</script>
