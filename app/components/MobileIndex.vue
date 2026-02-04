<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
    <!-- Full-bleed featured hero with swipe navigation -->
    <FeaturedPostsHero class="h-[100vh] animate-entrance" />

    <!-- Stepped scroll content -->
    <section class="space-y-10 px-4 pb-16 animate-entrance">
      <MobileProjectsGrid />
      <RecentPostsGrid />
      <NewsletterSubscription />

      <div>
        <NButton btn="solid-blue" to="/donate" class="w-full py-6" rounded="6" label="Donate Now" trailing="i-ph-cursor-click-duotone" />
      </div>
    </section>
  </div>
</template>
