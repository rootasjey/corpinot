<template>
  <div class="tiptap-editor" :class="{ 'is-editable': editable }">
    <div v-if="editable && editor" class="editor-toolbar">
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          type="button"
          title="Bold (Ctrl+B)"
        >
          <span class="i-lucide-bold text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          type="button"
          title="Italic (Ctrl+I)"
        >
          <span class="i-lucide-italic text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          type="button"
          title="Strikethrough"
        >
          <span class="i-lucide-strikethrough text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
          type="button"
          title="Code"
        >
          <span class="i-lucide-code text-lg" />
        </button>
      </div>

      <div class="toolbar-group">
        <NPopover
          trigger="manual"
          placement="top"
          :show="colorPopoverVisible"
          @update:show="(v: boolean) => colorPopoverVisible = v"
          :_popover-content="{ class: 'py-1 px-2 w-auto rounded-4' }"
        >
          <template #trigger>
            <NTooltip placement="top">
              <template #trigger>
                <button @click="colorPopoverVisible = !colorPopoverVisible" type="button">
                  <span class="i-lucide-droplet text-lg" />
                  <span
                    v-if="hasAnyColor"
                    class="color-preview"
                    :style="{ background: selectionBackgroundColor || selectionTextColor || 'transparent', borderColor: selectionTextColor || 'transparent' }"
                  />
                </button>
              </template>
              <div class="text-xs p-1">Text color · Highlight · Background</div>
            </NTooltip>
          </template>

          <div class="flex flex-col gap-2 p-2">
            <div class="text-xs text-muted">Text</div>
            <div class="color-grid">
              <button v-for="col in palette" :key="col" :style="{ background: col }" class="color-swatch" @click="setTextColor(col)" />
              <button class="color-swatch clear" @click="clearTextColor">×</button>
            </div>

            <div class="text-xs text-muted">Highlight</div>
            <div class="color-grid">
              <button v-for="col in highlightPalette" :key="col" :style="{ background: col }" class="color-swatch" @click="setHighlight(col)" />
              <button class="color-swatch clear" @click="clearHighlight">×</button>
            </div>

            <div class="text-xs text-muted">Background</div>
            <div class="color-grid">
              <button v-for="col in backgroundPalette" :key="col" :style="{ background: col }" class="color-swatch" @click="setBackgroundColor(col)" />
              <button class="color-swatch clear" @click="clearBackgroundColor">×</button>
            </div>
          </div>
        </NPopover>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          v-for="level in [1, 2, 3, 4, 5, 6]"
          :key="level"
          @click="editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level }) }"
          type="button"
          :title="`Heading ${level}`"
        >
          H{{ level }}
        </button>
        <button
          @click="editor.chain().focus().setParagraph().run()"
          :class="{ 'is-active': editor.isActive('paragraph') }"
          type="button"
          title="Paragraph"
        >
          <span class="i-lucide-pilcrow text-lg" />
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          type="button"
          title="Bullet List"
        >
          <span class="i-lucide-list text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          type="button"
          title="Numbered List"
        >
          <span class="i-lucide-list-ordered text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          type="button"
          title="Code Block"
        >
          <span class="i-lucide-code-2 text-lg" />
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          type="button"
          title="Blockquote"
        >
          <span class="i-lucide-quote text-lg" />
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().setHorizontalRule().run()"
          type="button"
          title="Horizontal Rule"
        >
          <span class="i-lucide-minus text-lg" />
        </button>
        <button
          @click="editor.chain().focus().setHardBreak().run()"
          type="button"
          title="Line Break"
        >
          <span class="i-lucide-corner-down-left text-lg" />
        </button>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().undo()"
          type="button"
          title="Undo (Ctrl+Z)"
        >
          <span class="i-lucide-undo text-lg" />
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().redo()"
          type="button"
          title="Redo (Ctrl+Shift+Z)"
        >
          <span class="i-lucide-redo text-lg" />
        </button>
      </div>
    </div>

    <EditorContent :editor="editor" class="editor-content" />
    <!-- Drag handle component from @tiptap/extension-drag-handle-vue-3 -->
    <DragHandle v-if="editor && editable" :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, BackgroundColor } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import NodeRange from '@tiptap/extension-node-range'
import DragHandle from '@tiptap/extension-drag-handle-vue-3'
// import { useDebounceFn } from '@vueuse/core'
import { watch, computed, ref } from 'vue'

const props = defineProps<{
  modelValue: object | string
  editable?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: object): void
}>()

// Parse initial content
const initialContent = typeof props.modelValue === 'string' 
  ? JSON.parse(props.modelValue) 
  : props.modelValue

const editor = useEditor({
  content: initialContent,
  editable: props.editable ?? true,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    TextStyle,
    BackgroundColor,
    Color,
    Highlight,
    	// Node range is required by the drag handle extension
    	NodeRange,
    	// The Vue wrapper registers the drag-handle plugin at runtime.
  ],
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getJSON())
  },
  
})

// Color UI helpers (moved outside `useEditor`)
const palette = ['#111827','#374151','#6B7280','#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#6366f1','#8b5cf6','#ec4899']
const highlightPalette = ['#fff7ed','#ffedd5','#fef3c7','#ecfeff','#ecfccb','#eef2ff']
const backgroundPalette = [...highlightPalette]

const setTextColor = (color: string) => {
  editor.value?.chain().focus().setColor(color).run()
}

const clearTextColor = () => {
  editor.value?.chain().focus().unsetColor().run()
}

const setHighlight = (color?: string) => {
  const col = color ?? '#fef3c7'
  editor.value?.chain().focus().toggleHighlight({ color: col }).run()
}

const clearHighlight = () => {
  editor.value?.chain().focus().unsetHighlight().run()
}

