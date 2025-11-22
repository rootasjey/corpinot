<template>
  <div class="post-content relative">
    <!-- Upload progress indicators for inline images -->
    <div v-if="uploadingImages.length > 0" class="upload-indicator fixed top-4 right-4 z-50 w-64 bg-background border border-border rounded-lg shadow-lg p-2">
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
    <!-- Bubble Menu for Formatting -->
    <BubbleMenu
      v-if="editor && editable"
      :editor="editor"
      :options="{ placement: 'top' }"
      :should-show="shouldShowFormattingMenu"
      class="bubble-menu"
    >
      <!-- Block Type Dropdown (Una UI) -->
      <NDropdownMenu :items="blockDropdownItems" class="menu-block-type">
        <NButton
          btn="~"
          class="flex items-center gap-1 px-2 py-1 hover:bg-muted rounded text-sm font-medium min-w-[120px]"
          :leading="currentBlockType?.icon"
        >
          <span class="flex-1 text-left">{{ currentBlockType?.label }}</span>
          <span class="i-lucide-chevron-down text-xs opacity-50" />
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
        v-if="editor && editable"
        :show="linkVisible"
        @update:show="onPopoverUpdate"
        trigger="manual"
        placement="top"
        :show-arrow="false"
        :_popover-content="{
          class: 'py-0 px-1 w-auto rounded-4',
        }"
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

      <!-- Text color / highlight popover -->
      <NPopover
        v-if="editor && editable"
        ref="colorPopover"
        trigger="manual"
        placement="top"
        :show="colorPopoverVisible"
        @update:show="(v: boolean) => colorPopoverVisible = v"
        :_popover-content="{ class: 'py-1 px-2 w-auto rounded-4' }"
      >
        <template #trigger>
          <button @click="colorPopoverVisible = !colorPopoverVisible" type="button">
            <span class="i-lucide-droplet" />
            <span
              v-if="hasAnyColor"
              class="color-preview"
              :style="{ background: selectionBackgroundColor || selectionTextColor || 'transparent', borderColor: selectionTextColor || 'transparent' }"
            />
          </button>
        </template>

        <div class="flex flex-col gap-2 p-2">
          <div class="flex flex-col gap-2">
            <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Highlight</div>
            <div class="color-grid">
              <button
                v-for="col in highlightPalette"
                :key="col"
                type="button"
                :style="{ background: col }"
                class="color-swatch"
                @click="setHighlight(col)"
                :aria-label="`Set highlight ${col}`"
              />
              <button type="button" class="color-swatch clear" @click="clearHighlight" title="Clear highlight">×</button>
            </div>
          </div>

          <div class="flex flex-col gap-2 mb-2">
            <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Text</div>
            <div class="color-grid">
              <button
                v-for="col in palette"
                :key="col"
                type="button"
                :style="{ background: col }"
                class="color-swatch"
                @click="setTextColor(col)"
                :aria-label="`Set text color ${col}`"
              />
              <button type="button" class="color-swatch clear" @click="clearTextColor" title="Clear text color">×</button>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <div class="text-xs font-600 color-gray-700 dark:color-gray-300">Background</div>
            <div class="color-grid">
              <button
                v-for="col in backgroundPalette"
                :key="col"
                type="button"
                :style="{ background: col }"
                class="color-swatch"
                @click="setBackgroundColor(col)"
                :aria-label="`Set background ${col}`"
              />
              <button type="button" class="color-swatch clear" @click="clearBackgroundColor" title="Clear background">×</button>
            </div>
          </div>
        </div>
      </NPopover>
    </BubbleMenu>

    <FloatingSlashMenu
      v-if="editor && editable"
      :editor="editor"
      :editable="editable"
      :should-show="shouldShowFloatingMenu"
      :actions="floatingActions"
      @select="selectFloatingAction"
    />

    <EditorContent :editor="editor" />
    <DragHandle v-if="editor && editable" :editor="editor">
      <NIcon name="i-ph-dots-six-vertical-bold" />
    </DragHandle>
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent, Editor } from '@tiptap/vue-3'
import { ref, watch, nextTick, onBeforeUnmount, computed } from 'vue'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import FloatingSlashMenu from './FloatingSlashMenu.vue'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, BackgroundColor } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Image from '@tiptap/extension-image'
import NodeRange from '@tiptap/extension-node-range'
import DragHandle from '@tiptap/extension-drag-handle-vue-3'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import type { EditorState } from '@tiptap/pm/state'
import FileHandler from '@tiptap/extension-file-handler'
import { useRoute } from '#imports'

