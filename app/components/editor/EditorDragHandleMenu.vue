<template>
  <div ref="wrapperEl" class="drag-button-wrap inline-flex items-center gap-2" data-node-type="text">
    <DragHandle 
      v-if="editor" 
      :editor="editor" 
      :onNodeChange="onNodeChange" 
      class="editor-drag-handle" 
      role="button" 
      aria-label="Drag block"
      tabindex="0"
    >
      <div class="drag-handle-inner inline-flex items-center gap-2">
        <button
          type="button"
          class="add-new-block-btn p-1 rounded hover:bg-muted focus:outline-none"
          @click.stop.prevent="addBlockBelow"
          :title="'Insert block below'"
          aria-label="Insert block below"
        >
          <span class="i-lucide-plus" />
        </button>


        <NDropdownMenu :items="dragMenuItems" class="drag-handle-dropdown">
          <template #default>
            <NButton icon btn="ghost" size="xs" :title="'Block options'" aria-label="Block options">
              <NIcon name="i-ph-dots-six-vertical-bold" size="md" />
            </NButton>
          </template>

          <template #menu-label class="currentBlockLabel">
            <span>{{ currentBlockLabel }}</span>
          </template>
        </NDropdownMenu>
      </div>
    </DragHandle>

    <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFilePicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, unref } from 'vue'
import type { Ref } from 'vue'
// NodeSelection used to be required when forcing selection on click — actions
// now operate on reported node positions so we don't need to change selection.
import type { Editor } from '@tiptap/vue-3'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import DragHandle from '@tiptap/extension-drag-handle-vue-3'
import { textPalette, backgroundPalette, colorLabelMap, backgroundLabelMap } from './palette'
import { useRoute } from '#imports'
import type { BlockType } from '~~/shared/types/nodes'
import type { AICommand } from '~/composables/useAIWriter'
const routeForUpload = useRoute()
const { addUploading, updateUploading, removeUploading, uploadFileWithProgress } = useEditorImages()

const props = withDefaults(defineProps<{
  editor: Editor | Ref<Editor | null> | null,
  blockTypes: BlockType[],
  identifier?: string,
  aiEnabled?: boolean,
  aiLoading?: boolean,
  onAiCommand?: (action: AICommand) => void,
  onConfigureModels?: () => void,
}>(), {
  aiEnabled: false,
  aiLoading: false,
  onAiCommand: undefined,
  onConfigureModels: undefined,
})

const { editor, blockTypes = [], identifier = '', aiEnabled = false, aiLoading = false, onAiCommand = undefined } = props
const fileInput = ref<HTMLInputElement | null>(null)
const wrapperEl = ref<HTMLElement | null>(null)

// The drag handle extension provides an `onNodeChange` callback with the
// currently targeted node and its document position. We store the last known
// `nodePos` so menu actions can act explicitly on the block related to the
// clicked handle instead of relying on the editor caret position.
const nodePos = ref<number | null>(null)
const dragHandleNode = ref<ProseMirrorNode | null>(null)

interface DragHandleChange {
  node: ProseMirrorNode | null
  pos?: number | null
  [key: string]: unknown
}

function onNodeChange(data: DragHandleChange | null): void {
  dragHandleNode.value = data?.node || null
  if (!data || !data.node) {
    nodePos.value = null
    return
  }
  // `pos` from DragHandle refers to the start position of the node.
  nodePos.value = typeof data.pos === 'number' ? data.pos : null
  
  // Update data attribute via DOM to control CSS visibility (bypasses Vue reactivity)
  const nodeType = data.node.type?.name === 'image' ? 'image' : 'text'
  wrapperEl.value?.setAttribute('data-node-type', nodeType)
}

function applyColorToBlock(color: string) {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  const node = dragHandleNode.value
  const from = pos + 1
  const to = pos + node.nodeSize - 1

  if (to > from) {
    ed.chain().focus().setTextSelection({ from, to }).setColor(color).run()
  }
}

function duplicateNode() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  const node = dragHandleNode.value

  ed.chain().focus().insertContentAt(pos + node.nodeSize, node.toJSON()).run()
}

