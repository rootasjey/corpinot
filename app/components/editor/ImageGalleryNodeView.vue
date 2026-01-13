<template>
  <NodeViewWrapper :class="['image-gallery', galleryClass, selected ? 'is-selected' : '']">
    <div class="gallery-grid relative">
      <div
        v-for="(img, idx) in images"
        :key="idx"
        :class="['gallery-item', { 'is-active': activeIndex === idx } ]"
        :draggable="selected && isEditorEditable"
        @click="onClick(idx, $event)"
        @dragstart="onDragStart($event, idx)"
        @dragover.prevent="onDragOver($event, idx)"
        @drop="onDrop($event, idx)"
        @dragend="onDragEnd"
      >
        <img :src="img.attrs?.src ?? img.src" :alt="img.attrs?.alt ?? ''" :class="['gallery-img', isEditorEditable ? 'is-editable' : 'is-viewer']" />

        <div v-if="selected && isEditorEditable" class="overlay">
          <NButton btn="solid-gray" label="i-lucide-grip-vertical" icon @mousedown.stop title="Drag to reorder" class="cursor-move" />
          <NButton btn="solid-gray" label="i-lucide-refresh-ccw" icon @click.stop.prevent="triggerReplace(idx)" title="Replace" />
          <NButton btn="solid-gray" label="i-lucide-trash-2" icon @click.stop.prevent="removeImage(idx)" title="Remove" />
        </div>
      </div>

      <!-- Add image button — only visible in editable mode when selected and under limit -->
      <NTooltip v-if="selected && isEditorEditable && images.length < 9" content="Add image" placement="top">
        <NButton 
          icon
          label="i-lucide-plus"
          btn="~"
          rounded="full"
          @click.stop.prevent="triggerAdd" 
          class="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-3/4
          color-black bg-white border border-gray-300 rounded-full shadow-md 
          hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-150"
        />
      </NTooltip>
    </div>

    <!-- Hidden file inputs for replace/add -->
    <input ref="fileInputReplace" type="file" accept="image/*" class="hidden" @change="onReplaceFilesChange" />
    <input ref="fileInputAdd" type="file" accept="image/*" multiple class="hidden" @change="onAddFilesChange" />
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { useEditorImages } from '~/composables/useEditorImages'
import { useRoute } from '#imports'

const props = defineProps(nodeViewProps)
const images = computed(() => (props.node.attrs?.images ?? []) as any[])
const selected = computed(() => !!props.selected)
const activeIndex = computed(() => Number(props.node.attrs?.activeIndex ?? 0))
const fileInputReplace = ref<HTMLInputElement | null>(null)
const fileInputAdd = ref<HTMLInputElement | null>(null)
const replaceIndex = ref<number | null>(null)

// Detect whether the host editor is editable (viewer uses editable=false)
import { editorIsEditable } from './editorUtils'
const isEditorEditable = computed(() => editorIsEditable(props.editor))

const { addUploading, updateUploading, removeUploading, uploadFileWithProgress } = useEditorImages()
const route = useRoute()

const galleryClass = computed(() => {
  const count = images.value.length
  if (count === 1) return 'image-gallery--single'
  if (count === 2) return 'image-gallery--cols-2'
  if (count === 3) return 'image-gallery--cols-3'
  if (count > 3) return 'image-gallery--grid'
  return ''
})

function selectNode(idx: number) {
  if (!isEditorEditable.value) return
  // Set the active image index on the node and then set node selection
  props.updateAttributes({ activeIndex: idx })
  const pos = props.getPos?.()
  if (typeof pos === 'number') props.editor.commands.setNodeSelection(pos)
}

function onClick(idx: number, e: MouseEvent) {
  // viewer mode: let page-level handler open the lightbox
  if (!isEditorEditable.value) return
  e.stopPropagation()
  selectNode(idx)
}

function triggerReplace(idx: number) {
  replaceIndex.value = idx
  fileInputReplace.value?.click()
}

function triggerAdd() {
  fileInputAdd.value?.click()
}

