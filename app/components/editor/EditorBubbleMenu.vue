<template>
  <BubbleMenu
    v-if="editor"
    :editor="editor"
    :options="{ placement: 'top' }"
    :should-show="shouldShowMenu"
    class="bubble-menu"
    @pointerdown="onBubbleMenuPointerDown"
  >
    <!-- Image specific actions -->
    <template v-if="imageSelected">
      <div class="flex items-center gap-2">
        <button type="button" @click="setImageDisplay('center')" :class="{ 'is-active': currentImageDisplay === 'center' }" title="Center image" aria-label="Center image">
          <span class="i-lucide-align-center" />
        </button>
        <button type="button" @click="setImageDisplay('full-bleed')" :class="{ 'is-active': currentImageDisplay === 'full-bleed' }" title="Full width (bleed)" aria-label="Full width (bleed)">
          <span class="i-lucide-maximize-2" />
        </button>

        <button type="button" @click="downloadSelectedImage" title="Download image">
          <span class="i-lucide-download" />
        </button>
        <button type="button" @click="triggerReplace" title="Replace image">
          <span class="i-lucide-refresh-ccw" />
        </button>
        <button type="button" @click="copyImageUrl" title="Copy image">
          <span :class="copied ? 'i-lucide-clipboard-check text-green-500' : 'i-lucide-clipboard'" />
        </button>
        <button type="button" @click="deleteSelectedImage" title="Delete image">
          <span class="i-lucide-trash" />
        </button>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFilePicked" />
      </div>
    </template>
    <!-- Audio specific actions -->
    <template v-else-if="audioSelected">
      <div class="flex items-center gap-2">
        <button type="button" @click="triggerReplaceAudio" title="Replace audio">
          <span class="i-lucide-upload" />
        </button>
        <button type="button" @click="deleteSelectedAudio" title="Delete audio">
          <span class="i-lucide-trash" />
        </button>
        <input ref="audioFileInput" type="file" accept="audio/*" class="hidden" @change="onAudioFilePicked" />
      </div>
    </template>
    <!-- Code block language selector -->
    <template v-else-if="codeBlockSelected">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium px-2">Language:</span>
        <NDropdownMenu 
          modal
          :items="languageDropdownItems"
          :_dropdown-menu-content="blockDropDownMenuContent"
        >
          <NButton
            btn="~"
            class="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded text-sm font-medium min-w-[120px]"
          >
            <span class="flex-1 text-left">{{ currentLanguageLabel }}</span>
            <span class="i-lucide-chevron-down text-xs opacity-50" />
          </NButton>
        </NDropdownMenu>
      </div>
    </template>
    <!-- Formatting actions (default) -->
    <template v-else>
      <NDropdownMenu 
        modal
        :items="blockDropdownItems"
        class="menu-block-type"
        :_dropdown-menu-content="blockDropDownMenuContent"
      >
        <NButton
          btn="~"
          class="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded text-sm font-medium min-w-[120px]"
          :leading="currentBlockType?.icon"
        >
          <span class="flex-1 text-left">{{ currentBlockType?.label }}</span>
          <span class="i-lucide-chevron-down text-xs opacity-50" />
        </NButton>
      </NDropdownMenu>

      <NDropdownMenu
        v-if="aiEnabled"
        :items="aiDropdownItems"
        :_dropdown-menu-content="blockDropDownMenuContent"
        :_dropdown-menu-item="{
          class: 'px-6 py-2 dark:focus:bg-#18181A focus:bg-#F5F5F5 dark:focus:text-blue',
        }"
      >
        <NButton btn="ghost-gray" size="xs" class="px-4!" :disabled="aiLoading">
          <NIcon :name="aiLoading ? 'i-lucide-loader' : 'i-lucide-sparkles'" :class="{ 'animate-spin': aiLoading }" />
          <span>AI</span>
        </NButton>
      </NDropdownMenu>

      <div class="divider" />

      <button @click="editor.chain().focus().toggleBold().run()" :class="{ 'is-active': editor.isActive('bold') }" type="button">
        <span class="i-lucide-bold" />
      </button>
      <button @click="editor.chain().focus().toggleItalic().run()" :class="{ 'is-active': editor.isActive('italic') }" type="button">
        <span class="i-lucide-italic" />
      </button>
      <button @click="editor.chain().focus().toggleStrike().run()" :class="{ 'is-active': editor.isActive('strike') }" type="button">
        <span class="i-lucide-strikethrough" />
      </button>
      <button @click="editor.chain().focus().toggleCode().run()" :class="{ 'is-active': editor.isActive('code') }" type="button">
        <span class="i-lucide-code" />
      </button>

      <div class="divider" />

      <NPopover
        modal
        v-if="editor"
        :show="linkVisible"
        @update:show="onPopoverUpdate"
        :show-arrow="false"
        :_popover-content="linkPopoverContent"
      >
        <template #trigger>
          <button @click="setLink" :class="{ 'is-active': editor.isActive('link') }" type="button">
            <span class="i-lucide-link" />
          </button>
        </template>

        <div class="flex items-center gap-2 p-0">
          <NInput
            v-model:value="linkUrl"
            ref="linkInput"
            input="outline"
            placeholder="Paste link..."
            aria-label="Link URL"
            class="min-w-[120px] border-none ring-none shadow-none focus:outline-none focus:ring-0"
            @keydown.enter.prevent="updateLink"
            @keydown.esc="editor.commands.focus()"
          />
          <div class="flex items-center gap-1 border-l border-border p-1">
            <NButton v-if="linkUrl" @click="openLink" icon btn="ghost-gray" size="xs" title="Open Link" rounded="3">
              <span class="i-lucide-external-link text-sm" />
            </NButton>
            <NButton @click="removeLink" icon btn="ghost-gray" size="sm" title="Remove Link" rounded="3">
              <span class="i-lucide-trash text-sm" />
            </NButton>
          </div>
        </div>
      </NPopover>

      <EditorColorPopover :editor="props.editor" v-model:open="colorVisible" />
      <div class="divider" />
      <button type="button" @click="resetEditor" title="Reset editor" class="text-red-500 hover:text-red-600">
        <span class="i-lucide-eraser" />
      </button>
    </template>
  </BubbleMenu>