function resetFormatting() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  const node = dragHandleNode.value
  const from = pos + 1
  const to = pos + node.nodeSize - 1

  // First run chainable unsets where available
  ed.chain().focus().setTextSelection({ from, to }).unsetColor().unsetHighlight().unsetBackgroundColor().extendMarkRange('link').unsetLink().run()

  // Remove common marks directly via transaction to ensure all marks are cleared
  const tr = ed.state.tr
  const schema = ed.state.schema
  const marksToClear = ['bold', 'italic', 'strike', 'code', 'underline']
  for (const m of marksToClear) {
    const markType = (schema.marks as any)[m]
    if (markType) tr.removeMark(from, to, markType)
  }

  if (tr.docChanged) ed.view.dispatch(tr)
}

async function copyBlockToClipboard() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  const node = dragHandleNode.value
  // If this is an image node try to copy the actual image binary to clipboard.
  const src = node?.attrs?.src
  if (src && node?.type?.name === 'image') {
    const imageCopied = await copyImageToClipboard(src)
    if (imageCopied) return
  }
  
  const curSel = ed.state.selection
  ed.chain().focus().setNodeSelection(pos).run()

  let copied = false
  try {
    await useClipboard().copy(node.textContent || '')
    copied = true
  } catch { copied = false }

  if (!copied) {
    const text = node.textContent || ''
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text)
  }

  const tr = ed.state.tr.setSelection(curSel)
  ed.view.dispatch(tr)
  ed.view.focus()
}

function downloadSelectedImage() {
  if (!dragHandleNode.value) return
  const src = dragHandleNode.value.attrs?.src
  if (!src) return
  const a = document.createElement('a')
  a.href = src
  a.download = String(src).split('/').pop() || 'image'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

function triggerReplace() {
  fileInput.value?.click()
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  const ed = unref(editor)
  if (!file || !ed || !nodePos.value) return

  // Prefer server uploads when an identifier is available (same flow as EditorBubbleMenu)
  const id = identifier || String(routeForUpload.params.identifier || '')
  const uploadId = addUploading(file.name)
  try {
    if (id) {
      try {
        const json = await uploadFileWithProgress(id, file, (p: number) => updateUploading(uploadId, p), uploadId)
        const src = json?.image?.src
        if (src) {
          ed.chain().focus().setNodeSelection(nodePos.value).updateAttributes('image', { src }).run()
          return
        }
      } catch (err: any) {
        if (err && typeof err === 'object' && (err as any).aborted) return
      }
    }

    // fallback base64
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => {
      if (!nodePos.value) return
      ed.chain().focus().setNodeSelection(nodePos.value).updateAttributes('image', { src: fr.result }).run()
    }
  } finally {
    removeUploading(uploadId)
    input.value = ''
  }
}

function deleteBlock() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  const node = dragHandleNode.value
  ed.chain().focus().deleteRange({ from: pos, to: pos + node.nodeSize }).run()
}

function addBlockBelow() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return
  
  const pos = nodePos.value
  const node = dragHandleNode.value
  const insertPos = pos + node.nodeSize

  // Insert a new paragraph block with a leading slash so it's not considered empty
  // and move the caret to the right of the slash so users can continue typing or open
  // the slash menu to pick which block type to create.
  const placeholderNode = { type: 'paragraph', content: [{ type: 'text', text: '/' }] }

  // insert and position caret after the slash character (pos + nodeSize is insertPos)
  ed.chain().focus().insertContentAt(insertPos, placeholderNode).run()
}

const currentBlockLabel = ref('Block')

// Track current node type name separately to avoid computed reactivity issues with DragHandle
const currentNodeTypeName = ref<string | null>(null)

