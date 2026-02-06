<template>
  <div class="post-content post-content--editor relative">
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

    <!-- Upload progress indicators for inline videos -->
    <div v-if="uploadingVideos.length > 0" class="upload-indicator fixed top-4 right-4 z-8 w-64 bg-background border border-border rounded-lg shadow-lg p-2 mt-20">
      <div class="font-semibold text-sm mb-2">Uploading video{{ uploadingVideos.length > 1 ? 's' : '' }}</div>
      <div class="space-y-2 max-h-40 overflow-auto">
        <div v-for="u in uploadingVideos" :key="u.id" class="flex items-center gap-2">
          <div class="flex-1">
            <div class="text-xs truncate">{{ u.name }}</div>
            <div class="h-2 bg-muted rounded mt-1 overflow-hidden">
              <div class="h-full bg-primary transition-all" :style="{ width: u.progress + '%' }"></div>
            </div>
          </div>
          <div class="text-xs w-10 text-right">{{ u.progress }}%</div>
          <button @click.prevent="cancelVideoUpload(u.id)" type="button" class="text-xs ml-1 p-1 rounded hover:bg-muted" title="Cancel upload">
            <span class="i-lucide-x" />
          </button>
        </div>
      </div>
    </div>

    <!-- Upload progress indicators for inline audios -->
    <div v-if="uploadingAudios.length > 0" class="upload-indicator fixed top-4 right-4 z-8 w-64 bg-background border border-border rounded-lg shadow-lg p-2 mt-40">
      <div class="font-semibold text-sm mb-2">Uploading audio{{ uploadingAudios.length > 1 ? 's' : '' }}</div>
      <div class="space-y-2 max-h-40 overflow-auto">
        <div v-for="u in uploadingAudios" :key="u.id" class="flex items-center gap-2">
          <div class="flex-1">
            <div class="text-xs truncate">{{ u.name }}</div>
            <div class="h-2 bg-muted rounded mt-1 overflow-hidden">
              <div class="h-full bg-primary transition-all" :style="{ width: u.progress + '%' }"></div>
            </div>
          </div>
          <div class="text-xs w-10 text-right">{{ u.progress }}%</div>
          <button @click.prevent="cancelAudioUpload(u.id)" type="button" class="text-xs ml-1 p-1 rounded hover:bg-muted" title="Cancel upload">
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
      :vertical="slashMenuVertical"
      @select="selectFloatingAction"
      :onInsertImages="onInsertImages"
      :onInsertGallery="onInsertGallery"
      :on-configure-models="props.onConfigureModels"
    />

    <UncommonNodesPicker v-model:open="uncommonNodesOpen" @select="onUncommonSelect" />

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

    <MediaInsertDialog
      v-model:open="mediaDialogOpen"
      :media-type="mediaDialogType"
      @insert="onMediaInsert"
      @insert-link="onMediaInsertLink"
    />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey, TextSelection } from 'prosemirror-state'
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
import { Video } from './Video'
import { Audio } from './Audio'
import { Conway } from './Conway'
import { HorizontalCard } from './HorizontalCard'
import AutoLinkPlugin from './AutoLinkPlugin'
import { AutoLinkPreview } from './AutoLinkPreview'
import NodeRange from '@tiptap/extension-node-range'
import Separator from './Separator'
import EditorDragHandleMenu from './EditorDragHandleMenu.vue'
import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table'
import FileHandler from '@tiptap/extension-file-handler'
import { watch, onBeforeUnmount, computed, toRaw, ref } from 'vue'
import FloatingSlashMenu from '../FloatingSlashMenu.vue'
import EditorBubbleMenu from './EditorBubbleMenu.vue'
import MediaInsertDialog from './MediaInsertDialog.vue'
import UncommonNodesPicker from './UncommonNodesPicker.vue'
import { useRoute } from '#imports'
import type { EditorState } from '@tiptap/pm/state'
import type { BlockType } from '~~/shared/types/nodes'
import type { AICommand } from '~/composables/useAIWriter'
import { useLowlight } from '~/composables/useCodeHighlight'
import { useEditorSettings } from '~/composables/useEditorSettings'
import { useEditorVideos } from '~/composables/useEditorVideos'
import { useEditorAudio } from '~/composables/useEditorAudio'
import { generatePosterFromVideoFile } from '~/composables/generateVideoPoster' 

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

