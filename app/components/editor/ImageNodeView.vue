<template>
  <NodeViewWrapper as="figure" :class="['image-figure', displayClass, selected ? 'is-selected' : '']">
    <img
      ref="imgEl"
      :class="['editor-image', props.node.attrs.display === 'full-bleed' ? 'editor-image--full-bleed' : '']"
      :src="node.attrs.src"
      :alt="node.attrs.alt || ''"
      @click="selectNode"
    />
    <figcaption class="image-caption">
      <template v-if="selected">
        <input
          v-model="localAlt"
          type="text"
          class="alt-input"
          placeholder="Alt text (for accessibility)"
          @keydown.enter.prevent="commitAlt"
          @blur="commitAlt"
        />
        <span v-if="dimensions" class="dims">{{ dimensions }}</span>
      </template>
      <template v-else>
        <span v-if="node.attrs.alt">{{ node.attrs.alt }}</span>
      </template>
    </figcaption>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'

const props = defineProps(nodeViewProps)
const localAlt = ref(props.node.attrs.alt || '')
const imgEl = ref<HTMLImageElement | null>(null)
const dimensions = ref('')

const displayClass = computed(() => `image-figure--${props.node.attrs.display || 'center'}`)

function commitAlt() {
  props.updateAttributes({ alt: localAlt.value })
}

function updateDimensions() {
  const img = imgEl.value
  if (!img) return
  if (img.complete) {
    dimensions.value = `${img.naturalWidth}×${img.naturalHeight}`
  } else {
    img.addEventListener('load', () => {
      dimensions.value = `${img.naturalWidth}×${img.naturalHeight}`
    }, { once: true })
  }
}

function selectNode() {
  const pos = props.getPos?.()
  if (typeof pos === 'number') props.editor.commands.setNodeSelection(pos)
}

onMounted(() => {
  updateDimensions()
})

watch(() => props.node.attrs.alt, (val) => { localAlt.value = val || '' })
watch(() => props.selected, (val) => { if (val) updateDimensions() })
</script>

<style scoped>
.image-figure {
  position: relative;
  margin: 2rem 0;
  text-align: center;
  transition: outline 0.2s;
}

.image-figure.is-selected {
  outline: 2px solid var(--un-primary-color, #3b82f6);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

.editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 0.75rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

/* Editor: full-bleed visual (keeps editor layout intact but shows the full-bleed intent) */
.image-figure.image-figure--full-bleed {
  width: 100vw;
  max-width: none;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  padding-inline: 1rem;
  box-sizing: border-box;
}

.image-figure.image-figure--full-bleed .editor-image {
  width: 100%;
  max-width: none;
  margin: 0;
  border-radius: 0;
}

.image-caption {
  font-size: 0.75rem;
  color: var(--un-muted-color, #6b7280);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: center;
}

.alt-input {
  font-size: 0.65rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--un-border-color, #e5e7eb);
  background: var(--un-background-color, #fff);
  border-radius: 12px;
  min-width: 160px;
}
.dark .alt-input {
  border-color: var(--un-border-color-dark, #374151);
  background: var(--un-background-color-dark, #1f2937);
  color: var(--un-text-color-dark, #d1d5db);
}

.dims {
  position: absolute;
  top: 12px;
  right: 12px;
  opacity: 0.8;
  font-size: 1.2rem;
  font-weight: 600;

  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: 8px;
  padding: 2px 6px;
}

.dark .dims {
  color: black;
  background: yellow;
  &::selection {
    color: black;
    background: yellow;
  }
}
</style>