async function handleFileUpload(file: File) {
  const identifier = String(route.params.identifier ?? '')
  const uploadId = addUploading(file.name)
  try {
    if (identifier) {
      const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
      const src = json?.image?.src ?? null
      if (src) return { src }
    }
    // Fallback to base64 inline
    const fr = new FileReader()
    return await new Promise<any>((resolve) => {
      fr.onload = () => resolve({ src: fr.result })
      fr.readAsDataURL(file)
    })
  } catch (e) {
    // last-ditch fallback
    const fr = new FileReader()
    return await new Promise<any>((resolve) => {
      fr.onload = () => resolve({ src: fr.result })
      fr.readAsDataURL(file)
    })
  } finally {
    removeUploading(uploadId)
  }
}

async function onReplaceFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files.length) return
  const file = input.files?.[0]
  if (!file) return
  const result = await handleFileUpload(file)
  const newImages = images.value.slice()
  const idx = replaceIndex.value ?? 0
  newImages[idx] = { type: 'image', attrs: { src: result.src, alt: '' } }
  props.updateAttributes({ images: newImages })
  input.value = ''
}

async function onAddFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files.length) return
  const files = Array.from(input.files)
  const results: any[] = []
  for (const file of files) {
    const r = await handleFileUpload(file)
    results.push({ type: 'image', attrs: { src: r.src, alt: '' } })
  }
  const newImages = images.value.concat(results)
  props.updateAttributes({ images: newImages })
  input.value = ''
}

function removeImage(idx: number) {
  const newImages = images.value.slice()
  newImages.splice(idx, 1)
  // Adjust active index to remain in-bounds
  const currentActive = Number(props.node.attrs?.activeIndex ?? 0)
  let newActive = currentActive
  if (idx < currentActive) newActive = Math.max(0, currentActive - 1)
  if (newActive >= newImages.length) newActive = Math.max(0, newImages.length - 1)
  props.updateAttributes({ images: newImages, activeIndex: newActive })
}

// Drag and drop state
const draggedIndex = ref<number | null>(null)

function onDragStart(e: DragEvent, idx: number) {
  if (!isEditorEditable.value) return
  draggedIndex.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', String(idx))
  }
}

function onDragOver(e: DragEvent, idx: number) {
  if (!isEditorEditable.value) return
  if (draggedIndex.value === null || draggedIndex.value === idx) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
}

function onDrop(e: DragEvent, dropIdx: number) {
  if (!isEditorEditable.value) return
  e.preventDefault()
  const dragIdx = draggedIndex.value
  if (dragIdx === null || dragIdx === dropIdx) return
  
  const newImages = images.value.slice()
  const [draggedItem] = newImages.splice(dragIdx, 1)
  newImages.splice(dropIdx, 0, draggedItem)
  
  // Update active index: if the active image was moved, track it
  const currentActive = Number(props.node.attrs?.activeIndex ?? 0)
  let newActive = currentActive
  if (currentActive === dragIdx) newActive = dropIdx
  else if (dragIdx < currentActive && dropIdx >= currentActive) newActive = currentActive - 1
  else if (dragIdx > currentActive && dropIdx <= currentActive) newActive = currentActive + 1
  
  props.updateAttributes({ images: newImages, activeIndex: newActive })
  draggedIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
}
</script>

<style scoped>
.image-gallery {
  position: relative;
  margin: 1.5rem 0;
}

.image-gallery.is-selected {
  outline: 2px solid var(--un-primary-color, #3b82f6);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

.gallery-grid {
  display: grid;
  gap: 0.5rem;
}

.image-gallery--single .gallery-grid {
  grid-template-columns: 1fr;
  justify-items: center;
}

.image-gallery--single .gallery-img {
  max-width: min(900px, 100%);
  height: auto;
  border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
}

.image-gallery--cols-2 .gallery-grid {
  grid-template-columns: repeat(2, 1fr);
}

.image-gallery--cols-3 .gallery-grid {
  grid-template-columns: repeat(3, 1fr);
}

.image-gallery--grid .gallery-grid {
  grid-template-columns: repeat(3, 1fr);
}

.gallery-item {
  position: relative;
  overflow: hidden;
  border-radius: 0.75rem;
}

.gallery-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: default;
}
.gallery-img.is-editable { cursor: pointer; }

.overlay {
  position: absolute;
  inset: 6px;
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  align-items: flex-start;
}

</style>
