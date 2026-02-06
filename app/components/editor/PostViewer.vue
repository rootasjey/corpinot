<template>
  <div class="post-content relative">
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, BackgroundColor } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import NodeRange from '@tiptap/extension-node-range'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Separator from './Separator'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TaskItemNodeView from './TaskItemNodeView.vue'
import CodeBlockNodeView from './CodeBlockNodeView.vue'
import { CustomImage } from './CustomImage'
import ImageGallery from './ImageGallery'
import { Video } from './Video'
import { Audio } from './Audio'
import { Conway } from './Conway'
import { HorizontalCard } from './HorizontalCard'
import { AutoLinkPreview } from './AutoLinkPreview'
import { watch } from 'vue'
import { useLowlight } from '~/composables/useCodeHighlight' 

interface Props {
  content: string | object
  editable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

// Read-only editor for displaying already saved article content
const editor = useEditor({
  content: props.content,
  editable: false,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      codeBlock: false, // Disable default codeBlock to use CodeBlockLowlight
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockNodeView)
      },
    }).configure({ lowlight: useLowlight() }),
    CustomImage,
    ImageGallery,
    Video,
    Audio,
    Conway,
    HorizontalCard,
    AutoLinkPreview,
    TextStyle,
    BackgroundColor,
    Color,
    Highlight.configure({ multicolor: true }),
    NodeRange,
    Table,
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.extend({ addNodeView() { return VueNodeViewRenderer(TaskItemNodeView) } }),
    Separator,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'paragraph' && node.attrs?.placeholder) return node.attrs.placeholder
        if (node.type.name === 'paragraph') return 'Loading content…'
        return ''
      },
      includeChildren: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none',
    },
  },
})

// Sync when parent updates content externally
watch(() => props.content, (newContent) => {
  if (!editor.value || !newContent) return
  if (typeof newContent !== 'string') {
    editor.value.commands.setContent(newContent)
    return
  }
  if (editor.value.getHTML() !== newContent) {
    editor.value.commands.setContent(newContent)
  }
})
</script>