watch(dragHandleNode, (node) => {
  // Update the node type name for menu reactivity (avoids accessing dragHandleNode directly in computed)
  currentNodeTypeName.value = node?.type?.name ?? null
  
  if (!node?.type?.name) return

  const name = node.type.name
  if (name === 'paragraph') currentBlockLabel.value = 'Text'
  else if (name === 'heading') currentBlockLabel.value = `Heading ${node.attrs?.level ?? ''}`
  else if (name === 'bulletList') currentBlockLabel.value = 'Bullet List'
  else if (name === 'orderedList') currentBlockLabel.value = 'Numbered List'
  else if (name === 'taskList') currentBlockLabel.value = 'To-do List'
  else if (name === 'blockquote') currentBlockLabel.value = 'Blockquote'
  else if (name === 'codeBlock') currentBlockLabel.value = 'Code Block'
  else currentBlockLabel.value = name.charAt(0).toUpperCase() + name.slice(1)
})

// Helper functions for background colors (defined outside computed to avoid recreating)
function applyBackgroundToBlock(color: string) {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  ed.chain().focus().setNodeSelection(pos).setBackgroundColor(color).run()
}

function clearBackgroundForBlock() {
  const ed = unref(editor)
  if (!ed || nodePos.value === null || !dragHandleNode.value) return

  const pos = nodePos.value
  ed.chain().focus().setNodeSelection(pos).unsetBackgroundColor().run()
}

const imageMenuItems = [
  { label: 'Download', onSelect: downloadSelectedImage, leading: 'i-lucide-download' },
  { label: 'Replace', onSelect: triggerReplace, leading: 'i-lucide-refresh-ccw' }
]

const aiDropdownItems = [
  { label: 'Fix grammar', leading: 'i-lucide-sparkles', onSelect: () => triggerAi('fix') },
  { label: 'Continue writing', leading: 'i-lucide-pen', onSelect: () => triggerAi('continue') },
  { label: 'Make shorter', leading: 'i-lucide-scissors', onSelect: () => triggerAi('shorten') },
  { label: 'Summarize', leading: 'i-lucide-notebook-text', onSelect: () => triggerAi('summarize') },
  { label: 'Translate', leading: 'i-lucide-languages', onSelect: () => triggerAi({ action: 'translate' }) },
  { label: 'Configure models', leading: 'i-lucide-settings-2', onSelect: () => props.onConfigureModels?.() },
]

function triggerAi(action: AICommand) {
  if (!onAiCommand || !aiEnabled || aiLoading) return

  const ed = unref(editor)

  // If the drag handle is attached to a text-like node, set a temporary
  // text selection for the node's content so the AI action operates on the
  // block next to the handle instead of the whole document.
  if (ed && nodePos.value !== null && dragHandleNode.value && dragHandleNode.value.type?.name !== 'image') {
    const pos = nodePos.value
    const node = dragHandleNode.value
    const from = pos + 1
    const to = pos + node.nodeSize - 1

    // For `continue` we want the caret at the end of the node so new text
    // is inserted after the block; for other actions select the block text.
    const actionName = typeof action === 'string' ? action : (action as any).action
    if (actionName === 'continue') {
      const insertPos = pos + node.nodeSize
      ed.chain().focus().setTextSelection({ from: insertPos, to: insertPos }).run()
    } else {
      if (to > from) ed.chain().focus().setTextSelection({ from, to }).run()
    }
  }

  onAiCommand(action)
}

// Helper functions for building menu items
const sanitizeColorClass = (c: string) => {
  const sanitized = c.replace(/[^a-z0-9]+/ig, '-').replace(/(^-|-$)/g, '').toLowerCase()
  return `color-letter color-${sanitized}`
}

const sanitizeDotClass = (c: string) => {
  const sanitized = c.replace(/[^a-z0-9]+/ig, '-').replace(/(^-|-$)/g, '').toLowerCase()
  return `color-dot color-${sanitized}`
}

// Build a single unified menu - actions check node type at execution time
const turnIntoItems = (blockTypes || []).map(t => ({
  label: t.label,
  leading: t.icon,
  onSelect: () => {
    // Skip for image nodes
    if (currentNodeTypeName.value === 'image') return
    const ed = unref(editor)
    if (ed && nodePos.value !== null) {
       ed.chain().setNodeSelection(nodePos.value).run()
    }
    t.action()
  }
}))

