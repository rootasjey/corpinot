<template>
  <div class="post-content relative">
    <!-- Upload progress indicators for inline images -->
    <div v-if="uploadingImages.length > 0" class="upload-indicator fixed top-4 right-4 z-8 w-64 bg-background border border-border rounded-lg shadow-lg p-2">
      <div class="font-semibold text-sm mb-2">Uploading image{{ uploadingImages.length > 1 ? 's' : '' }}</div>
      <div class="space-y-2 max-h-40 overflow-auto">
        <div v-for="u in uploadingImages" :key="u.id" class="flex items-center gap-2">
          <div class="flex-1">
            <div class="text-xs truncate">{{ u.name }}</div>
            <div class="h-2 bg-muted rounded mt-1 overflow-hidden">
              <div class="h-full bg-primary transition-all" :style="{ width: u.progress + '%' }"></div>
            </div>
          </div>
          <div class="text-xs w-10 text-right">{{ u.progress }}%</div>
          <button @click.prevent="cancelUpload(u.id)" type="button" class="text-xs ml-1 p-1 rounded hover:bg-muted" title="Cancel upload">
            <span class="i-lucide-x" />
          </button>
        </div>
      </div>
    </div>

    <EditorBubbleMenu
      v-if="editor"
      :editor="editor"
      :block-types="blockTypes"
      :identifier="String(routeForUpload.params.identifier || '')"
      :ai-enabled="aiEnabled"
      :ai-loading="aiLoading"
      :on-ai-command="onAiCommand"
      :on-configure-models="props.onConfigureModels"
    />

    <FloatingSlashMenu
      v-if="editor"
      :editor="editor"
      :editable="true"
      :should-show="shouldShowFloatingMenu"
      :actions="floatingActions"
      @select="selectFloatingAction"
      :onInsertImages="onInsertImages"
      :onInsertGallery="onInsertGallery"
      :on-configure-models="props.onConfigureModels"
    />

    <EditorContent v-if="editor" :editor="editor" />
    <EditorDragHandleMenu
      v-if="editor"
      :editor="editor"
      :block-types="blockTypes"
      :identifier="String(routeForUpload.params.identifier || '')"
      :ai-enabled="aiEnabled"
      :ai-loading="aiLoading"
      :on-ai-command="onAiCommand"
      :on-configure-models="props.onConfigureModels"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent, Editor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, BackgroundColor } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import { VueNodeViewRenderer } from '@tiptap/vue-3'
import TaskItemNodeView from './TaskItemNodeView.vue'
import CodeBlockNodeView from './CodeBlockNodeView.vue'
import { CustomImage } from './CustomImage'
import ImageGallery from './ImageGallery'
import NodeRange from '@tiptap/extension-node-range'
import Separator from './Separator'
import EditorDragHandleMenu from './EditorDragHandleMenu.vue'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import FileHandler from '@tiptap/extension-file-handler'
import { watch, onBeforeUnmount, computed, toRaw } from 'vue'
import FloatingSlashMenu from '../FloatingSlashMenu.vue'
import EditorBubbleMenu from './EditorBubbleMenu.vue'
import { useRoute } from '#imports'
import type { EditorState } from '@tiptap/pm/state'
import type { BlockType } from '~~/shared/types/nodes'
import type { AICommand } from '~/composables/useAIWriter'
import { useLowlight } from '~/composables/useCodeHighlight'

interface Props {
  content: string | object
  aiEnabled?: boolean
  aiLoading?: boolean
  onAiCommand?: (action: AICommand) => void
  onConfigureModels?: () => void
}
const props = withDefaults(defineProps<Props>(), {
  aiEnabled: false,
  aiLoading: false,
  onAiCommand: undefined,
  onConfigureModels: undefined,
})

const emit = defineEmits<{ 'update:content': [json: object]; 'editor-ready': [editor: any] }>()

const {
  uploadingImages, 
  addUploading, 
  updateUploading, 
  removeUploading, 
  uploadFileWithProgress, 
  cancelUpload,
} = useEditorImages()

const routeForUpload = useRoute()