interface Props {
  content: string | object;  // Allow both HTML string and Tiptap JSON
  editable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  editable: false
})

const emit = defineEmits<{
  update: [content: string]
  'update:content': [json: object]
  'editor-ready': [editor: any]
}>()

const editor = useEditor({
  content: props.content,
  editable: props.editable,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4],
      },
      link: {
        openOnClick: false,
      },
    }),
    FileHandler.configure({
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
      // Upload images to server-side R2 for persistence and CDN friendliness.
      onDrop: async (currentEditor, files, pos) => {
        // If we are editing an existing post (route identifier exists), upload
        // images to POST /api/posts/:identifier/images and insert returned URL.
        const identifier = String(routeForUpload.params.identifier ?? '')

        for (const file of files) {
          const uploadId = addUploading(file.name)
          try {
            if (identifier) {
              try {
                const json = await uploadFileWithProgress(identifier, file, (p) => updateUploading(uploadId, p), uploadId)
                const src = json?.image?.src ?? null
                if (src) {
                  currentEditor.chain().insertContentAt(pos, { type: 'image', attrs: { src } }).focus().run()
                  continue
                }
              } catch (e: any) {
                // If the upload was aborted by the user, stop processing this file
                if (e && typeof e === 'object' && e.aborted) {
                  // Don't insert fallback content — user cancelled
                  continue
                }
                // otherwise fall through to inline fallback
              }
            }

            // Fallback: insert a base64 data URL when upload not available
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            await new Promise<void>((resolve) => {
              fileReader.onload = () => {
                currentEditor
                  .chain()
                  .insertContentAt(pos, { type: 'image', attrs: { src: fileReader.result } })
                  .focus()
                  .run()
                resolve()
              }
            })
          } catch (err) {
            // On error, fallback to inline base64 as above
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(pos, { type: 'image', attrs: { src: fileReader.result } })
                .focus()
                .run()
            }
          } finally {
            removeUploading(uploadId)
          }
        }
      },

      onPaste: async (currentEditor, files) => {
        const identifier = String(routeForUpload.params.identifier ?? '')

        for (const file of files) {
          const uploadId = addUploading(file.name)
          try {
            if (identifier) {
              try {
                const json = await uploadFileWithProgress(identifier, file, (p) => updateUploading(uploadId, p), uploadId)
                const src = json?.image?.src ?? null
                if (src) {
                  currentEditor
                    .chain()
                    .insertContentAt(currentEditor.state.selection.anchor, { type: 'image', attrs: { src } })
                    .focus()
                    .run()
                  continue
                }
              } catch (e: any) {
                if (e && typeof e === 'object' && e.aborted) {
                  // upload was cancelled — skip this file
                  continue
                }
                // otherwise continue to base64 fallback
              }
            }

            // Fallback to base64 if upload is not available
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            await new Promise<void>((resolve) => {
              fileReader.onload = () => {
                currentEditor
                  .chain()
                  .insertContentAt(currentEditor.state.selection.anchor, { type: 'image', attrs: { src: fileReader.result } })
                  .focus()
                  .run()
                resolve()
              }
            })
          } catch (err) {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
              currentEditor
                .chain()
                .insertContentAt(currentEditor.state.selection.anchor, { type: 'image', attrs: { src: fileReader.result } })
                .focus()
                .run()
            }
          } finally {
            removeUploading(uploadId)
          }
        }
      },
    }),
    Placeholder.configure({
      // Only show placeholder in paragraph (and optionally heading) nodes so
      // it doesn't duplicate inside list items or task items.
      placeholder: ({ node }) => {
        if (node.type.name === 'paragraph') return 'Here is my thoughts about... (/ for commands)'
        if (node.type.name === 'heading') return 'Heading...'
        return ''
      },
      includeChildren: true,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Image,
    Table.configure({
      resizable: true,
    }),
    TextStyle,
    BackgroundColor,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    NodeRange,
    TableRow,
    TableHeader,
    TableCell,
  ],
  editorProps: {
    attributes: {
      class: 'prose prose-lg max-w-none focus:outline-none',
    },
  },
  onUpdate: ({ editor }) => {
    // emit('update', editor.getHTML());
    // Also emit JSON for API persistence
    emit('update:content', editor.getJSON());
  },
});

