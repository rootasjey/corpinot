<template>
  <NuxtImg :provider="provider" :src="src" :alt="alt" v-bind="imgAttrs" />
</template>

<script setup lang="ts">
const props = defineProps<{
  src?: string
  alt?: string
}>()

import { computed, useAttrs } from 'vue'

const attrs = useAttrs()

// Respect explicit provider if passed via attrs, otherwise infer from src
const provider = computed(() => {
  if ((attrs as any).provider) return (attrs as any).provider as string
  const s = props.src ?? ''
  return s.startsWith('/posts/') ? 'hubblob' : undefined
})

// Provide sensible defaults but allow callers to override via attributes
const imgAttrs = computed(() => ({
  // default to lazy loading for non-critical images
  loading: (attrs as any).loading ?? 'lazy',
  decoding: (attrs as any).decoding ?? 'async',
  // prefer webp by default for modern browsers; caller can override
  format: (attrs as any).format ?? 'webp',
  // fallback quality
  quality: (attrs as any).quality ?? 75,
  // spread remaining attrs (including width/height/class etc.)
  ...(attrs as Record<string, unknown>),
}))
</script>