const setBackgroundColor = (color: string) => {
  editor.value?.chain().focus().setBackgroundColor(color).run()
}

const clearBackgroundColor = () => {
  editor.value?.chain().focus().unsetBackgroundColor().run()
}

const colorPopoverVisible = ref(false)
const selectionTextColor = computed(() => {
  if (!editor.value) return ''
  const ts = editor.value.getAttributes('textStyle') || {}
  return ts?.color || editor.value.getAttributes('highlight')?.color || ''
})

const selectionBackgroundColor = computed(() => {
  if (!editor.value) return ''
  const ts = editor.value.getAttributes('textStyle') || {}
  return ts?.backgroundColor || ''
})

const hasAnyColor = computed(() => !!(selectionTextColor.value || selectionBackgroundColor.value))

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (!editor.value) return
    
    const currentContent = editor.value.getJSON()
    const newContent = typeof newValue === 'string' ? JSON.parse(newValue) : newValue
    
    // Only update if content actually changed to avoid cursor jumping
    if (JSON.stringify(currentContent) !== JSON.stringify(newContent)) {
      editor.value.commands.setContent(newContent)
    }
  }
)

// Watch for editable changes
watch(
  () => props.editable,
  (newValue) => {
    editor.value?.setEditable(newValue ?? true)
  }
)

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.tiptap-editor {
  @apply border border-gray-200 dark:border-gray-700 rounded-lg;
  /* allow floating UI components to overflow the editor when editing */
  overflow: hidden;
}

.tiptap-editor.is-editable {
  overflow: visible;
}

.editor-toolbar {
  @apply flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700;
}

.toolbar-group {
  @apply flex items-center gap-0.5;
}

.toolbar-divider {
  @apply w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1;
}

.editor-toolbar button {
  @apply px-2 py-1.5 rounded text-gray-700 dark:text-gray-300 
         hover:bg-gray-200 dark:hover:bg-gray-700 
         transition-colors duration-150 min-w-8 h-8
         flex items-center justify-center;
}

.editor-toolbar button.is-active {
  @apply bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white;
}

.editor-toolbar button:disabled {
  @apply opacity-40 cursor-not-allowed;
}

.editor-content {
  @apply p-4 min-h-[400px] bg-white dark:bg-gray-900;
  position: relative; /* container for drag handle absolute placement */
}

/* Drag handle styling */
.tiptap-editor :deep(.tiptap-drag-handle),
.tiptap-editor :deep(.drag-handle),
.editor-content :deep(.tiptap-drag-handle),
.editor-content :deep(.drag-handle) {
  position: absolute; /* Drag handle plugin will set x/y via style */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: transparent;
  cursor: grab;
  transition: background-color .12s ease, transform .12s ease;
  z-index: 60;
}
.editor-content :deep(.tiptap-drag-handle:hover),
.editor-content :deep(.drag-handle:hover) {
  background: rgba(0,0,0,0.05);
}
.editor-content :deep(.tiptap-drag-handle svg),
.editor-content :deep(.drag-handle svg) {
  @apply text-muted;
  width: 14px;
  height: 14px;
}

/* Tiptap editor styles */
.editor-content :deep(.tiptap) {
  @apply outline-none;
}

/* Color swatch styles - small copy of PostContent styles so toolbar shows options */
.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;
}
.color-swatch {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.25rem;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.02) inset;
}
.color-swatch.clear {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--un-foreground-color, #111827);
  background: transparent;
}
.color-preview {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  margin-left: 0.375rem;
  border-radius: 9999px;
  border: 2px solid transparent;
}

.editor-content :deep(.tiptap p) {
  @apply mb-4;
}

.editor-content :deep(.tiptap h1) {
  @apply text-4xl font-bold mb-4 mt-6;
}

.editor-content :deep(.tiptap h2) {
  @apply text-3xl font-bold mb-3 mt-5;
}

.editor-content :deep(.tiptap h3) {
  @apply text-2xl font-bold mb-3 mt-4;
}

.editor-content :deep(.tiptap h4) {
  @apply text-xl font-bold mb-2 mt-3;
}

.editor-content :deep(.tiptap h5) {
  @apply text-lg font-bold mb-2 mt-2;
}

.editor-content :deep(.tiptap h6) {
  @apply text-base font-bold mb-2 mt-2;
}

.editor-content :deep(.tiptap ul),
.editor-content :deep(.tiptap ol) {
  @apply pl-6 mb-4;
}

.editor-content :deep(.tiptap ul) {
  @apply list-disc;
}

.editor-content :deep(.tiptap ol) {
  @apply list-decimal;
}

.editor-content :deep(.tiptap li) {
  @apply mb-1;
}

.editor-content :deep(.tiptap code) {
  @apply bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono;
}

.editor-content :deep(.tiptap pre) {
  @apply bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto;
}

.editor-content :deep(.tiptap pre code) {
  @apply bg-transparent p-0;
}

.editor-content :deep(.tiptap blockquote) {
  @apply border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-2 mb-4 italic text-gray-700 dark:text-gray-300;
}

.editor-content :deep(.tiptap hr) {
  @apply border-t border-gray-300 dark:border-gray-600 my-6;
}

.editor-content :deep(.tiptap a) {
  @apply text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300;
}

.editor-content :deep(.tiptap strong) {
  @apply font-bold;
}

.editor-content :deep(.tiptap em) {
  @apply italic;
}

.editor-content :deep(.tiptap s) {
  @apply line-through;
}

/* Read-only mode */
.tiptap-editor:not(.is-editable) {
  @apply border-none;
}

.tiptap-editor:not(.is-editable) .editor-content {
  @apply p-0 min-h-0;
}
</style>
