<template>
  <PostEditor
    v-if="editable"
    :content="content"
    :ai-enabled="aiEnabled"
    :ai-loading="aiLoading"
    :on-ai-command="onAiCommand"
    @update:content="forwardContent"
    @editor-ready="forwardEditor"
  />
  <PostViewer v-else :content="content" />
</template>

<script setup lang="ts">
import PostEditor from './editor/PostEditor.vue'
import PostViewer from './editor/PostViewer.vue'
import type { AICommand } from '~/composables/useAIWriter'

interface Props {
  content: string | object
  editable?: boolean
  aiEnabled?: boolean
  aiLoading?: boolean
  onAiCommand?: (action: AICommand) => void
}

withDefaults(defineProps<Props>(), {
  editable: false,
  aiEnabled: false,
  aiLoading: false,
  onAiCommand: undefined,
})
const emit = defineEmits<{ 'update:content': [json: object]; 'editor-ready': [editor: any] }>()

function forwardContent(json: object) { emit('update:content', json) }
function forwardEditor(ed: any) { emit('editor-ready', ed) }
</script>