const {
  uploadingVideos,
  addUploading: addVideoUploading,
  updateUploading: updateVideoUploading,
  removeUploading: removeVideoUploading,
  uploadVideoWithProgress,
  cancelUpload: cancelVideoUpload,
} = useEditorVideos()

const {
  uploadingAudios,
  addUploading: addAudioUploading,
  updateUploading: updateAudioUploading,
  removeUploading: removeAudioUploading,
  uploadAudioWithProgress,
  cancelUpload: cancelAudioUpload,
} = useEditorAudio()

const mediaDialogOpen = ref(false)
const mediaDialogType = ref<'audio' | 'video'>('audio')
const uncommonNodesOpen = ref(false)
const lastSlashTriggerPos = ref<number | null>(null)

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

// Custom extension for line-by-line text selection with Shift+Arrow
const ShiftArrowFix = Extension.create({
  name: 'shiftArrowFix',
  priority: 10000,
  
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('shiftArrowFix'),
        props: {
          handleKeyDown: (view, event) => {
            if (event.shiftKey && !event.metaKey && !event.ctrlKey && !event.altKey) {
              if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
                event.preventDefault()
                const { state, dispatch } = view
                const { selection } = state
                const { $head, $anchor } = selection
                
                try {
                  const direction = event.key === 'ArrowUp' ? -1 : 1
                  
                  // Try multiple Y offsets until we find a different position
                  let newPosResult = null
                  const headCoords = view.coordsAtPos($head.pos)
                  
                  for (let offset = 20; offset <= 60; offset += 10) {
                    const testY = headCoords.top + (direction * offset)
                    const testPos = view.posAtCoords({ left: headCoords.left, top: testY })
                    
                    if (testPos && testPos.pos !== $head.pos) {
                      newPosResult = testPos
                      break
                    }
                  }
                  
                  // If we couldn't find a new position (at document boundary)
                  // select to the start/end of the current line/block
                  if (!newPosResult || newPosResult.pos === $head.pos) {
                    const $headPos = state.doc.resolve($head.pos)
                    let targetPos: number
                    
                    if (direction < 0) {
                      // Going up: select to start of line/block
                      // First try start of current text block
                      targetPos = $headPos.start($headPos.depth)
                      
                      // If already at block start, select to start of parent or document
                      if (targetPos === $head.pos && $headPos.depth > 1) {
                        targetPos = $headPos.start($headPos.depth - 1)
                      } else if (targetPos === $head.pos) {
                        targetPos = 0
                      }
                    } else {
                      // Going down: select to end of line/block
                      // First try end of current text block
                      targetPos = $headPos.end($headPos.depth)
                      
                      // If already at block end, select to end of parent or document
                      if (targetPos === $head.pos && $headPos.depth > 1) {
                        targetPos = $headPos.end($headPos.depth - 1)
                      } else if (targetPos === $head.pos) {
                        targetPos = state.doc.content.size
                      }
                    }
                    
                    // Ensure we don't select the same position
                    if (targetPos !== $head.pos) {
                      const newSelection = TextSelection.create(state.doc, $anchor.pos, targetPos)
                      dispatch(state.tr.setSelection(newSelection).scrollIntoView())
                      return true
                    }
                  } else if (newPosResult.pos !== $head.pos) {
                    let targetPos = newPosResult.pos
                    
                    // Validate the position
                    try {
                      const $pos = state.doc.resolve(targetPos)
                      
                      // If we're at a position that's not inline content, try to find valid inline position
                      if (!$pos.parent.inlineContent && $pos.depth > 0) {
                        // Try to find a nearby valid position
                        if (direction > 0 && targetPos < state.doc.content.size - 1) {
                          targetPos = targetPos + 1
                        } else if (direction < 0 && targetPos > 1) {
                          targetPos = targetPos - 1
                        }
                      }
                    } catch (e) {
                      // If position resolution fails, use the original position
                      console.warn('Position validation failed, using original:', e)
                    }
                    
                    const newSelection = TextSelection.create(state.doc, $anchor.pos, targetPos)
                    dispatch(state.tr.setSelection(newSelection).scrollIntoView())
                    return true
                  }
                } catch (err) {
                  console.error('Shift+Arrow selection error:', err)
                }
                
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

const editor = useEditor({
  content: normalizeEditorContent(props.content),
  editable: true,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
      link: { openOnClick: false },
      codeBlock: false, // Disable default codeBlock to use CodeBlockLowlight
    }),
    ShiftArrowFix,
    CodeBlockLowlight.extend({
      addNodeView() {
        return VueNodeViewRenderer(CodeBlockNodeView)
      },
    }).configure({ lowlight: useLowlight() }),
    FileHandler.configure({
      // Allow common image types, web video types and common audio types for inline uploads
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/ogg', 'audio/mpeg', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/flac', 'audio/x-flac', 'audio/aac', 'audio/mp4', 'audio/m4a'],
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
        // Paragraph with an explicit placeholder attribute should show that placeholder
        if (node.type.name === 'paragraph' && node.attrs?.placeholder) return node.attrs.placeholder
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
    Video,
    Audio,
    Conway,
    HorizontalCard,
    AutoLinkPreview,
    AutoLinkPlugin,
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
  editorProps: {
    attributes: { class: 'prose prose-lg max-w-none focus:outline-none' },
    handleTextInput: (_view, from, to, text) => {
      if (text === '/' && from === to) lastSlashTriggerPos.value = from + 1
      else lastSlashTriggerPos.value = null
      return false
    },
  },
  onUpdate: ({ editor }) => {
    suppressNextContentSync = true
    emit('update:content', editor.getJSON())
  },
})

// Expose editor when ready
let cleanupSelectionListener: (() => void) | null = null

watch(() => editor.value, (ed) => {
  if (cleanupSelectionListener) {
    cleanupSelectionListener()
    cleanupSelectionListener = null
  }
  if (ed) emit('editor-ready', ed)
  if (!ed) return
  const onSelectionUpdate = () => {
    if (lastSlashTriggerPos.value === null) return
    if (ed.state.selection.from !== lastSlashTriggerPos.value) lastSlashTriggerPos.value = null
  }
  ed.on('selectionUpdate', onSelectionUpdate)
  cleanupSelectionListener = () => ed.off('selectionUpdate', onSelectionUpdate)
}, { immediate: true })

async function handleFiles(currentEditor: any, files: File[], pos: number) {
  const identifier = String(routeForUpload.params.identifier ?? '')
  for (const file of files) {
    // Video handling: generate a poster client-side and upload both video + poster
    if (file.type && file.type.startsWith('video')) {
      const uploadId = addVideoUploading(file.name)
      try {
        if (identifier) {
          try {
            const posterBlob = await generatePosterFromVideoFile(file)
            const json = await uploadVideoWithProgress(identifier, file, posterBlob, (p: number) => updateVideoUploading(uploadId, p), uploadId)
            const src = json?.video?.src ?? null
            const poster = json?.video?.posterSrc ?? null
            if (src) {
              currentEditor.chain().insertContentAt(pos, { type: 'video', attrs: { src, poster } }).focus().run()
              continue
            }
          } catch (e: any) {
            if (e && typeof e === 'object' && (e as any).aborted) continue
            // Fall through to base64 fallback
          }
        }

        // Fallback to base64 inline if upload is not available
        const fr = new FileReader()
        fr.readAsDataURL(file)
        await new Promise<void>((resolve) => {
          fr.onload = () => {
            currentEditor.chain().insertContentAt(pos, { type: 'video', attrs: { src: fr.result } }).focus().run()
            resolve()
          }
        })
      } catch {
        const fr = new FileReader()
        fr.readAsDataURL(file)
        fr.onload = () => {
          currentEditor.chain().insertContentAt(pos, { type: 'video', attrs: { src: fr.result } }).focus().run()
        }
      } finally {
        removeVideoUploading(uploadId)
      }

      continue
    }

    // Audio handling: upload and insert an audio node (MVP without waveform)
    if (file.type && file.type.startsWith('audio')) {
      const uploadId = addAudioUploading(file.name)
      try {
        if (identifier) {
          try {
            const json = await uploadAudioWithProgress(identifier, file, (p: number) => updateAudioUploading(uploadId, p), uploadId)
            const src = json?.audio?.src ?? null
            if (src) {
              currentEditor.chain().insertContentAt(pos, { type: 'audio', attrs: { src } }).focus().run()
              continue
            }
          } catch (e: any) {
            if (e && typeof e === 'object' && (e as any).aborted) continue
          }
        }

        // Fallback to base64 inline
        const fr = new FileReader()
        fr.readAsDataURL(file)
        await new Promise<void>((resolve) => {
          fr.onload = () => {
            currentEditor.chain().insertContentAt(pos, { type: 'audio', attrs: { src: fr.result } }).focus().run()
            resolve()
          }
        })
      } catch {
        const fr = new FileReader()
        fr.readAsDataURL(file)
        fr.onload = () => {
          currentEditor.chain().insertContentAt(pos, { type: 'audio', attrs: { src: fr.result } }).focus().run()
        }
      } finally {
        removeAudioUploading(uploadId)
      }

      continue
    }

    // Image (existing) flow
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

const { slashMenuVertical } = useEditorSettings()

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

interface FloatingAction { label: string; icon?: string; description?: string; isActive?: () => boolean; action: () => void | Promise<void>; ask?: (prompt: string) => void | Promise<void> }
const floatingActions = computed<FloatingAction[]>(() => {
  const actions: FloatingAction[] = [
    { label: 'H1', description: 'Large heading', icon: 'i-lucide-heading-1', isActive: () => editor.value?.isActive('heading', { level: 1 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 1 }).run() },
    { label: 'H2', description: 'Medium heading', icon: 'i-lucide-heading-2', isActive: () => editor.value?.isActive('heading', { level: 2 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: 'H3', description: 'Small heading', icon: 'i-lucide-heading-3', isActive: () => editor.value?.isActive('heading', { level: 3 }) ?? false, action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: 'Bulleted', description: 'Unordered list', icon: 'i-lucide-list', isActive: () => editor.value?.isActive('bulletList') ?? false, action: () => toggleBulletListWithEnter() },
    { label: 'Numbered', description: 'Ordered list', icon: 'i-lucide-list-ordered', isActive: () => editor.value?.isActive('orderedList') ?? false, action: () => editor.value?.chain().focus().toggleOrderedList().run() },
    { label: 'Code Block', description: 'Insert code snippet', icon: 'i-lucide-code-2', isActive: () => editor.value?.isActive('codeBlock') ?? false, action: () => editor.value?.chain().focus().toggleCodeBlock().run() },
    { label: 'To-do', description: 'Task list item', icon: 'i-lucide-check-square', isActive: () => editor.value?.isActive('taskList') ?? false, action: () => editor.value?.chain().focus().toggleTaskList().run() },
    { label: 'Blockquote', description: 'Quoted text', icon: 'i-lucide-quote', isActive: () => editor.value?.isActive('blockquote') ?? false, action: () => editor.value?.chain().focus().toggleBlockquote().run() },
    { label: 'Gallery', description: 'Insert image gallery', icon: 'i-lucide-layout-grid', action: () => { /* drop-in handled by FloatingSlashMenu via file input */ } },
    { label: 'Image', description: 'Insert an image', icon: 'i-lucide-image', action: () => addImage() },
    { label: 'Horizontal Card', description: 'Image + text card', icon: 'i-lucide-rectangle-horizontal', action: () => { editor.value?.chain().focus().run(); (editor.value as any)?.commands?.insertHorizontalCard?.() } },
    { label: 'Video', description: 'Insert a video', icon: 'i-lucide-film', action: () => addVideo() },
    { label: 'Audio', description: 'Insert audio clip', icon: 'i-lucide-mic', action: () => addAudio() },
    { label: 'Separator', description: 'Insert divider', icon: 'i-lucide-minus', action: () => editor.value?.chain().focus().insertContent({ type: 'separator' }).run() },
    { label: 'Uncommon', description: 'More node types', icon: 'i-lucide-box', action: () => (uncommonNodesOpen.value = true) },
  ]

  if (props.aiEnabled && props.onAiCommand) {
    actions.unshift({
      label: 'AI',
      description: 'Continue or ask AI',
      icon: 'i-lucide-sparkles',
      action: () => props.onAiCommand?.('continue'),
      ask: (prompt: string) => props.onAiCommand?.({ action: 'ask', prompt }),
    })
  }

  return actions
})

function deleteSlashIfPresent() {
  const ed = editor.value; if (!ed) return
  // If caret is inside a code block, do not touch the leading slash
  if (ed.isActive?.('codeBlock')) return
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
  if (lastSlashTriggerPos.value !== pos) return false
  // don't show when caret is inside a code block
  if (props.editor?.isActive?.('codeBlock')) return false
  try {
    // Only show when the character immediately before the caret is '/'
    // and the character before that (if any) is either start-of-line, whitespace,
    // or punctuation. Do NOT show if previous char is a letter, digit, or ':'
    // which prevents triggering on things like `https:/` or inside words.
    if (state.doc.textBetween(pos - 1, pos, '', '\n') !== '/') return false

    const prevChar = pos - 2 >= 0 ? state.doc.textBetween(pos - 2, pos - 1, '', '\n') : ''
    if (!prevChar) return true // start of document/line

    // Disallow when previous char is another slash (eg. `https://`) — or alphanumeric or a colon
    if (prevChar === '/' || /[A-Za-z0-9:]/.test(prevChar)) return false

    return true
  } catch { return false }
} 

function addImage() {
  // Fallback: prompt for URL if file picker not available
  const url = window.prompt('Image URL')
  if (url && editor.value) editor.value.chain().focus().setImage({ src: url }).run()
}

function addVideo() {
  mediaDialogType.value = 'video'
  mediaDialogOpen.value = true
}

function addAudio() {
  mediaDialogType.value = 'audio'
  mediaDialogOpen.value = true
}

function onMediaInsert(files: File[]) {
  if (!editor.value || !files.length) return
  const pos = editor.value.state.selection.anchor
  handleFiles(editor.value, files, pos)
}

function onMediaInsertLink(url: string) {
  if (!editor.value || !url) return
  if (mediaDialogType.value === 'video') {
    editor.value.chain().focus().insertContent({ type: 'video', attrs: { src: url } }).run()
  } else {
    editor.value.chain().focus().insertContent({ type: 'audio', attrs: { src: url } }).run()
  }
}

function onUncommonSelect(item: any) {
  const type = typeof item === 'string' ? item : item?.type
  if (!editor.value || !type) return
  if (type === 'conway') {
    editor.value.chain().focus().insertContent({ type: 'conway', attrs: { rows: 25, cols: 25, speed: 200, seed: null } }).run()
  }
  uncommonNodesOpen.value = false
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

onBeforeUnmount(() => {
  cleanupSelectionListener?.()
  editor.value?.destroy()
})
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