</template>

<script setup lang="ts">
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { ref, computed, nextTick, watch } from 'vue'
import EditorColorPopover from './EditorColorPopover.vue'
import type { FocusOutsideEvent, PointerDownOutsideEvent } from '@una-ui/nuxt'
import type { EditorState, Selection } from '@tiptap/pm/state'
import { useRoute } from '#imports'
import type { BetterSelection } from '~~/shared/types/nodes'
import type { Editor } from '@tiptap/vue-3'
import type { Editor as TiptapEditor } from '@tiptap/core'
import type { AICommand } from '~/composables/useAIWriter'
import { useCodeHighlight } from '~/composables/useCodeHighlight'

interface BlockType {
  label: string
  icon: string
  isActive: () => boolean | undefined
  action: () => void
}

interface Props {
  editor: Editor | null
  blockTypes: BlockType[]
  identifier?: string
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

const currentBlockType = computed(() => props.blockTypes.find(t => t.isActive()) || props.blockTypes[0])

const blockDropdownItems = computed(() => {
  const textGroup = props.blockTypes.slice(0, 4).map(t => ({ label: t.label, leading: t.icon, trailing: t.isActive() ? 'i-ph-check' : undefined, onSelect: () => t.action() }))
  const otherGroup = props.blockTypes.slice(4).map(t => ({ label: t.label, leading: t.icon, trailing: t.isActive() ? 'i-ph-check' : undefined, onSelect: () => t.action() }))
  return [ { label: 'Turn Into', items: textGroup }, { label: 'Format', items: otherGroup } ]
})

const aiDropdownItems = computed(() => [
  { label: 'Fix grammar', leading: 'i-lucide-sparkles', onSelect: () => triggerAi('fix') },
  { label: 'Continue writing', leading: 'i-lucide-pen', onSelect: () => triggerAi('continue') },
  { label: 'Make shorter', leading: 'i-lucide-scissors', onSelect: () => triggerAi('shorten') },
  { label: 'Summarize', leading: 'i-lucide-notebook-text', onSelect: () => triggerAi('summarize') },
  { label: 'Translate', leading: 'i-lucide-languages', onSelect: () => triggerAi({ action: 'translate' }) },
  { label: 'Configure models', leading: 'i-lucide-settings-2', onSelect: () => props.onConfigureModels?.() },
])

/**
 * Prevent the editor from losing focus when clicking inside the bubble menu.
 * Only prevent default if the click is inside the bubble menu but not on interactive elements.
 * @param e - PointerEvent
 */
function onBubbleMenuPointerDown(e: PointerEvent) {
  const target = e.target as HTMLElement
  if (target.closest('.bubble-menu') && !target.closest('button, a, input, textarea, select')) {
    e.preventDefault()
  }
}

const blockDropDownMenuContent = { 
  class: 'py-0 px-0 w-auto bg-white dark:bg-black shadow-lg',
  onInteractOutside: onInteractOutside,
}

const linkPopoverContent = { 
  class: 'py-0 px-1 w-auto rounded-4',
  onInteractOutside: onInteractOutside,
}

function onInteractOutside(e: PointerDownOutsideEvent | FocusOutsideEvent) {
  e.detail.originalEvent.preventDefault()
}

const linkUrl = ref('')
const manualLinkOpen = ref(false)
const linkInput = ref<any | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const audioFileInput = ref<HTMLInputElement | null>(null)

const { popularLanguages, normalizeLangName } = useCodeHighlight()

// Determine whether the current selection is an image node.
// Use the editor's selection state directly — relying on `isActive('image')` alone
// could be misleading in cases where the editor still reports the mark/node active
// even after the selection has moved. Checking the selection.node ensures we
// only treat an image as selected when the selection is a NodeSelection for an image.
const imageSelected = computed(() => {
  const sel = props.editor?.state.selection as any | undefined
  return !!sel && !!sel.node && sel.node.type?.name === 'image'
})

// Check if an audio node is selected
const audioSelected = computed(() => {
  const sel = props.editor?.state.selection as any | undefined
  return !!sel && !!sel.node && sel.node.type?.name === 'audio'
})

// Check if a code block is currently active
const codeBlockSelected = computed(() => props.editor?.isActive('codeBlock'))

const currentLanguageLabel = computed(() => {
  if (!props.editor || !codeBlockSelected.value) return 'Plain Text'
  const attrs = props.editor.getAttributes('codeBlock')
  const lang = attrs?.language || ''
  if (!lang) return 'Plain Text'
  const found = popularLanguages.find(l => l.value === lang)
  return found?.label || lang.toUpperCase()
})

const languageDropdownItems = computed(() => [
  {
    label: 'Languages',
    items: [
      { label: 'Plain Text', onSelect: () => setCodeBlockLanguage(null) },
      ...popularLanguages.map(l => ({
        label: l.label,
        trailing: currentLanguageLabel.value === l.label ? 'i-ph-check' : undefined,
        onSelect: () => setCodeBlockLanguage(l.value),
      })),
    ],
  },
])

function setCodeBlockLanguage(language: string | null) {
  if (!props.editor) return
  props.editor.chain().focus().updateAttributes('codeBlock', { language }).run()
}
const copied = ref(false)

const currentImageDisplay = computed(() => props.editor?.getAttributes('image')?.display || 'center')
function setImageDisplay(mode: 'center' | 'full-bleed') {
  if (!props.editor) return
  props.editor.chain().focus().updateAttributes('image', { display: mode }).run()
}

// Upload helpers (shared composable state)
const { addUploading, updateUploading, removeUploading, uploadFileWithProgress } = useEditorImages()
const currentRoute = useRoute()

function triggerAi(action: AICommand) {
  if (!props.onAiCommand || !props.aiEnabled || props.aiLoading) return
  props.onAiCommand(action)
}

const linkVisible = computed(() => props.editor?.isActive('link') && (manualLinkOpen.value || !props.editor?.state.selection.empty))

// Keep track of the color popover visibility so the bubble menu can remain open
const colorVisible = ref(false)

function setLink() {
  if (!props.editor) return
  const previousUrl = props.editor.getAttributes('link').href
  linkUrl.value = previousUrl || ''
  if (props.editor.isActive('link')) return
  const { from, empty } = props.editor.state.selection
  if (!empty) { props.editor.chain().focus().extendMarkRange('link').setLink({ href: '' }).run(); manualLinkOpen.value = true; return }
  const placeholder = 'link'
  props.editor.chain().focus().insertContentAt(from, placeholder).setTextSelection({ from, to: from + placeholder.length }).extendMarkRange('link').setLink({ href: '' }).run()
  manualLinkOpen.value = true
}

function updateLink() { if (linkUrl.value === '') props.editor?.chain().focus().extendMarkRange('link').unsetLink().run(); else props.editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run() }
function removeLink() { props.editor?.chain().focus().extendMarkRange('link').unsetLink().run() }
function openLink() { if (linkUrl.value) window.open(linkUrl.value, '_blank') }
function onPopoverUpdate(v: boolean) { if (!v) manualLinkOpen.value = false }

watch(linkVisible, async (showing) => {
  if (!showing) { manualLinkOpen.value = false; return }
  linkUrl.value = props.editor?.getAttributes('link').href || ''
  await nextTick()
  const el = linkInput.value?.$el || linkInput.value
  const input = el?.querySelector?.('input')
  input?.focus()
  const val = input?.value
  input?.setSelectionRange?.(val?.length ?? 0, val?.length ?? 0)
})

// Keep formatting menu open when there's a selection or manual link editing
function shouldShowMenu(ctx: { state: EditorState; editor: TiptapEditor }) {
  const { state, editor } = ctx

  // If the current selection is a node and that node is an image, show the image menu.
  // Use the passed-in state.selection (ctx.state) rather than the outer computed which
  // references props.editor to avoid timing/staleness issues.
  const sel = state.selection as BetterSelection
  const selectionIsImage = !!sel && !!sel.node && sel.node.type?.name === 'image'
  if (selectionIsImage) return true

  const selectionIsAudio = !!sel && !!sel.node && sel.node.type?.name === 'audio'
  if (selectionIsAudio) return true

  // For formatting menu: only show if there is an actual range selection (not a collapsed cursor),
  // or when the link editor/color popover is active.
  const { empty } = state.selection
  return !empty || (editor.isActive('link') && manualLinkOpen.value) || colorVisible.value
}

function downloadSelectedImage() {
  const src = props.editor?.getAttributes('image')?.src
  if (!src) return
  const a = document.createElement('a')
  a.href = src
  a.download = src.split('/').pop() || 'image'
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
  if (!file || !props.editor) return
  const identifier = props.identifier || String(currentRoute.params.identifier || '')
  const uploadId = addUploading(file.name)
  try {
    if (identifier) {
      try {
        const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
        const src = json?.image?.src
        if (src) {
          props.editor.chain().focus().updateAttributes('image', { src }).run()
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
      props.editor?.chain().focus().updateAttributes('image', { src: fr.result }).run()
    }
  } finally {
    removeUploading(uploadId)
    input.value = ''
  }
}

function deleteSelectedImage() {
  if (!props.editor) return
  props.editor.chain().focus().deleteSelection().run()
}

async function copyImageUrl() {
  const src = props.editor?.getAttributes('image')?.src
  if (!src) return

  const ok = await copyImageToClipboard(src) ; if (!ok) return
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

function triggerReplaceAudio() {
  audioFileInput.value?.click()
}

async function onAudioFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !props.editor) return
  const identifier = props.identifier || String(currentRoute.params.identifier || '')

  if (!identifier) {
    // fallback: base64
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => {
      props.editor?.chain().focus().updateAttributes('audio', { src: fr.result }).run()
    }
    input.value = ''
    return
  }

  // Try server upload
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await fetch(`/api/posts/${encodeURIComponent(identifier)}/audios`, { method: 'POST', body: form })
    const json = await res.json()
    if (res.ok && json?.audio?.src) {
      props.editor?.chain().focus().updateAttributes('audio', { src: json.audio.src }).run()
    } else {
      // fallback base64
      const fr = new FileReader()
      fr.readAsDataURL(file)
      fr.onload = () => {
        props.editor?.chain().focus().updateAttributes('audio', { src: fr.result }).run()
      }
    }
  } catch (err) {
    // fallback base64
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => {
      props.editor?.chain().focus().updateAttributes('audio', { src: fr.result }).run()
    }
  } finally {
    input.value = ''
  }
}

function deleteSelectedAudio() {
  if (!props.editor) return
  props.editor.chain().focus().deleteSelection().run()
}

/**
 * Reset the selection's content.
 */
function resetEditor() {
  if (!props.editor) return
  const ed = props.editor ; if (!ed) return
  const { from, to, empty } = ed.state.selection

  // If selection is not empty: extract plain text, delete selection, insert plain text back (clearing marks/nodes)
  if (!empty) {
    const txt = ed.state.doc.textBetween(from, to, '', '\n')
    try {
      ed.chain().focus().deleteRange({ from, to }).insertContentAt(from, txt).setParagraph().run()
    } catch (err) {
      try { ed.commands.deleteRange({ from, to }); ed.commands.insertContentAt(from, txt) } catch {}
    }
    return
  }

  // If selection is empty: reset the current block (node) that contains the cursor.
  try {
    const $from = ed.state.selection.$from
    const depth = $from.depth
    const start = $from.start(depth)
    const end = $from.end(depth)
    // extract plain text of block
    const blockText = ed.state.doc.textBetween(start, end, '', '\n')
    // replace block with a plain paragraph containing the same text but without formatting
    try {
      ed.chain().focus().deleteRange({ from: start, to: end }).insertContentAt(start, blockText).setParagraph().run()
    } catch (err) {
      try { ed.commands.deleteRange({ from: start, to: end }); ed.commands.insertContentAt(start, blockText) } catch {}
    }
  } catch (err) { /* swallow any errors for robustness */ }
}
</script>