// Expose (emit) the editor instance to the parent when it's available so
// parent components can control editor actions like undo/redo.
watch(
  () => editor.value,
  (ed) => {
    // Only emit editor instance when the editor is editable — parent controls
    // actions like undo/redo only for editable editors.
    if (ed && props.editable) emit('editor-ready', ed)
  },
  { immediate: true }
)

const blockTypes = [
  {
    label: 'Text',
    icon: 'i-lucide-pilcrow',
    isActive: () => editor.value?.isActive('paragraph'),
    action: () => editor.value?.chain().focus().setParagraph().run()
  },
  {
    label: 'Heading 1',
    icon: 'i-lucide-heading-1',
    isActive: () => !!editor.value?.isActive('heading', { level: 1 }),
    action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
  },
  {
    label: 'Heading 2',
    icon: 'i-lucide-heading-2',
    isActive: () => !!editor.value?.isActive('heading', { level: 2 }),
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
  },
  {
    label: 'Heading 3',
    icon: 'i-lucide-heading-3',
    isActive: () => editor.value?.isActive('heading', { level: 3 }),
    action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
  },
  {
    label: 'Bullet List',
    icon: 'i-lucide-list',
    isActive: () => !!editor.value?.isActive('bulletList'),
    action: () => editor.value?.chain().focus().toggleBulletList().run()
  },
  {
    label: 'Numbered List',
    icon: 'i-lucide-list-ordered',
    isActive: () => !!editor.value?.isActive('orderedList'),
    action: () => editor.value?.chain().focus().toggleOrderedList().run()
  },
  {
    label: 'To-do List',
    icon: 'i-lucide-check-square',
    isActive: () => !!editor.value?.isActive('taskList'),
    action: () => editor.value?.chain().focus().toggleTaskList().run()
  },
  {
    label: 'Blockquote',
    icon: 'i-lucide-quote',
    isActive: () => !!editor.value?.isActive('blockquote'),
    action: () => editor.value?.chain().focus().toggleBlockquote().run()
  },
  {
    label: 'Code Block',
    icon: 'i-lucide-code-2',
    isActive: () => editor.value?.isActive('codeBlock'),
    action: () => editor.value?.chain().focus().toggleCodeBlock().run()
  }
]

const currentBlockType = computed(() => {
  if (!editor.value) return blockTypes[0]
  return blockTypes.find(type => type.isActive()) || blockTypes[0]
})

// --- Upload state & helpers (for showing progress while uploading editor images) ---
const routeForUpload = useRoute()
const uploadingImages = ref<Array<{ id: string; name: string; progress: number }>>([])

const addUploading = (name: string) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  uploadingImages.value.push({ id, name, progress: 0 })
  return id
}

const updateUploading = (id: string, p: number) => {
  const idx = uploadingImages.value.findIndex(u => u.id === id)
  if (idx >= 0) {
    const item = uploadingImages.value[idx]
    if (item) item.progress = p
  }
}

const removeUploading = (id: string) => {
  uploadingImages.value = uploadingImages.value.filter(u => u.id !== id)
}

const uploadRequests = new Map<string, XMLHttpRequest>()

const uploadFileWithProgress = (identifier: string, file: File, onProgress: (p: number) => void, id?: string) => {
  return new Promise<any>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      const url = `/api/posts/${encodeURIComponent(identifier)}/images`
      xhr.open('POST', url)

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        if (id) uploadRequests.delete(id)
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(json)
        } catch (e) {
          reject(e)
        }
      }

      xhr.onerror = () => {
        if (id) uploadRequests.delete(id)
        reject(new Error('Network error'))
      }
      xhr.onabort = () => {
        if (id) uploadRequests.delete(id)
        reject({ aborted: true })
      }

      const form = new FormData()
      form.append('file', file)
      form.append('fileName', file.name)
      form.append('type', file.type)
      // Keep a reference to the request so callers (and UI) can abort it
      if (id) uploadRequests.set(id, xhr)

      xhr.send(form)
    } catch (err) {
      reject(err)
    }
  })
}

