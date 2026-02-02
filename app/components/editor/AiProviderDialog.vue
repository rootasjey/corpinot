<template>
  <NDialog v-model:open="isOpen" :draggable="false">
    <NDialogContent class="max-w-lg">
      <NDialogHeader>
        <NDialogTitle>Configure AI provider</NDialogTitle>
        <NDialogDescription>Select which backend to use for AI writing. This affects the post editor only.</NDialogDescription>
      </NDialogHeader>

      <div class="grid gap-3 mt-4">
        <button
          type="button"
          class="provider-tile"
          :class="{ 'is-active': internalProvider === 'cloudflare' }"
          @click="setProvider('cloudflare')"
        >
          <div class="flex items-center gap-3">
            <span class="i-lucide-cloud" />
            <div class="text-left">
              <div class="font-semibold">Cloudflare Workers AI</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Fast defaults; translation/summarize stay on Cloudflare.</div>
            </div>
          </div>
          <span v-if="internalProvider === 'cloudflare'" class="i-ph-check-fat text-primary" />
        </button>

        <button
          type="button"
          class="provider-tile"
          :class="{ 'is-active': internalProvider === 'openrouter' }"
          @click="setProvider('openrouter')"
        >
          <div class="flex items-center gap-3">
            <span class="i-lucide-network" />
            <div class="text-left">
              <div class="font-semibold">OpenRouter</div>
              <div class="text-sm text-slate-600 dark:text-slate-400">Community models via OpenRouter (streaming completions).</div>
            </div>
          </div>
          <span v-if="internalProvider === 'openrouter'" class="i-ph-check-fat text-primary" />
        </button>
      </div>

      <NDialogFooter class="flex items-center justify-between gap-2 mt-6">
        <NuxtLink to="/settings/ai" class="text-sm text-slate-500 dark:text-slate-400 hover:underline">
          Manage models per action
        </NuxtLink>
        <div class="flex items-center gap-2">
          <NButton btn="ghost-gray" size="sm" @click="emit('update:open', false)">Cancel</NButton>
          <NButton btn="solid-blue" size="sm" class="min-w-24 font-600" @click="confirm">Save</NButton>
        </div>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ open: boolean; provider: 'cloudflare' | 'openrouter' }>()
const emit = defineEmits<{ 'update:open': [boolean]; 'update:provider': ['cloudflare' | 'openrouter'] }>()

const internalProvider = ref<'cloudflare' | 'openrouter'>(props.provider || 'cloudflare')

const isOpen = computed({
  get: () => props.open,
  set: (val: boolean) => emit('update:open', val),
})

watch(() => props.provider, (val) => {
  if (!val) return
  internalProvider.value = val
})

function setProvider(p: 'cloudflare' | 'openrouter') {
  internalProvider.value = p
}

function confirm() {
  emit('update:provider', internalProvider.value)
  emit('update:open', false)
}
</script>

<style scoped>
.provider-tile {
  @apply flex items-center justify-between gap-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm;
}
.provider-tile.is-active {
  @apply border-primary/60 shadow-sm;
}
</style>
