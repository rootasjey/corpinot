<template>
  <div class="space-y-4">
    <div v-if="!draft.length" class="text-sm text-gray-500 dark:text-gray-400">No socials yet. Add one below.</div>

    <div v-for="(s, i) in draft" :key="i" class="flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3">
      <div class="flex items-center gap-3">
        <NIcon :name="platformIcon(s.platform)" />
        <NInput v-model="s.platform" placeholder="Platform (e.g. Twitter)" input="outline" class="w-42" />
        <NInput v-model="s.url" placeholder="https://..." input="outline" class="flex-1" />
        <NButton @click="removeRow(i)" btn="soft-gray" size="sm" icon label="i-ph-x" />
      </div>
      <div class="ml-8 flex gap-3 items-center">
        <NInput v-model="s.label" placeholder="Label (optional)" input="outline" class="w-42" />
        <NInput v-model.number="s.order" type="number" placeholder="Order" input="outline" />
        <div class="flex items-center gap-2">
          <NSwitch v-model="s.enabled" />
          <span class="text-xs font-body uppercase font-700 text-gray-700 dark:text-gray-300">{{ s.enabled ? 'Enabled' : 'Disabled' }}</span>
        </div>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <NButton @click="addRow" btn="soft" size="xs" class="px-6 font-600" label="Add" />
      <div class="ml-auto flex items-center gap-2">
        <NButton @click="emitCancel" btn="ghost-gray" size="xs" :disabled="saving" class="font-600">Cancel</NButton>
        <NButton @click="emitSave" :disabled="saving" btn="soft-pink" size="xs">
          <NIcon :name="saving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': saving }" />
          <span class="ml-2 font-600">Save</span>
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'

export type SocialLink = {
  platform: string
  url: string
  label?: string
  order?: number | null
  enabled?: boolean | null
}

const props = defineProps({
  modelValue: { type: Array as () => SocialLink[], default: () => [] },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel'])

const draft = ref<SocialLink[]>([...props.modelValue])
let syncingFromModel = false

watch(() => props.modelValue, (v) => {
  syncingFromModel = true
  draft.value = [...v]
  nextTick(() => { syncingFromModel = false })
}, { deep: true })

watch(draft, (v) => {
  if (syncingFromModel) return
  emit('update:modelValue', v)
}, { deep: true })

function addRow() {
  draft.value.push({ platform: '', url: '', enabled: true, order: draft.value.length })
  nextTick(() => {
    // focus last input if needed (minimal; skip querying DOM to keep simple)
  })
}

function removeRow(i: number) {
  draft.value.splice(i, 1)
}

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let p = platform.toLowerCase().trim()
  if (p.startsWith('http')) {
    try { p = new URL(p).hostname.replace(/^www\./, '') } catch {}
  }
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'i-lucide-twitter'
  if (p.includes('github')) return 'i-lucide-github'
  if (p.includes('linkedin')) return 'i-lucide-linkedin'
  if (p.includes('instagram')) return 'i-lucide-instagram'
  if (p.includes('facebook')) return 'i-lucide-facebook'
  if (p.includes('tiktok')) return 'i-lucide-music'
  if (p.includes('youtube') || p.includes('youtu.be')) return 'i-lucide-youtube'
  if (p.includes('website') || p.includes('site') || p.includes('blog') || p.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

const sanitized = computed(() =>
  draft.value
    .map((s, idx) => ({
      platform: s.platform?.trim() || '',
      url: s.url?.trim() || '',
      label: s.label?.trim() || undefined,
      order: s.order ?? idx,
      enabled: s.enabled !== false,
    }))
    .filter((s) => s.platform || s.url)
)

function emitSave() {
  emit('save', sanitized.value)
}

function emitCancel() {
  emit('cancel')
}
</script>
