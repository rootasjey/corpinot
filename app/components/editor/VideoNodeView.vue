<template>
  <NodeViewWrapper as="figure" :class="['video-figure', selected ? 'is-selected' : '']">
    <div 
      class="video-container" 
      tabindex="0"
      @mouseenter="showControls = true" 
      @mouseleave="showControls = false"
      @keydown="handleKeydown"
    >
      <video
        ref="videoEl"
        class="editor-video"
        :src="node.attrs.src"
        :poster="node.attrs.poster"
        preload="metadata"
        @click="togglePlayPause"
        @timeupdate="onTimeUpdate"
        @loadedmetadata="onLoadedMetadata"
        @ended="onEnded"
      />

      <!-- Initial centered play button -->
      <div class="center-play" v-if="showInitialPlay">
        <button class="center-play-button" @click.prevent="onInitialPlay" aria-label="Play video">
          <svg class="center-play-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
      </div>

      <!-- Custom Video Controls -->
      <div :class="['video-controls', showControls || !isPlaying ? 'visible' : '']">
        <!-- Progress Bar -->
        <div class="progress-bar-container" @click="seek">
          <div class="progress-bar">
            <div class="progress-bar-filled" :style="{ width: `${progress}%` }"></div>
            <div 
              class="progress-bar-handle" 
              :style="{ left: `${progress}%` }"
              @mousedown="startDragging"
            ></div>
          </div>
        </div>

        <!-- Control Buttons -->
        <div class="controls-row">
          <div class="controls-left">
            <button class="control-btn" @click.prevent="togglePlayPause">
              <svg v-if="!isPlaying" class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
              <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            </button>

            <button class="control-btn" @click.prevent="skipBackward">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
              </svg>
            </button>

            <button class="control-btn" @click.prevent="skipForward">
              <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
              </svg>
            </button>

            <div class="time-display">
              <span>{{ formatTime(currentTime) }}</span>
              <span class="time-separator">/</span>
              <span>{{ formatTime(duration) }}</span>
            </div>
          </div>

          <div class="controls-right">
            <div class="volume-container" @mouseenter="showVolumeWithDelay" @mouseleave="hideVolumeWithDelay">
              <div :class="['volume-slider', showVolumeSlider ? 'visible' : '']">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  :value="volume"
                  @input="onVolumeChange"
                  class="volume-input"
                />
              </div>
              <button class="control-btn" @click.prevent="toggleMute">
                <svg v-if="isMuted || volume === 0" class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                </svg>
                <svg v-else-if="volume < 0.5" class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 9v6h4l5 5V4l-5 5H7z" />
                </svg>
                <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
                </svg>
              </button>
            </div>

            <button class="control-btn" @click.prevent="toggleFullscreen">
              <svg v-if="!isFullscreen" class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <svg v-else class="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <figcaption class="video-caption">
      <template v-if="selected">
        <div class="editor-controls">
          <button class="btn" @click.prevent="triggerReplace">Replace</button>
          <input ref="replaceInput" type="file" accept="video/*" class="hidden" @change="onReplaceSelected" />

          <button class="btn" @click.prevent="triggerPoster">Upload poster</button>
          <input ref="posterInput" type="file" accept="image/*" class="hidden" @change="onPosterSelected" />

          <button class="btn btn-danger" @click.prevent="removeNode">Remove</button>
        </div>
      </template>
      <template v-else>
        <span v-if="node.attrs.poster" class="text-sm text-slate-500 dark:text-slate-400">Has poster</span>
      </template>
    </figcaption>
  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { generatePosterFromVideoFile } from '~~/app/composables/generateVideoPoster'
import { useRoute } from '#imports'

const props = defineProps(nodeViewProps)
const selected = props.selected
const node = props.node
const videoEl = ref<HTMLVideoElement | null>(null)
const replaceInput = ref<HTMLInputElement | null>(null)
const posterInput = ref<HTMLInputElement | null>(null)

// Video player state
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const progress = ref(0)
const volume = ref(1)
const isMuted = ref(false)
const isFullscreen = ref(false)
const showControls = ref(false)
const showVolumeSlider = ref(false)
const isDragging = ref(false)

let volumeTimeout: ReturnType<typeof setTimeout> | null = null

// show a large centered play button when the video hasn't started yet
const showInitialPlay = computed(() => !isPlaying.value && currentTime.value === 0)

function onInitialPlay() {
  if (!videoEl.value) return
  // ensure start at beginning
  videoEl.value.currentTime = 0
  videoEl.value.play()
  isPlaying.value = true
  // hide controls to match playing state
  showControls.value = false
} 

function selectNode() {
  const pos = props.getPos?.()
  if (typeof pos === 'number') props.editor.commands.setNodeSelection(pos)
}

