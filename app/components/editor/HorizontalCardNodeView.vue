<template>
  <NodeViewWrapper :class="['horizontal-card', positionClass, selected ? 'is-selected' : '']" :data-image-position="imagePosition" :data-image-square="isSquare ? 'true' : 'false'">
    <div class="horizontal-card__media" @click="triggerFilePicker" :role="isEditable ? 'button' : undefined" :title="isEditable ? 'Replace image' : undefined">
      <img v-if="imageSrc" :src="imageSrc" :alt="imageAlt" :class="['horizontal-card__image', { 'is-square': isSquare }]" />
      <div v-else class="horizontal-card__placeholder">Add image</div>

      <button v-if="isEditable" type="button" class="horizontal-card__replace-btn" @click.stop.prevent="triggerFilePicker">Replace</button>
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFilePicked" />
    </div>

    <div class="horizontal-card__body">
      <NodeViewContent class="horizontal-card__content" />

      <p v-if="!isEditable && !hasContent" class="horizontal-card__text">Add text…</p>
    </div> 
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { nodeViewProps, NodeViewWrapper, NodeViewContent } from '@tiptap/vue-3'
import { useEditorImages } from '~/composables/useEditorImages'
import { useRoute } from '#imports'
import { editorIsEditable } from './editorUtils'

const props = defineProps(nodeViewProps)
const fileInput = ref<HTMLInputElement | null>(null)

const isEditable = computed(() => editorIsEditable(props.editor))
const selected = computed(() => !!props.selected)
const imageSrc = computed(() => props.node.attrs?.imageSrc ?? '')
const imageAlt = computed(() => props.node.attrs?.imageAlt ?? '')
const imagePosition = computed(() => (props.node.attrs?.imagePosition === 'right' ? 'right' : 'left'))
const isSquare = computed(() => props.node.attrs?.square !== false)

const hasContent = computed(() => !!props.node.content && props.node.content.size > 0)

const positionClass = computed(() => `horizontal-card--image-${imagePosition.value}`)

const { addUploading, updateUploading, removeUploading, uploadFileWithProgress } = useEditorImages()
const route = useRoute()

function triggerFilePicker() {
  if (!isEditable.value) return
  fileInput.value?.click()
}

async function uploadImage(file: File): Promise<string | null> {
  const identifier = String(route.params.identifier ?? '')
  const uploadId = addUploading(file.name)
  try {
    if (identifier) {
      const json = await uploadFileWithProgress(identifier, file, (p: number) => updateUploading(uploadId, p), uploadId)
      const src = json?.image?.src
      if (src) return src
    }

    const fr = new FileReader()
    return await new Promise<string>((resolve) => {
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
  } catch {
    const fr = new FileReader()
    return await new Promise<string>((resolve) => {
      fr.onload = () => resolve(String(fr.result || ''))
      fr.readAsDataURL(file)
    })
  } finally {
    removeUploading(uploadId)
  }
}

async function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const src = await uploadImage(file)
  if (src) props.updateAttributes({ imageSrc: src })
  input.value = ''
}
</script>