function normalizeEditorContent(input: string | object) {
  // tiptap expects either a string (HTML) or a plain JSON object representing
  // document nodes. Vue props can be reactive proxies — passing those into
  // tiptap causes createNodeFromContent to throw. Convert to a plain clone
  // and fall back to an empty document if the provided value is invalid.
  if (typeof input === 'string') return input
  try {
    const raw = toRaw(input as any)
    // If object is empty or has no meaningful keys, return a minimal doc to
    // avoid tiptap errors.
    if (!raw || typeof raw !== 'object' || Object.keys(raw).length === 0) {
      return { type: 'doc', content: [{ type: 'paragraph' }] }
    }

    return JSON.parse(JSON.stringify(raw))
  } catch (e) {
    // Defensive fallback — log helpful info for debugging and return empty doc
    // to keep the editor alive.
    // eslint-disable-next-line no-console
    console.warn('[PostEditor] normalizeEditorContent failed, falling back to empty doc', e)
    return { type: 'doc', content: [{ type: 'paragraph' }] }
  }
}

let suppressNextContentSync = false

const editor = useEditor({
  content: normalizeEditorContent(props.content),
  editable: true,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: { openOnClick: false },
      codeBlock: false, // Disable default codeBlock to use CodeBlockLowlight
    }),
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockNodeView)
      },
    }).configure({ lowlight: useLowlight() }),
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      onDrop: async (currentEditor, files, pos) => {
        if (files.length > 1) return handleGalleryFiles(currentEditor, files, pos)
        return handleFiles(currentEditor, files, pos)
      },
      onPaste: async (currentEditor, files) => {
        if (files.length > 1) return handleGalleryFiles(currentEditor, files, currentEditor.state.selection.anchor)
        return handleFiles(currentEditor, files, currentEditor.state.selection.anchor)
      },
    }),
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === 'paragraph') return `${new Date().toLocaleTimeString()} - Here are my thoughts about... (/ for commands)`
        if (node.type.name === 'heading') return 'Heading...'
        return ''
      },
      includeChildren: true,
    }),
    TaskList,
    // Use a Vue node view for task items so we can render our AndreasCheckbox component
    TaskItem.extend({
      addNodeView() {
        return VueNodeViewRenderer(TaskItemNodeView)
      },
    }).configure({ nested: true }),
    CustomImage,
    ImageGallery,
    Separator,
    Table.configure({ resizable: true }),
    TextStyle,
    BackgroundColor,
    Color,
    Highlight.configure({ multicolor: true }),
    NodeRange,
    TableRow,
    TableHeader,
    TableCell,
  ],
  editorProps: { attributes: { class: 'prose prose-lg max-w-none focus:outline-none' } },
  onUpdate: ({ editor }) => {
    suppressNextContentSync = true
    emit('update:content', editor.getJSON())
  },
})

// Expose editor when ready
watch(() => editor.value, (ed) => { if (ed) emit('editor-ready', ed) }, { immediate: true })

async function handleFiles(currentEditor: any, files: File[], pos: number) {
  const identifier = String(routeForUpload.params.identifier ?? '')
  for (const file of files) {
    const uploadId = addUploading(file.name)
    try {
      if (identifier) {
        try {
          const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
          const src = json?.image?.src ?? null
          if (src) {
            currentEditor.chain().insertContentAt(pos, { type: 'image', attrs: { src } }).focus().run()
            continue
          }
        } catch (e: any) {
          if (e && typeof e === 'object' && (e as any).aborted) continue
        }
      }
      // Fallback base64 inline
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      await new Promise<void>((resolve) => {
        fileReader.onload = () => {
          currentEditor.chain().insertContentAt(pos, { type: 'image', attrs: { src: fileReader.result } }).focus().run()
          resolve()
        }
      })
    } catch {
      const fr = new FileReader()
      fr.readAsDataURL(file)
      fr.onload = () => {
        currentEditor.chain().insertContentAt(pos, { type: 'image', attrs: { src: fr.result } }).focus().run()
      }
    } finally {
      removeUploading(uploadId)
    }
  }
}