function togglePlayPause() {
  if (!videoEl.value) return
  if (isPlaying.value) {
    videoEl.value.pause()
    isPlaying.value = false
  } else {
    videoEl.value.play()
    isPlaying.value = true
    showControls.value = false
  }
} 

function onTimeUpdate() {
  if (!videoEl.value) return
  currentTime.value = videoEl.value.currentTime
  progress.value = (currentTime.value / duration.value) * 100 || 0
}

function onLoadedMetadata() {
  if (!videoEl.value) return
  duration.value = videoEl.value.duration
  volume.value = videoEl.value.volume
}

function onEnded() {
  isPlaying.value = false
  progress.value = 0
}

function seek(event: MouseEvent) {
  if (!videoEl.value || isDragging.value) return
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const pos = (event.clientX - rect.left) / rect.width
  videoEl.value.currentTime = pos * duration.value
}

function startDragging(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
  updateProgressFromMouse(event)
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDragging)
}

function onDragMove(event: MouseEvent) {
  if (!isDragging.value) return
  updateProgressFromMouse(event)
}

function stopDragging() {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDragging)
}

function updateProgressFromMouse(event: MouseEvent) {
  if (!videoEl.value) return
  const progressBar = document.querySelector('.progress-bar-container')
  if (!progressBar) return
  const rect = progressBar.getBoundingClientRect()
  const pos = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width))
  videoEl.value.currentTime = pos * duration.value
  progress.value = pos * 100
}

function skipForward() {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.min(videoEl.value.currentTime + 10, duration.value)
}

function skipBackward() {
  if (!videoEl.value) return
  videoEl.value.currentTime = Math.max(videoEl.value.currentTime - 10, 0)
}

function toggleMute() {
  if (!videoEl.value) return
  videoEl.value.muted = !videoEl.value.muted
  isMuted.value = videoEl.value.muted
}

function onVolumeChange(event: Event) {
  if (!videoEl.value) return
  const input = event.target as HTMLInputElement
  volume.value = parseFloat(input.value)
  videoEl.value.volume = volume.value
  isMuted.value = volume.value === 0
}

function toggleFullscreen() {
  const container = videoEl.value?.parentElement
  if (!container) return

  if (!document.fullscreenElement) {
    container.requestFullscreen()
    isFullscreen.value = true
  } else {
    document.exitFullscreen()
    isFullscreen.value = false
  }
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
}

function showVolumeWithDelay() {
  if (volumeTimeout) clearTimeout(volumeTimeout)
  showVolumeSlider.value = true
}

function hideVolumeWithDelay() {
  if (volumeTimeout) clearTimeout(volumeTimeout)
  volumeTimeout = setTimeout(() => {
    showVolumeSlider.value = false
  }, 1000)
}

function handleKeydown(event: KeyboardEvent) {
  // Let the editor handle Shift+Arrow so it can extend selection; don't swallow it here.
  if (event.shiftKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
    return
  }
  // Ignore keyboard shortcuts when the user is typing in an input/textarea/select or contenteditable element
  const tgt = event.target as HTMLElement | null
  if (tgt && (tgt.closest('input,textarea,select,[contenteditable="true"]') || tgt.isContentEditable)) return
  if (!videoEl.value) return
  
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      skipBackward()
      break
    case 'ArrowRight':
      event.preventDefault()
      skipForward()
      break
    case 'ArrowUp':
      event.preventDefault()
      volume.value = Math.min(1, volume.value + 0.1)
      videoEl.value.volume = volume.value
      isMuted.value = false
      videoEl.value.muted = false
      showVolumeWithDelay()
      hideVolumeWithDelay()
      break
    case 'ArrowDown':
      event.preventDefault()
      volume.value = Math.max(0, volume.value - 0.1)
      videoEl.value.volume = volume.value
      isMuted.value = volume.value === 0
      showVolumeWithDelay()
      hideVolumeWithDelay()
      break
    case ' ':
    case 'Space':
      event.preventDefault()
      togglePlayPause()
      break
  }
}

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDragging)
  if (volumeTimeout) clearTimeout(volumeTimeout)
})

function triggerReplace() {
  replaceInput.value?.click()
}

function triggerPoster() {
  posterInput.value?.click()
}

async function onReplaceSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0] as File
  const route = useRoute()
  const identifier = String(route.params.identifier ?? '')
  if (!identifier) {
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => {
      props.updateAttributes({ src: fr.result })
    }
    return
  }

  const posterBlob = await generatePosterFromVideoFile(file)

  const form = new FormData()
  form.append('file', file)
  if (posterBlob) form.append('poster', posterBlob, `${file.name}-poster.png`)

  try {
    const res = await fetch(`/api/posts/${encodeURIComponent(identifier)}/videos`, { method: 'POST', body: form })
    const json = await res.json()
    if (res.ok && json?.video?.src) {
      props.updateAttributes({ src: json.video.src, poster: json.video.posterSrc })
    }
  } catch (err) {
    const fr = new FileReader()
    fr.readAsDataURL(file)
    fr.onload = () => {
      props.updateAttributes({ src: fr.result })
    }
  } finally {
    if (replaceInput.value) replaceInput.value.value = ''
  }
}

