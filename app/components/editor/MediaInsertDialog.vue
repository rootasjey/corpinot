<template>
  <NDialog v-model:open="dialogOpen" placement="center">
    <template #content>
      <div class="media-insert-dialog">
        <h2 class="text-lg font-semibold mb-4">Insert {{ mediaType === 'audio' ? 'Audio' : 'Video' }}</h2>
        
        <!-- Tab selection -->
        <div class="tabs mb-4 flex gap-2 border-b border-border pb-2">
          <button 
            :class="['tab', activeTab === 'upload' && 'active']" 
            @click="activeTab = 'upload'"
          >
            <span class="i-lucide-upload mr-1" />Upload
          </button>
          <button 
            :class="['tab', activeTab === 'link' && 'active']" 
            @click="activeTab = 'link'"
          >
            <span class="i-lucide-link mr-1" />Link
          </button>
        </div>

        <!-- Upload tab -->
        <div v-if="activeTab === 'upload'" class="upload-section">
          <div 
            :class="['drop-zone', isDragging && 'dragging']"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="triggerFileInput"
          >
            <span class="i-lucide-file-audio text-4xl mb-2" v-if="mediaType === 'audio'" />
            <span class="i-lucide-film text-4xl mb-2" v-else />
            <p class="text-sm">Drag & drop {{ mediaType === 'audio' ? 'audio' : 'video' }} file here</p>
            <p class="text-xs text-muted mt-1">or click to browse</p>
            <input 
              ref="fileInput" 
              type="file" 
              :accept="mediaType === 'audio' ? 'audio/*' : 'video/*'" 
              class="hidden" 
              @change="handleFileSelected"
            />
          </div>
        </div>

        <!-- Link tab -->
        <div v-if="activeTab === 'link'" class="link-section">
          <NInput 
            v-model="linkUrl" 
            input="outline"
            placeholder="https://example.com/media.mp3" 
            class="mb-3"
            @keyup.enter="insertLink"
          />
          <div class="flex gap-2 justify-end">
            <NButton btn="soft-gray" @click="dialogOpen = false">Cancel</NButton>
            <NButton btn="solid-gray" @click="insertLink" class="min-w-100px" :disabled="!linkUrl.trim()">Insert</NButton>
          </div>
        </div>
      </div>
    </template>
  </NDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  mediaType: 'audio' | 'video'
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'update:open': [value: boolean]
  'insert': [files: File[]]
  'insertLink': [url: string]
}>()

const dialogOpen = ref(props.open)
const activeTab = ref<'upload' | 'link'>('upload')
const isDragging = ref(false)
const linkUrl = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.open, (v) => { 
  dialogOpen.value = v
  if (v) {
    activeTab.value = 'upload'
    linkUrl.value = ''
  }
})

watch(dialogOpen, (v) => emits('update:open', v))

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files || [])
  if (files.length > 0) {
    emits('insert', files)
    dialogOpen.value = false
  }
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files || [])
  if (files.length > 0) {
    emits('insert', files)
    dialogOpen.value = false
  }
}

function insertLink() {
  const url = linkUrl.value.trim()
  if (url) {
    emits('insertLink', url)
    dialogOpen.value = false
  }
}
</script>

<style scoped>
.media-insert-dialog {
  min-width: 400px;
  padding: 1rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  color: var(--un-foreground-muted, #64748b);
  transition: all 0.2s;
}

.tab.active {
  color: var(--un-primary, #3b82f6);
  border-bottom-color: var(--un-primary, #3b82f6);
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  border: 2px dashed var(--un-border, #e2e8f0);
  border-radius: 0.5rem;
  background: var(--un-surface, #f8fafc);
  cursor: pointer;
  transition: all 0.2s;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--un-primary, #3b82f6);
  background: var(--un-primary-50, #eff6ff);
}

.dark .drop-zone {
  background: var(--un-surface, #1e293b);
}

.dark .drop-zone:hover,
.dark .drop-zone.dragging {
  background: rgba(59, 130, 246, 0.1);
}

.link-section {
  padding: 1rem 0;
}
</style>