const blockTypes: BlockType[] = [
  { label: 'Text', icon: 'i-lucide-pilcrow', isActive: () => editor.value?.isActive('paragraph'), action: () => editor.value?.chain().focus().setParagraph().run() },
  { label: 'Heading 1', icon: 'i-lucide-heading-1', isActive: () => !!editor.value?.isActive('heading', { level: 1 }), action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run() },
  { label: 'Heading 2', icon: 'i-lucide-heading-2', isActive: () => !!editor.value?.isActive('heading', { level: 2 }), action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
  { label: 'Heading 3', icon: 'i-lucide-heading-3', isActive: () => editor.value?.isActive('heading', { level: 3 }), action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run() },
  { label: 'Bullet List', icon: 'i-lucide-list', isActive: () => !!editor.value?.isActive('bulletList'), action: () => editor.value?.chain().focus().toggleBulletList().run() },
  { label: 'Numbered List', icon: 'i-lucide-list-ordered', isActive: () => !!editor.value?.isActive('orderedList'), action: () => editor.value?.chain().focus().toggleOrderedList().run() },
  { label: 'To-do List', icon: 'i-lucide-check-square', isActive: () => !!editor.value?.isActive('taskList'), action: () => editor.value?.chain().focus().toggleTaskList().run() },
  { label: 'Blockquote', icon: 'i-lucide-quote', isActive: () => !!editor.value?.isActive('blockquote'), action: () => editor.value?.chain().focus().toggleBlockquote().run() },
  { label: 'Code Block', icon: 'i-lucide-code-2', isActive: () => editor.value?.isActive('codeBlock'), action: () => editor.value?.chain().focus().toggleCodeBlock().run() },
]

interface FloatingAction { label: string; icon?: string; isActive?: () => boolean; action: () => void | Promise<void>; ask?: (prompt: string) => void | Promise<void> }
const floatingActions = computed<FloatingAction[]>(() => {
  const actions: FloatingAction[] = [
    { label: 'H1', icon: 'i-lucide-heading-1', isActive: () => editor.value?.isActive('heading', { level: 1 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'H2', icon: 'i-lucide-heading-2', isActive: () => editor.value?.isActive('heading', { level: 2 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', icon: 'i-lucide-heading-3', isActive: () => editor.value?.isActive('heading', { level: 3 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bulleted', icon: 'i-lucide-list', isActive: () => editor.value?.isActive('bulletList') ?? false, action: () => toggleBulletListWithEnter() },
    { label: 'Numbered', icon: 'i-lucide-list-ordered', isActive: () => editor.value?.isActive('orderedList') ?? false, action: () => editor.value?.chain().focus().toggleOrderedList().run() },
    { label: 'Code Block', icon: 'i-lucide-code-2', isActive: () => editor.value?.isActive('codeBlock') ?? false, action: () => editor.value?.chain().focus().toggleCodeBlock().run() },
    { label: 'To-do', icon: 'i-lucide-check-square', isActive: () => editor.value?.isActive('taskList') ?? false, action: () => editor.value?.chain().focus().toggleTaskList().run() },
    { label: 'Blockquote', icon: 'i-lucide-quote', isActive: () => editor.value?.isActive('blockquote') ?? false, action: () => editor.value?.chain().focus().toggleBlockquote().run() },
    { label: 'Gallery', icon: 'i-lucide-layout-grid', action: () => { /* drop-in handled by FloatingSlashMenu via file input */ } },
    { label: 'Image', icon: 'i-lucide-image', action: () => addImage() },
    { label: 'Separator', icon: 'i-lucide-minus', action: () => editor.value?.chain().focus().insertContent({ type: 'separator' }).run() },
    { label: 'Dashed', icon: 'i-lucide-minus', action: () => editor.value?.chain().focus().insertContent({ type: 'separator', attrs: { dashed: true } }).run() },
  ]

  if (props.aiEnabled && props.onAiCommand) {
    actions.unshift({
      label: 'AI',
      icon: 'i-lucide-sparkles',
      action: () => props.onAiCommand?.('continue'),
      ask: (prompt: string) => props.onAiCommand?.({ action: 'ask', prompt }),
    })
  }

  return actions
})

function deleteSlashIfPresent() {
  const ed = editor.value; if (!ed) return
  const pos = ed.state.selection.from; if (typeof pos !== 'number' || pos <= 0) return
  try {
    const charBefore = ed.state.doc.textBetween(pos - 1, pos, '', '\n')
    if (charBefore !== '/') return
    const tr = ed.state.tr.delete(pos - 1, pos)
    ed.view.dispatch(tr)
    ed.chain().focus().setTextSelection(pos - 1).run()
  } catch {}
}

function selectFloatingAction(item: FloatingAction) {
  if (!editor.value) return
  deleteSlashIfPresent()
  item.action?.()
  editor.value.chain().focus().run()
}

function toggleBulletListWithEnter() {
  if (!editor.value) return
  editor.value.chain().focus().toggleBulletList().run()
  if (!editor.value.isActive('bulletList')) return
  editor.value.chain().focus().splitListItem('listItem').run()
}

function shouldShowFloatingMenu(props: any) {
  if (!props || !props.state) return false
  const state = props.state as EditorState
  const { selection } = state
  if (!selection.empty) return false
  const pos = selection.from; if (typeof pos !== 'number' || pos <= 0) return false
  try { return state.doc.textBetween(pos - 1, pos, '', '\n') === '/' } catch { return false }
}

function addImage() {
  // Fallback: prompt for URL if file picker not available
  const url = window.prompt('Image URL')
  if (url && editor.value) editor.value.chain().focus().setImage({ src: url }).run()
}

function onInsertImages(files: FileList) {
  if (!editor.value || !files?.length) return
  const pos = editor.value.state.selection.anchor
  handleFiles(editor.value, Array.from(files), pos)
}

async function handleGalleryFiles(currentEditor: any, files: File[], pos: number) {
  const identifier = String(routeForUpload.params.identifier ?? '')
  const imagesArray: any[] = []
  for (const file of files) {
    const uploadId = addUploading(file.name)
    try {
      if (identifier) {
        try {
          const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
          const src = json?.image?.src ?? null
          if (src) {
            imagesArray.push({ type: 'image', attrs: { src } })
            continue
          }
        } catch (e: any) {
          if (e && typeof e === 'object' && (e as any).aborted) continue
        }
      }
      // Fallback base64 inline
      const fileReader = new FileReader()
      fileReader.readAsDataURL(file)
      await new Promise<void>((resolve) => {
        fileReader.onload = () => {
          imagesArray.push({ type: 'image', attrs: { src: fileReader.result } })
          resolve()
        }
      })
    } catch {
      const fr = new FileReader()
      fr.readAsDataURL(file)
      fr.onload = () => {
        imagesArray.push({ type: 'image', attrs: { src: fr.result } })
      }
    } finally {
      removeUploading(uploadId)
    }
  }

  // Insert a single gallery node with the collected images
  if (imagesArray.length > 0) {
    currentEditor.chain().insertContentAt(pos, { type: 'imageGallery', attrs: { images: imagesArray } }).focus().run()
  }
}

function onInsertGallery(files: FileList) {
  if (!editor.value || !files?.length) return
  const pos = editor.value.state.selection.anchor
  handleGalleryFiles(editor.value, Array.from(files), pos)
}

// Keep external content sync if parent updates. Normalize incoming content
// to a plain object so Tiptap isn't handed a Vue Proxy which leads to
// `Unknown node type: undefined` errors deep in its parsing logic.
watch(() => props.content, (newContent) => {
  if (!editor.value || !newContent) return
  if (suppressNextContentSync) { suppressNextContentSync = false; return }
  const normalized = normalizeEditorContent(newContent)
  // If the incoming value was a string, only update when different
  if (typeof newContent === 'string') {
    if (editor.value.getHTML() !== newContent) editor.value.commands.setContent(normalized)
    return
  }

  // For objects we always set the normalized (cloned) content
  editor.value.commands.setContent(normalized)
})

onBeforeUnmount(() => editor.value?.destroy())
</script>

<style scoped>
.color-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.25rem; }
.color-swatch { width: 1.25rem; height: 1.25rem; border-radius: 0.45rem; border: 1px solid rgba(0,0,0,0.06); box-shadow: 0 0 0 1px rgba(0,0,0,0.02) inset; transition: all 0.2s; }
.color-swatch.clear { display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--un-foreground-color, #111827); background: transparent; }
.dark .color-swatch.clear { color: var(--un-foreground-color, #f9fafb); border: 1px solid rgba(255,255,255,0.3); }
.color-swatch:hover { transform: scale(1.2); }
.color-swatch:active { transform: scale(0.9); }
.color-preview { display: inline-block; width: 0.9rem; height: 0.9rem; margin-left: 0.375rem; border-radius: 9999px; border: 2px solid transparent; }
</style>
