import { computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { AIAction } from '~/composables/useAIWriter'

export type AIProvider = 'cloudflare' | 'openrouter'

export const AI_ACTIONS: { key: AIAction; label: string; description: string }[] = [
  { key: 'fix', label: 'Fix grammar', description: 'Correct grammar, spelling, and punctuation while keeping tone.' },
  { key: 'shorten', label: 'Make shorter', description: 'Condense the selected text without losing meaning.' },
  { key: 'continue', label: 'Continue writing', description: 'Continue from the cursor with consistent tone.' },
  { key: 'summarize', label: 'Summarize', description: 'Summarize selected text into a concise version.' },
  { key: 'translate', label: 'Translate', description: 'Translate selected text to another language.' },
  { key: 'ask', label: 'Ask', description: 'Respond to a prompt or question.' },
]

const DEFAULT_MODELS: Record<AIProvider, Record<AIAction, string>> = {
  cloudflare: {
    fix: '@cf/meta/llama-2-7b-chat-int8',
    shorten: '@cf/meta/llama-2-7b-chat-int8',
    continue: '@cf/meta/llama-2-7b-chat-int8',
    summarize: '@cf/meta/llama-2-7b-chat-int8',
    translate: '@cf/meta/llama-2-7b-chat-int8',
    ask: '@cf/meta/llama-2-7b-chat-int8',
  },
  openrouter: {
    fix: 'mistralai/devstral-2512:free',
    shorten: 'mistralai/devstral-2512:free',
    continue: 'mistralai/devstral-2512:free',
    summarize: 'mistralai/devstral-2512:free',
    translate: 'mistralai/devstral-2512:free',
    ask: 'mistralai/devstral-2512:free',
  },
}

function normalizeModels(value: Record<AIAction, string> | undefined, provider: AIProvider) {
  return {
    ...DEFAULT_MODELS[provider],
    ...(value || {}),
  }
}

export function useAISettings() {
  const provider = useStorage<AIProvider>('ai-provider', 'cloudflare')
  const cloudflareModels = useStorage<Record<AIAction, string>>('ai-models-cloudflare', DEFAULT_MODELS.cloudflare)
  const openrouterModels = useStorage<Record<AIAction, string>>('ai-models-openrouter', DEFAULT_MODELS.openrouter)

  cloudflareModels.value = normalizeModels(cloudflareModels.value, 'cloudflare')
  openrouterModels.value = normalizeModels(openrouterModels.value, 'openrouter')

  const modelsByProvider = computed(() => ({
    cloudflare: cloudflareModels.value,
    openrouter: openrouterModels.value,
  }))

  const getModelForAction = (action: AIAction, providerForAction: AIProvider) => {
    const models = modelsByProvider.value[providerForAction]
    return models[action] || DEFAULT_MODELS[providerForAction][action]
  }

  const setModelForAction = (providerForAction: AIProvider, action: AIAction, model: string) => {
    if (providerForAction === 'cloudflare') {
      cloudflareModels.value = { ...cloudflareModels.value, [action]: model }
      return
    }
    openrouterModels.value = { ...openrouterModels.value, [action]: model }
  }

  const resetModels = (providerForAction?: AIProvider) => {
    if (!providerForAction || providerForAction === 'cloudflare') {
      cloudflareModels.value = { ...DEFAULT_MODELS.cloudflare }
    }
    if (!providerForAction || providerForAction === 'openrouter') {
      openrouterModels.value = { ...DEFAULT_MODELS.openrouter }
    }
  }

  return {
    provider,
    cloudflareModels,
    openrouterModels,
    modelsByProvider,
    getModelForAction,
    setModelForAction,
    resetModels,
  }
}