const cancelUpload = (id: string) => {
  const req = uploadRequests.get(id)
  if (req) {
    try {
      req.abort()
    } catch (e) {
      // ignore abort errors
    }
    uploadRequests.delete(id)
  }
  // Remove from UI list
  removeUploading(id)
}

const setBlockType = (type: any) => {
  type.action()
}

const blockDropdownItems = computed(() => {
  // Group the text-like blocks (plain text + headings) and other block types
  const textGroup = blockTypes.slice(0, 4).map((type) => ({
    label: type.label,
    leading: type.icon,
    trailing: type.isActive() ? 'i-ph-check' : undefined,
    onSelect: () => setBlockType(type),
  }))

  const otherGroup = blockTypes.slice(4).map((type) => ({
    label: type.label,
    leading: type.icon,
    trailing: type.isActive() ? 'i-ph-check' : undefined,
    onSelect: () => setBlockType(type),
  }))

  return [
    { label: 'Turn Into', items: textGroup },
    { label: 'Format', items: otherGroup },
  ]
})

const addImage = () => {
  const url = window.prompt('URL')
  if (url && editor.value) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

interface FloatingAction {
  label: string
  icon?: string
  isActive?: () => boolean
  action: () => void | Promise<void>
}

const floatingActions = [
  {
    label: 'H1',
    icon: 'i-lucide-heading-1',
    isActive: () => editor.value?.isActive('heading', { level: 1 }) ?? false,
    action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    label: 'H2',
    icon: 'i-lucide-heading-2',
    isActive: () => editor.value?.isActive('heading', { level: 2 }) ?? false,
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    label: 'H3',
    icon: 'i-lucide-heading-3',
    isActive: () => editor.value?.isActive('heading', { level: 3 }) ?? false,
    action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    label: 'Bulleted',
    icon: 'i-lucide-list',
    isActive: () => editor.value?.isActive('bulletList') ?? false,
    action: () => toggleBulletListWithEnter(),
  },
  {
    label: 'Numbered',
    icon: 'i-lucide-list-ordered',
    isActive: () => editor.value?.isActive('orderedList') ?? false,
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
  },
  {
    label: 'To-do',
    icon: 'i-lucide-check-square',
    isActive: () => editor.value?.isActive('taskList') ?? false,
    action: () => editor.value?.chain().focus().toggleTaskList().run(),
  },
  {
    label: 'Blockquote',
    icon: 'i-lucide-quote',
    isActive: () => editor.value?.isActive('blockquote') ?? false,
    action: () => editor.value?.chain().focus().toggleBlockquote().run(),
  },
  {
    label: 'Image',
    icon: 'i-lucide-image',
    isActive: () => false,
    action: () => addImage(),
  },
]

const deleteSlashIfPresent = () => {
  const ed = editor.value ; if (!ed) return
  const pos = ed.state.selection.from ; if (typeof pos !== 'number' || pos <= 0) return

  try {
    const charBefore = ed.state.doc.textBetween(pos - 1, pos, '', '\n')
    if (charBefore !== '/') return
    // Delete the slash via a prosemirror transaction. This is reliable
    // across versions and avoids relying on a non-standard editor command.
    const tr = ed.state.tr.delete(pos - 1, pos)
    ed.view.dispatch(tr)

    // Move caret to the deletion point
    // Use setTextSelection command to keep Tiptap in sync
    // We prefer chain().focus() where possible.
    ed.chain().focus().setTextSelection(pos - 1).run()
  } catch (err) {
    // ignore
  }
}

const selectFloatingAction = async (item: FloatingAction, idx: number) => {
  if (!editor.value) return
  deleteSlashIfPresent()
  await item.action?.()
  editor.value.chain().focus().run() // restore focus after action
}

const toggleBulletListWithEnter = () => {
  if (!editor.value) return
  editor.value.chain().focus().toggleBulletList().run()

  // If inside a list now, split into a new list item so the user can type
  if (!editor.value.isActive('bulletList')) return
  editor.value.chain().focus().splitListItem('listItem').run()
}

const linkUrl = ref('')
// When true, the link popover was explicitly opened by the user (click or creating new link)
const manualLinkOpen = ref(false)
// store the dom handler for cleanup
let editorClickHandler: ((e: Event) => void) | null = null
let editorSelectionHandler: ((e: Event) => void) | null = null

const shouldShowFormattingMenu = (props: any) => {
  const { editor, state } = props
  const { selection } = state
  const { empty } = selection
  // Keep formatting menu open when link is active and the link bubble should be shown
  // (manual open) — otherwise show it only when there's a selection.
  return !empty || (!!editor && editor.isActive('link') && manualLinkOpen.value)
}

const shouldShowFloatingMenu = (props: any) => {
  // Only show the floating menu when the caret is collapsed (no selection)
  // and the character immediately before the caret is a slash `/`.
  if (!props || !props.state) return false

  const state = props.state as EditorState
  const { selection } = state
  // Only when caret is collapsed
  const { empty } = selection ; if (!empty) return false
  const pos = selection.from ; if (typeof pos !== 'number' || pos <= 0) return false

  try {
    const charBefore = state.doc.textBetween(pos - 1, pos, '', '\n')
    return charBefore === '/'
  } catch (e) {
    return false
  }
}

const setLink = () => {
  if (!editor.value) return

  const previousUrl = editor.value.getAttributes('link').href
  linkUrl.value = previousUrl || ''

  // If link already active, the link bubble will show (populated by watch)
  if (editor.value.isActive('link')) return
  const { from, to, empty } = editor.value.state.selection

  if (!empty) {
    // If we have a selection, attach a (blank) link so the bubble opens for editing
    editor.value.chain().focus().extendMarkRange('link').setLink({ href: '' }).run()
    manualLinkOpen.value = true
  }

  // If selection empty, insert a small placeholder so user can edit with the bubble
  const placeholder = 'link'
  editor.value
    .chain()
    .focus()
    // insert the placeholder and select it, then create an empty link mark
    .insertContentAt(from, placeholder)
    .setTextSelection({ from: from, to: from + placeholder.length })
    .extendMarkRange('link')
    .setLink({ href: '' })
    .run()
  
    // Keep it in manualOpen so it stays after the insert selection
  manualLinkOpen.value = true
}

// ========================
// Text color / highlight
// ========================
const palette = [
  '#111827', // gray-900
  '#374151', // gray-700
  '#6B7280', // gray-500
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#f59e0b', // yellow-500
  '#10b981', // green-500
  '#3b82f6', // blue-500
  '#6366f1', // indigo-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
]

const highlightPalette = [
  '#fff7ed', // amber-50
  '#ffedd5', // orange-50
  '#fef3c7', // yellow-50
  '#ecfeff', // cyan-50
  '#ecfccb', // lime-50
  '#eef2ff', // indigo-50
  '#56DFCF', // custom light teal
  '#FFD66B', // custom light yellow
  '#FF6363', // custom light red
]

const backgroundPalette = [
  '#fff7ed',
  '#ffedd5',
  '#fef3c7',
  '#ecfeff',
  '#ecfccb',
  '#eef2ff',
  '#FEEBF6',
  '#EBD6FB',
  '#8F87F1',
  '#C68EFD',
]

const DEFAULT_HIGHLIGHT = '#fef3c7'

const setTextColor = (color: string) => {
  editor.value?.chain().focus().setColor(color).run()
}

const clearTextColor = () => {
  editor.value?.chain().focus().unsetColor().run()
}

const setHighlight = (color?: string) => {
  const col = color ?? DEFAULT_HIGHLIGHT
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

const selectionTextColor = computed(() => {
  if (!editor.value) return ''
  const ts = editor.value.getAttributes('textStyle') || {}
  // prefer explicit text color set via textStyle; fallback to highlight color
  return ts?.color || editor.value.getAttributes('highlight')?.color || ''
})

const selectionBackgroundColor = computed(() => {
  if (!editor.value) return ''
  const ts = editor.value.getAttributes('textStyle') || {}
  return ts?.backgroundColor || ''
})

const hasAnyColor = computed(() => {
  return !!(selectionTextColor.value || selectionBackgroundColor.value)
})

const updateLink = () => {
  if (linkUrl.value === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  
  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.value }).run()
}

const removeLink = () => {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
}

const openLink = () => {
  if (linkUrl.value) {
    window.open(linkUrl.value, '_blank')
  }
}

const linkInput = ref<any | null>(null)
const linkAnchor = ref<HTMLElement | null>(null)
const anchorStyle = ref({ position: 'absolute', left: '0px', top: '0px', width: '1px', height: '1px', display: 'none' })

const colorPopoverVisible = ref(false)

  const linkVisible = computed(() => {
  const ed = editor.value
  if (!ed) return false
  return ed.isActive('link') && (manualLinkOpen.value || !ed.state.selection.empty)
})

watch(linkVisible, async (isActive) => {
  if (!isActive) {
    manualLinkOpen.value = false
    return
  }

  linkUrl.value = editor.value?.getAttributes('link').href || ''
})

const updateAnchorPosition = () => {
  if (!editor.value || !linkAnchor.value) return

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    anchorStyle.value.display = 'none'
    return
  }

  const range = sel.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  if (!rect || (rect.height === 0 && rect.width === 0)) {
    // Fallback: anchor to editor element center
    const edRect = editor.value.view.dom.getBoundingClientRect()
    anchorStyle.value.left = `${edRect.left + edRect.width / 2}px`
    anchorStyle.value.top = `${edRect.top + edRect.height / 2}px`
  } else {
    // Position our anchor relative to the editor container (post-content is relative)
    const containerRect = editor.value.view.dom.getBoundingClientRect()
    anchorStyle.value.left = `${rect.left - containerRect.left + rect.width / 2}px`
    anchorStyle.value.top = `${rect.top - containerRect.top - 8}px`
  }
  anchorStyle.value.display = ''
}

