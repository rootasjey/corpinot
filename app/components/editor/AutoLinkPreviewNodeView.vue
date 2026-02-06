<template>
  <NodeViewWrapper :class="['auto-link-preview', selected ? 'is-selected' : '']" :data-loading="loading ? 'true' : 'false'" :data-image-position="imagePosition">
    <div class="auto-link-preview__media" :class="{ 'is-clickable': isClickable }">
      <NuxtImg v-if="imageSrc" :src="imageSrc" :alt="imageAlt" fit="cover" class="auto-link-preview__image" />
      <div v-else class="auto-link-preview__placeholder">Preview</div>

      <div v-if="loading" class="auto-link-preview__spinner">
        <span class="spinner" />
      </div>

      <button v-if="isEditable && href" type="button" class="auto-link-preview__revert-btn" @click.stop.prevent="revertToLink" title="Revert to link"><span class="i-lucide-link-2" /></button>
    </div>

    <div class="auto-link-preview__meta" :class="{ 'is-clickable': isClickable }" @click="onMetaClick">
      <template v-if="isEditable">
        <input v-model="localTitle" @blur="commitTitle" @keydown.enter.prevent="commitTitle" placeholder="Title" class="auto-link-preview__title-input" />
        <textarea v-model="localDescription" @blur="commitDescription" rows="2" placeholder="Description" class="auto-link-preview__desc-input" />
      </template>

      <template v-else>
        <NLink v-if="title" :href="href" target="_blank" rel="noopener">
          <h3 v-if="title" class="auto-link-preview__title">{{ title }}</h3>
          <p v-if="description" class="auto-link-preview__description">{{ description }}</p>
        </NLink>
      </template>
    </div>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { editorIsEditable } from './editorUtils'

const props = defineProps(nodeViewProps)

const isEditable = computed(() => editorIsEditable(props.editor))
const selected = computed(() => !!props.selected)
const href = computed(() => props.node.attrs?.href ?? '')
const title = computed(() => props.node.attrs?.title ?? '')
const description = computed(() => props.node.attrs?.description ?? '')
const imageSrc = computed(() => props.node.attrs?.imageSrc ?? '')
const imageAlt = computed(() => props.node.attrs?.imageAlt ?? '')
const imagePosition = computed(() => (props.node.attrs?.imagePosition === 'right' ? 'right' : 'left'))
const loading = computed(() => !!props.node.attrs?.loading)

const localTitle = ref(title.value)
const localDescription = ref(description.value)
let titleTimer: ReturnType<typeof setTimeout> | null = null
let descTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.node.attrs?.title, (v) => { localTitle.value = v ?? '' })
watch(() => props.node.attrs?.description, (v) => { localDescription.value = v ?? '' })

function commitTitle() {
  if (titleTimer) clearTimeout(titleTimer)
  props.updateAttributes({ title: localTitle.value })
}

function commitDescription() {
  if (descTimer) clearTimeout(descTimer)
  props.updateAttributes({ description: localDescription.value })
}

watch(localTitle, (v) => {
  if (titleTimer) clearTimeout(titleTimer)
  titleTimer = setTimeout(() => props.updateAttributes({ title: v }), 700)
})

watch(localDescription, (v) => {
  if (descTimer) clearTimeout(descTimer)
  descTimer = setTimeout(() => props.updateAttributes({ description: v }), 700)
})

function revertToLink() {
  const u = href.value
  if (!u) return
  const pos = props.getPos?.()
  if (typeof pos !== 'number') return

  const schema = props.editor?.schema
  const hasLinkMark = !!schema?.marks?.link
  const nodeToInsert = hasLinkMark
    ? { type: 'paragraph', content: [{ type: 'text', text: u, marks: [{ type: 'link', attrs: { href: u } }] }] }
    : { type: 'paragraph', content: [{ type: 'text', text: u }] }

  props.editor
    .chain()
    .focus()
    .deleteRange({ from: pos, to: pos + props.node.nodeSize })
    .insertContentAt(pos, nodeToInsert)
    .run()
}

// Open a URL in a new tab (client-only)
function openInNewTab(url: string | null) {
  if (!url) return
  if (typeof window === 'undefined') return
  window.open(String(url), '_blank', 'noopener')
}

const isClickable = computed(() => !isEditable.value && (!!href.value || !!imageSrc.value))

function onMediaClick(e: MouseEvent) {
  if (isEditable.value) return
  if (imageSrc.value) {
    // e.stopPropagation()
    // openInNewTab(imageSrc.value)
  } else if (href.value) {
    e.stopPropagation()
    openInNewTab(href.value)
  }
}

function onMetaClick(e: MouseEvent) {
  if (isEditable.value) return
  if (href.value) openInNewTab(href.value)
}
</script>