const colorItems = [
  { label: 'Default text', leading: 'dot-clear', onSelect: () => applyColorToBlock('') },
  ...textPalette.slice(0,11).map(col => ({
    label: colorLabelMap[col] ?? col,
    leading: sanitizeColorClass(col),
    onSelect: () => applyColorToBlock(col),
  }))
]

const backgroundItems = [
  { label: 'Default background', leading: 'dot-clear', onSelect: clearBackgroundForBlock },
  ...backgroundPalette.slice(0,9).map(col => ({
    label: backgroundLabelMap[col] ?? col,
    leading: sanitizeDotClass(col),
    onSelect: () => applyBackgroundToBlock(col),
  }))
]

// Single static menu - CSS controls visibility based on data-node-type attribute
const dragMenuItems = [
  // Image-only items (hidden for text blocks via CSS)
  { label: 'Download', onSelect: downloadSelectedImage, leading: 'i-lucide-download', class: 'image-only-item' },
  { label: 'Replace', onSelect: triggerReplace, leading: 'i-lucide-refresh-ccw', class: 'image-only-item' },
  { class: 'image-only-item', _dropdownMenuSeparator: { class: 'image-only-item' } }, // separator
  // Text-only items (hidden for image blocks via CSS)
  { label: 'Color', items: colorItems, leading: 'i-ph-paint-brush', class: 'text-only-item' },
  { label: 'Background', items: backgroundItems, leading: 'i-ph-paint-bucket', class: 'text-only-item' },
  { class: 'text-only-item', _dropdownMenuSeparator: { class: 'text-only-item' } }, // separator
  { label: 'AI', items: aiDropdownItems, leading: 'i-lucide-sparkles', class: 'text-only-item' },
  { class: 'text-only-item', _dropdownMenuSeparator: { class: 'text-only-item' } }, // separator
  { label: 'Reset formatting', onSelect: resetFormatting, leading: 'i-lucide-eraser', class: 'text-only-item' },
  { class: 'text-only-item', _dropdownMenuSeparator: { class: 'text-only-item' } }, // separator
  { label: 'Turn Into', items: turnIntoItems, leading: 'i-ph-swap', class: 'text-only-item' },
  { class: 'text-only-item', _dropdownMenuSeparator: { class: 'text-only-item' } }, // separator
  // Common items (always visible)
  { label: 'Duplicate node', onSelect: duplicateNode, leading: 'i-lucide-copy' },
  { label: 'Copy to clipboard', onSelect: copyBlockToClipboard, leading: 'i-lucide-clipboard' },
  { class: 'text-only-item', _dropdownMenuSeparator: { class: 'text-only-item' } }, // separator
  { label: 'Delete', onSelect: deleteBlock, leading: 'i-lucide-trash', color: 'danger' }
]
</script>

<style scoped>
.drag-handle-dropdown { display: inline-block }
.drag-button-wrap { display: inline-flex; align-items: center; gap: 0.35rem }
.add-new-block-btn { display: inline-flex; align-items: center; justify-content:center; width:28px; height:28px; border-radius:6px }
.add-new-block-btn span { font-size: 14px; line-height: 1 }
</style>

<style>
/* Global styles for dropdown menu items - controls visibility based on node type */
/* When hovering a text block, hide image-only items */
.drag-button-wrap[data-node-type="text"] ~ [data-reka-popper-content-wrapper] .image-only-item,
.drag-button-wrap[data-node-type="text"] ~ * .image-only-item,
body:has(.drag-button-wrap[data-node-type="text"]) [data-reka-popper-content-wrapper] .image-only-item {
  display: none !important;
}

/* When hovering an image block, hide text-only items */
.drag-button-wrap[data-node-type="image"] ~ [data-reka-popper-content-wrapper] .text-only-item,
.drag-button-wrap[data-node-type="image"] ~ * .text-only-item,
body:has(.drag-button-wrap[data-node-type="image"]) [data-reka-popper-content-wrapper] .text-only-item {
  display: none !important;
}
</style>