watch(linkVisible, async (showing) => {
  if (!showing) return
  await nextTick()
  updateAnchorPosition()
  await nextTick()

  if (!linkInput.value) return
  // focus the naive NInput's internal input using querySelector
  const el = linkInput.value.$el || linkInput.value
  const input = el?.querySelector ? el.querySelector('input') : null
  input?.focus()
  const val = input?.value
  input?.setSelectionRange(val?.length ?? 0, val?.length ?? 0)
})

// Attach DOM click handler to detect explicit user clicks on <a> links so we
// don't auto-open the link bubble when caret moves. We manage a manual flag
// `manualLinkOpen` which is set to true only when the user clicked a link or
// programmatically created a new link via `setLink()`.
const onPopoverUpdate = (val: boolean) => {
  if (!val) {
    manualLinkOpen.value = false
  }
}

watch(
  () => editor.value,
  (ed) => {
    if (!ed || !ed.view || !ed.view.dom) return

    const handler = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target) return
      // Don't open the link popover when clicking directly on a link — user wants
      // to click without editing. Only open link popover via toolbar or selection.
      if (target.closest('a')) {
        manualLinkOpen.value = false
        return
      }
      // clicking elsewhere should close the manual link state
      manualLinkOpen.value = false
    }

    if (editorClickHandler && ed.view?.dom) {
      ed.view.dom.removeEventListener('mousedown', editorClickHandler)
      if (editorSelectionHandler && ed.view?.dom) {
        ed.view.dom.removeEventListener('mouseup', editorSelectionHandler)
        ed.view.dom.removeEventListener('keyup', editorSelectionHandler)
      }
      editorClickHandler = null
    }

    ed.view.dom.addEventListener('mousedown', handler)
    // reposition the anchor when link selection changes or caret moves
    ed.view.dom.addEventListener('mouseup', updateAnchorPosition)
    ed.view.dom.addEventListener('keyup', updateAnchorPosition)
    editorSelectionHandler = updateAnchorPosition
    editorClickHandler = handler
  },
  { immediate: true }
)

