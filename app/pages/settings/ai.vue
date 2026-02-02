<template>
  <div class="bg-white dark:bg-gray-950 text-gray-800 dark:text-gray-100">
    <div class="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-slate-500 dark:text-slate-400">
            <NuxtLink to="/settings" class="inline-flex items-center gap-2 hover:underline">
              <span class="i-ph-arrow-left" aria-hidden="true" />
              <span>Settings</span>
            </NuxtLink>
          </div>
          <h1 class="text-2xl font-bold mt-1">AI settings</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Choose the default provider and override models per action. Translation and summaries always use Cloudflare.
          </p>
        </div>
      </div>

      <section class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <div class="font-semibold">Default provider</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Used for actions except translate and summarize.</div>
          </div>
          <NBadge badge="soft" color="primary">{{ provider }}</NBadge>
        </div>

        <div class="grid gap-3 mt-4">
          <button
            type="button"
            class="flex items-center justify-between gap-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            :class="{ 'border-primary/60 shadow-sm': provider === 'cloudflare' }"
            @click="setProvider('cloudflare')"
          >
            <div class="flex items-center gap-3">
              <span class="i-lucide-cloud" />
              <div class="text-left">
                <div class="font-semibold">Cloudflare Workers AI</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Fast defaults; translation/summarize stay on Cloudflare.</div>
              </div>
            </div>
            <span v-if="provider === 'cloudflare'" class="i-ph-check-fat text-primary" />
          </button>

          <button
            type="button"
            class="flex items-center justify-between gap-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-left transition-all hover:border-primary/40 hover:shadow-sm"
            :class="{ 'border-primary/60 shadow-sm': provider === 'openrouter' }"
            @click="setProvider('openrouter')"
          >
            <div class="flex items-center gap-3">
              <span class="i-lucide-network" />
              <div class="text-left">
                <div class="font-semibold">OpenRouter</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Community models via OpenRouter (streaming completions).</div>
              </div>
            </div>
            <span v-if="provider === 'openrouter'" class="i-ph-check-fat text-primary" />
          </button>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">Cloudflare models</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Used for translate/summarize and when Cloudflare is the provider.</div>
          </div>
          <NButton btn="ghost-gray" size="xs" @click="resetModels('cloudflare')">Reset</NButton>
        </div>

        <div class="space-y-3">
          <div v-for="action in actions" :key="`cf-${action.key}`" class="rounded-xl border border-border bg-background p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="font-medium">{{ action.label }}</div>
                <div class="text-sm text-slate-500 dark:text-slate-400">{{ action.description }}</div>
              </div>
              <NBadge v-if="action.key === 'translate' || action.key === 'summarize'" badge="soft" color="primary">Always CF</NBadge>
            </div>
            <NInput
              v-model="cloudflareModels[action.key]"
              input="outline"
              class="mt-3"
              placeholder="@cf/..."
            />
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-950/60 p-4 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="font-semibold">OpenRouter models</div>
            <div class="text-sm text-slate-500 dark:text-slate-400">Used when OpenRouter is the provider.</div>
          </div>
          <NButton btn="ghost-gray" size="xs" @click="resetModels('openrouter')">Reset</NButton>
        </div>

        <div class="space-y-3">
          <div v-for="action in actions" :key="`or-${action.key}`" class="rounded-xl border border-border bg-background p-3">
            <div>
              <div class="font-medium">{{ action.label }}</div>
              <div class="text-sm text-slate-500 dark:text-slate-400">{{ action.description }}</div>
            </div>
            <NInput
              v-model="openrouterModels[action.key]"
              input="outline"
              class="mt-3"
              placeholder="openrouter/model:variant"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AI_ACTIONS, useAISettings } from '~/composables/useAISettings'

useSeoMeta({ title: 'AI settings — Corpinot' })

const actions = AI_ACTIONS
const { provider, cloudflareModels, openrouterModels, resetModels } = useAISettings()

function setProvider(next: 'cloudflare' | 'openrouter') {
  provider.value = next
}
</script>