async function onPosterSelected(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0] as File
  const route = useRoute()
  const identifier = String(route.params.identifier ?? '')
  if (!identifier) return

  try {
    const posterForm = new FormData()
    posterForm.append('file', file)
    posterForm.append('fileName', file.name)
    posterForm.append('type', file.type)
    const res = await fetch(`/api/posts/${encodeURIComponent(identifier)}/images`, { method: 'POST', body: posterForm })
    const json = await res.json()
    if (res.ok && json?.image?.src) {
      props.updateAttributes({ poster: json.image.src })
    }
  } catch (err) {
    // ignore
  } finally {
    if (posterInput.value) posterInput.value.value = ''
  }
}

function removeNode() {
  const pos = props.getPos?.()
  if (typeof pos !== 'number') return
  props.editor.commands.deleteRange({ from: pos, to: pos + props.node.nodeSize })
}
</script>

<style scoped>
.video-figure {
  position: relative;
  margin: 2rem 0;
  text-align: center;
}

.video-figure.is-selected {
  outline: 2px solid var(--un-primary-color, #3b82f6);
  outline-offset: 4px;
  border-radius: 0.75rem;
}

.video-container {
  position: relative;
  max-width: 100%;
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  background: #000;
  outline: none;
}

.video-container:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Centered initial play button */
.center-play {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; /* let the button handle events */
}

.center-play::before {
  content: '';
  position: absolute;
  inset: 0;
  /* radial vignette + subtle blur to darken the area behind the button */
  background: radial-gradient(circle at center, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.7) 60%, rgba(0,0,0,0.85) 100%);
  /* backdrop-filter: blur(0px); */
  transition: opacity 0.25s ease;
  pointer-events: none;
  z-index: 0;
}

.center-play-button {
  pointer-events: auto;
  position: relative;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 84px;
  height: 84px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: 0 8px 30px rgba(11, 11, 13, 0.5);
  color: white;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.18s ease;
  opacity: 1;
}

.center-play-button:hover { transform: scale(1.05); }
.center-play-button:active { transform: scale(0.98); }

.center-play-icon { width: 36px; height: 36px; }

.center-play[hidden] { opacity: 0; }


.editor-video {
  width: 100%;
  height: auto;
  display: block;
  cursor: pointer;
}

/* Custom Video Controls */
.video-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
  padding: 3rem 1rem 1rem;
  opacity: 0;
  transform: translateY(10px);
  transition: opacity 0.3s ease, transform 0.3s ease;
  pointer-events: none;
}

.video-controls.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

/* Progress Bar */
.progress-bar-container {
  cursor: pointer;
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
}

.progress-bar {
  position: relative;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
  overflow: visible;
  transition: height 0.2s ease;
}

.progress-bar-container:hover .progress-bar {
  height: 6px;
}

.progress-bar-filled {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #3b82f6;
  border-radius: 2px;
  transition: width 0.1s linear;
}

.progress-bar-handle {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: grab;
  z-index: 10;
}

.progress-bar-handle:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.2);
}

.progress-bar-container:hover .progress-bar-handle {
  opacity: 1;
}

/* Controls Row */
.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s ease, transform 0.1s ease;
}

.control-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.control-btn:active {
  transform: scale(0.95);
}

.icon {
  width: 22px;
  height: 22px;
}

/* Time Display */
.time-display {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  user-select: none;
}

.time-separator {
  opacity: 0.6;
}

/* Volume Control */
.volume-container {
  position: relative;
  display: flex;
  align-items: center;
}

.volume-slider {
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%) translateX(-8px);
  background: rgba(0, 0, 0, 0.9);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: center;
}

.volume-slider.visible {
  opacity: 1;
  pointer-events: auto;
}

.volume-input {
  width: 80px;
  height: 4px;
  background: transparent;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
}

.volume-input::-webkit-slider-runnable-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.volume-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin-top: -4px;
}

.volume-input::-moz-range-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.volume-input::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Editor Controls (separate from video controls) */
.video-caption {
  margin-top: 0.5rem;
}

.editor-controls {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  border: 1px solid var(--un-border-color, #e5e7eb);
  background: var(--un-background-color, #fff);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #f3f4f6;
}

.btn-danger {
  background: #fee2e2;
  border-color: #fecaca;
  color: #b91c1c;
}

.btn-danger:hover {
  background: #fecaca;
}

.hidden {
  display: none;
}
</style>