// Watch for content changes from parent
watch(() => props.content, (newContent) => {
  if (!editor.value || !newContent) return
  if (typeof newContent !== 'string') { // JSON object
    editor.value.commands.setContent(newContent)
    return
  }

  if (editor.value.getHTML() !== newContent) { // HTML string
    editor.value.commands.setContent(newContent);
  }
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  // key handlers are attached to the floating menu element itself
  // FloatingSlashMenu manages focus listeners; nothing to clean up here.
  if (editorClickHandler && editor.value?.view?.dom) {
    editor.value.view.dom.removeEventListener('mousedown', editorClickHandler)
    editorClickHandler = null
  }
  if (editorSelectionHandler && editor.value?.view?.dom) {
    editor.value.view.dom.removeEventListener('mouseup', editorSelectionHandler)
    editor.value.view.dom.removeEventListener('keyup', editorSelectionHandler)
    editorSelectionHandler = null
  }
});
</script>

<style>
/* Tiptap Editor Styles */
.post-content {
  @apply text-foreground;
}

.post-content .ProseMirror {
  @apply focus:outline-none border-none ring-none shadow-none;
}

/* Placeholder */
/*
 Fix: Tiptap may apply either `is-editor-empty` or `is-empty` depending on version
 and configuration. Use attribute selector to reliably show the content of the
 placeholder (`data-placeholder`) for any empty paragraph node.
*/
/* Overlaying placeholder for paragraphs, headings, list items and blockquotes.
   We position the pseudo-element absolutely so it doesn't affect layout. This
   ensures the caret remains in the expected flow while placeholder text appears
   next to the caret. */
