<template>
  <div class="rounded-2xl border border-border overflow-hidden">
    <div class="h-36 bg-gradient-to-br from-(slate-200/60 dark:slate-800/60) to-transparent animate-pulse" />
    <div class="p-4 space-y-2">
      <div class="h-5 w-3/4 rounded bg-(slate-200/60 dark:slate-800/60) animate-pulse" />
      <div v-for="i in (lines ?? 2)" :key="i" class="h-4 w-full rounded bg-(slate-200/60 dark:slate-800/60) animate-pulse" />
    </div>
  </div>
</template>
<script setup lang="ts">
withDefaults(defineProps<{ lines?: number }>(), { lines: 2 })
</script>
