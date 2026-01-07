<template>
  <NodeViewWrapper class="code-block-wrapper relative">
    <!-- Language selector (admin only, top-left) -->
    <div v-if="isAdmin && editable" class="absolute top-2 left-2 z-2">
      <NDropdownMenu 
        modal
        :items="languageDropdownItems"
        :_dropdown-menu-content="{ class: 'py-0 px-0 w-auto bg-white dark:bg-black shadow-lg max-h-[300px] overflow-y-auto' }"
      >
        <NButton
          btn="ghost-gray"
          size="xs"
          class="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted"
        >
          <span class="i-lucide-code text-sm" />
          <span>{{ currentLanguageLabel }}</span>
          <span class="i-lucide-chevron-down text-xs opacity-50" />
        </NButton>
      </NDropdownMenu>
    </div>

    <!-- Copy button (top-right, always visible) -->
    <div class="absolute top-2 right-2 z-2">
      <NButton
        btn="ghost-gray"
        size="xs"
        class="flex items-center gap-1 px-2 py-1 text-xs bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted"
        @click="copyCode"
        :title="copied ? 'Copied!' : 'Copy code'"
      >
        <span :class="copied ? 'i-lucide-check text-green-500' : 'i-lucide-copy'" class="text-sm" />
        <span v-if="copied" class="text-green-500">Copied!</span>
      </NButton>
    </div>

    <!-- Code content -->
    <pre class="code-block-content"><NodeViewContent as="code" /></pre>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { NodeViewWrapper, NodeViewContent, nodeViewProps } from '@tiptap/vue-3'
import { computed, ref } from 'vue'
import { useCodeHighlight } from '~/composables/useCodeHighlight'

const props = defineProps(nodeViewProps)

const { popularLanguages } = useCodeHighlight()
const copied = ref(false)

// Check if user is admin
const session = useUserSession()
const isAdmin = computed(() => session.user.value?.role === 'admin')

// Check if editor is in edit mode
const editable = computed(() => props.editor.isEditable)

const currentLanguageLabel = computed(() => {
  const lang = props.node.attrs.language || ''
  if (!lang) return 'Plain Text'
  const found = popularLanguages.find(l => l.value === lang)
  return found?.label || lang.toUpperCase()
})

const languageDropdownItems = computed(() => [
  {
    label: 'Languages',
    items: [
      { 
        label: 'Plain Text', 
        trailing: currentLanguageLabel.value === 'Plain Text' ? 'i-ph-check' : undefined,
        onSelect: () => setLanguage(null) 
      },
      ...popularLanguages.map(l => ({
        label: l.label,
        trailing: currentLanguageLabel.value === l.label ? 'i-ph-check' : undefined,
        onSelect: () => setLanguage(l.value),
      })),
    ],
  },
])

function setLanguage(language: string | null) {
  props.updateAttributes({ language })
}

async function copyCode() {
  try {
    const codeText = props.node.textContent
    await navigator.clipboard.writeText(codeText)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}
</script>

<style scoped>
.code-block-wrapper {
  position: relative;
  margin: 1rem 0;
}

.code-block-content {
  position: relative;
  padding-top: 3.5rem;
  padding-bottom: 2rem;
  padding-left: 1.5rem;
}
</style>