.post-content .ProseMirror [data-placeholder].is-editor-empty,
.post-content .ProseMirror [data-placeholder].is-empty {
  position: relative;
}

.post-content .ProseMirror p[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror p[data-placeholder].is-empty::after,
.post-content .ProseMirror h1[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h1[data-placeholder].is-empty::after,
.post-content .ProseMirror h2[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h2[data-placeholder].is-empty::after,
.post-content .ProseMirror h3[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h3[data-placeholder].is-empty::after,
.post-content .ProseMirror h4[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror h4[data-placeholder].is-empty::after,
.post-content .ProseMirror li[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror li[data-placeholder].is-empty::after,
.post-content .ProseMirror blockquote[data-placeholder].is-editor-empty::after,
.post-content .ProseMirror blockquote[data-placeholder].is-empty::after {
  content: attr(data-placeholder);
  color: #adb5bd;
  position: absolute;
  left: 0.125rem; /* small offset for readability */
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  opacity: 0.9;
  white-space: pre-wrap;
  z-index: 0; /* keep caret visually above (caret is part of the content) */
}

/* The caret should remain visible above the placeholder text; ensure the text
   node paints above the placeholder in browsers that render differently. */
.post-content .ProseMirror [data-placeholder].is-editor-empty::selection,
.post-content .ProseMirror [data-placeholder].is-empty::selection {
  background: transparent;
}

/* Typography Styles */
.post-content .ProseMirror h1 {
  @apply text-4xl font-serif font-800 mt-12 mb-6 leading-tight;
}

.post-content .ProseMirror h2 {
  @apply text-3xl font-serif font-800 mt-10 mb-5 leading-snug;
}

.post-content .ProseMirror h3 {
  @apply text-2xl font-serif font-500 mt-8 mb-4;
}

.post-content .ProseMirror h4 {
  @apply text-xl font-serif font-500 mt-6 mb-3;
}

.post-content .ProseMirror p {
  @apply text-base md:text-lg leading-relaxed mb-8 text-foreground/80 font-body font-500;
}

.post-content .ProseMirror a {
  @apply text-primary hover:text-primary/80 underline decoration-2 underline-offset-2 transition-colors;
}

.post-content .ProseMirror strong {
  @apply font-800 text-foreground;
}

.post-content .ProseMirror em {
  @apply italic;
}

.post-content .ProseMirror blockquote {
  @apply border-l-4 border-primary/40 pl-6 py-4 my-8 italic text-lg md:text-xl text-muted bg-muted/20 rounded-r-lg;
}

.post-content .ProseMirror blockquote p {
  @apply mb-0;
}

.post-content .ProseMirror ul,
.post-content .ProseMirror ol {
  @apply my-6 ml-6 space-y-2;
}

.post-content .ProseMirror ul {
  @apply list-disc;
}

.post-content .ProseMirror ol {
  @apply list-decimal;
}

.post-content .ProseMirror li {
  @apply text-base md:text-lg leading-relaxed text-foreground/90;
}

.post-content .ProseMirror li > p {
  @apply mb-2;
}

.post-content .ProseMirror code {
  @apply bg-muted px-2 py-1 rounded text-sm font-mono text-primary;
}

.post-content .ProseMirror pre {
  @apply bg-muted p-4 rounded-lg overflow-x-auto my-6;
}

.post-content .ProseMirror pre code {
  @apply bg-transparent p-0 text-foreground;
}

.post-content .ProseMirror img {
  @apply w-full h-auto rounded-xl my-8 shadow-lg;
}

.post-content .ProseMirror-selectednode::selection {
  color: var(--una-foreground, #111827);
}

/* Drag handle styles (placed under post-content) */
.post-content :is(.tiptap-drag-handle, .drag-handle) {
  position: absolute; /* plugin computes position */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: rgba(0,0,0,0.02);
  cursor: grab;
  transition: background-color .12s ease, transform .12s ease;
  z-index: 60;
}
.post-content :is(.tiptap-drag-handle:hover, .drag-handle:hover) {
  background: rgba(0,0,0,0.06);
}

.post-content .ProseMirror hr {
  @apply my-12 border-border;
}

/* Task List */
.post-content .ProseMirror ul[data-type="taskList"] {
  @apply list-none ml-0 p-0;
}

.post-content .ProseMirror ul[data-type="taskList"] li {
  @apply flex items-start gap-2;
}

.post-content .ProseMirror ul[data-type="taskList"] li > label {
  @apply flex-shrink-0 mt-1 select-none mr-2;
}

.post-content .ProseMirror ul[data-type="taskList"] li > div {
  @apply flex-auto;
}

/* Table Styles */
.post-content .ProseMirror table {
  @apply w-full my-8 border-collapse;
}

.post-content .ProseMirror th {
  @apply bg-muted font-semibold text-left p-3 border border-border;
}

.post-content .ProseMirror td {
  @apply p-3 border border-border;
}

/* First paragraph special styling (drop cap effect could be added here) */
.post-content .ProseMirror > p:first-of-type {
  @apply text-xl md:text-2xl font-light mb-8;
}

/* Bubble Menu & Floating Menu */
.bubble-menu, .floating-menu, .link-popover {
  @apply bg-background border border-border rounded-lg shadow-lg flex items-center gap-1 p-1;
}

.menu-block-type .n-dropdown-menu__trigger {
  @apply p-0 min-w-[120px];
}

.bubble-menu button, .floating-menu button, .link-popover button {
  @apply p-1.5 rounded-md text-foreground/80 hover:bg-muted hover:text-primary transition-colors flex items-center justify-center min-w-[28px];
}

.bubble-menu button.is-active, .floating-menu button.is-active, .link-popover button.is-active {
  @apply bg-primary/10 text-primary;
}

/* Focus visual for floating menu items */
.floating-menu button:focus {
  outline: none;
}

.bubble-menu .divider, .link-popover .divider {
  @apply w-px h-5 bg-border mx-1;
}

/* Layer link bubble above main formatting bubble and offset it a little */
.bubble-menu {
  z-index: 12;
}

.link-popover {
  z-index: 13;
}

.link-popover-anchor {
  position: absolute;
  width: 2px;
  height: 2px;
  pointer-events: none;
}

/* Ensure the naive popover content matches the bubble menu visual style */
.link-popover .n-popover__content {
  @apply bg-background border border-border rounded-lg shadow-lg flex items-center gap-1 p-1;
}
.link-popover .n-popover__content .n-input {
  @apply bg-transparent;
}
.link-popover .n-popover__content .n-button {
  @apply p-1.5 rounded-md text-foreground/80 hover:bg-muted hover:text-primary transition-colors min-w-[28px];
}
</style>

<style scoped>

/* Color swatches */
.color-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.25rem;
}
.color-swatch {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 0.45rem;
  border: 1px solid rgba(0,0,0,0.06);
  box-shadow: 0 0 0 1px rgba(0,0,0,0.02) inset;
  transition: all 0.2s;
}

.color-swatch.clear {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  color: var(--un-foreground-color, #111827);
  background: transparent;
}
.dark .color-swatch.clear {
  color: var(--un-foreground-color, #f9fafb);
  border: 1px solid rgba(255,255,255,0.3);
}

.color-swatch:hover {
  transform: scale(1.2);
}
.color-swatch:active {
  /* border-radius: 0.8rem; */
  transform: scale(0.9);
}

.color-preview {
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  margin-left: 0.375rem;
  border-radius: 9999px;
  border: 2px solid transparent;
}
</style>
