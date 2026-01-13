<template>
  <NodeViewWrapper as="figure" :class="['audio-figure', selected ? 'is-selected' : '']">
    <div class="audio-container" tabindex="0" @keydown="handleKeydown">
      <audio ref="audioEl" :src="node.attrs.src" class="editor-audio sr-only" @timeupdate="onTimeUpdate" @loadedmetadata="onLoadedMetadata" @play="onPlay" @pause="onPause"></audio>

      <div class="control-card" :class="{ 'is-playing': isPlaying }" @click.stop>
        <div class="top-row">
          <div class="left-controls">
            <NTooltip>
              <button class="icon-btn" @click.prevent="skipBackward">
                <NIcon name="i-lucide-rotate-ccw" />
              </button>
              <template #content>
                <span class="font-600 font-size-3">Rewind 10s</span>
              </template>
            </NTooltip>

            <NTooltip>
              <button class="square-play" @click.prevent="onTogglePlay" :aria-label="isPlaying ? 'Pause audio' : 'Play audio'">
                <NIcon v-if="!isPlaying" name="i-lucide-play" />
                <NIcon v-else name="i-lucide-pause" />
              </button>
              <template #content>
                <span class="font-600 font-size-3">{{ isPlaying ? 'Pause' : 'Play' }}</span>
              </template>
            </NTooltip>

            <NTooltip>
              <button class="icon-btn" @click.prevent="skipForward">
                <NIcon name="i-lucide-rotate-cw" />
              </button>
              <template #content>
                <span class="font-600 font-size-3">Skip Forward 10s</span>
              </template>
            </NTooltip>

            <NTooltip :show-arrow="true" :disable-closing-trigger="true" :delay-duration="0" :skip-delay-duration="0">
              <button class="icon-btn" @click.prevent="toggleLoop" :aria-pressed="loop" :title="loop ? 'Disable Loop' : 'Enable Loop'">
                <NIcon name="i-lucide-infinity" :class="{ 'text-blue-500': loop, 'text-muted': !loop }" />
              </button>
              <template #content>
                <span class="font-600 font-size-3">{{ loop ? 'Loop Enabled' : 'Loop Disabled' }}</span>
              </template>
            </NTooltip>
          </div>

          <div class="title-section">
            <div v-if="isEditorEditable">
              <input v-model="titleLocal" class="title-input caption-input" placeholder="Audio" @blur="commitTitle" @keyup.enter="commitTitle" />
            </div>
            <div v-else class="title" aria-hidden="true">{{ titleLocal }}</div>
          </div>

          <div class="right-controls" @mouseenter="onVolumeEnter" @mouseleave="onVolumeLeave">
            <div class="volume-bubble" :class="{ visible: showVolume }" @mouseenter="onVolumeEnter" @mouseleave="onVolumeLeave">
              <button
                class="mute-btn"
                @click.prevent="toggleMute"
                :title="muted ? 'Unmute' : 'Mute'"
                aria-label="Toggle mute"
              >
                <span v-if="muted" class="i-lucide-volume-x" />
                <span v-else class="i-lucide-volume-2" />
              </button>

              <NTooltip text="Volume" :show-arrow="true" :disable-closing-trigger="true" :delay-duration="0" :skip-delay-duration="0">
                <input
                  class="volume-slider"
                  type="range"
                  min="0"
                  max="100"
                  :value="volumePercent"
                  @input="onVolumeInput"
                  aria-label="Volume"
                />
                <template #content>
                  <span class="font-600 font-size-3">{{ volumePercent }}%</span>
                </template>
              </NTooltip>
            </div>

            <span class="i-ph-waveform waveform-icon" :class="{ 'is-muted': muted }" />
          </div>
        </div>

        <div class="progress-container" @click="seekByClick">
          <div class="progress-track" ref="progressTrack">
            <div class="progress" :style="{ width: progress + '%' }"></div>
            <div
              class="progress-handle"
              :class="{ 'is-dragging': isDragging }"
              :style="{ left: progress + '%' }"
              @mousedown.prevent="startDrag"
              @touchstart.prevent="startDragTouch"
            />
          </div>

          <div class="times">
            <span class="time-left">{{ formatTime(currentTime) }}</span>
            <span class="time-right">{{ formatTime(duration) }}</span>
          </div>
        </div>
      </div>
    </div>

  </NodeViewWrapper>
</template>

<script setup lang="ts">
import { nodeViewProps, NodeViewWrapper } from '@tiptap/vue-3'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps(nodeViewProps)
const selected = props.selected
const node = props.node

// Detect whether the host editor is editable (viewer uses editable=false)
import { editorIsEditable } from './editorUtils'
const isEditorEditable = computed(() => editorIsEditable(props.editor))

const audioEl = ref<HTMLAudioElement | null>(null)
const isPlaying = ref(false)

const currentTime = ref(0)
const duration = ref(0)
const progress = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0))
const titleLocal = ref(String((props.node.attrs as any).title || ''))
const loop = ref(!!(props.node.attrs as any).loop)

watch(() => props.node.attrs, (v) => { titleLocal.value = String((v as any).title || ''); loop.value = !!(v as any).loop })

function onTimeUpdate(e: Event) {
  if (!audioEl.value) return
  currentTime.value = audioEl.value.currentTime
}

function onLoadedMetadata() {
  if (!audioEl.value) return
  duration.value = audioEl.value.duration || 0
}

function onTogglePlay() {
  if (!audioEl.value) return
  if (audioEl.value.paused) audioEl.value.play()
  else audioEl.value.pause()
}

function onPlay() { isPlaying.value = true }
function onPause() { isPlaying.value = false }

function formatTime(t: number) {
  if (!Number.isFinite(t)) return '0:00'
  const s = Math.floor(t % 60).toString().padStart(2, '0')
  const m = Math.floor(t / 60)
  return `${m}:${s}`
}

function seekByClick(evt: MouseEvent) {
  if (!audioEl.value) return
  const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect()
  const x = evt.clientX - rect.left
  const pct = Math.max(0, Math.min(1, x / rect.width))
  audioEl.value.currentTime = (duration.value || 0) * pct
}

function toggleLoop() {
  loop.value = !loop.value
  if (audioEl.value) audioEl.value.loop = loop.value
  // Persist to node attrs
  props.updateAttributes({ ...props.node.attrs, loop: loop.value })
}

function skipBackward() {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.max(0, (audioEl.value.currentTime || 0) - 10)
}

function skipForward() {
  if (!audioEl.value) return
  audioEl.value.currentTime = Math.min((audioEl.value.duration || 0), (audioEl.value.currentTime || 0) + 10)
}

// Volume control state: show on hover, hide 3s after mouseleave
const showVolume = ref(false)
let volumeHideTimeout: ReturnType<typeof setTimeout> | null = null
const volumePercent = ref(100)
const muted = ref(false)
let prevVolumePercent: number | null = null

function onVolumeEnter() {
  if (volumeHideTimeout) { clearTimeout(volumeHideTimeout); volumeHideTimeout = null }
  showVolume.value = true
}

function onVolumeLeave() {
  if (volumeHideTimeout) clearTimeout(volumeHideTimeout)
  volumeHideTimeout = setTimeout(() => { showVolume.value = false; volumeHideTimeout = null }, 1000)
}

function onVolumeInput(e: Event) {
  const target = e.target as HTMLInputElement
  const pct = Math.max(0, Math.min(100, target.valueAsNumber || 0))
  volumePercent.value = pct
  if (audioEl.value) {
    audioEl.value.volume = pct / 100
    audioEl.value.muted = pct === 0
  }
  muted.value = pct === 0
}

function toggleMute() {
  if (!audioEl.value) {
    muted.value = !muted.value
    return
  }

  if (!muted.value) {
    prevVolumePercent = volumePercent.value
    volumePercent.value = 0
    audioEl.value.muted = true
    audioEl.value.volume = 0
    muted.value = true
  } else {
    const restore = prevVolumePercent ?? 100
    volumePercent.value = restore
    audioEl.value.muted = false
    audioEl.value.volume = restore / 100
    muted.value = false
    prevVolumePercent = null
  }
}

function commitTitle() {
  // Only commit title changes when the editor is editable (read-only viewer should not mutate)
  if (!isEditorEditable.value) return
  props.updateAttributes({ ...props.node.attrs, title: titleLocal.value })
}

function handleKeydown(event: KeyboardEvent) {
  // Ignore keyboard shortcuts when the user is typing in an input/textarea/select or contenteditable element
  const tgt = event.target as HTMLElement | null
  if (tgt && (tgt.closest('input,textarea,select,[contenteditable="true"]') || tgt.isContentEditable)) return
  if (!audioEl.value) return

  switch (event.key) {
    case 'ArrowLeft':
      audioEl.value.currentTime = Math.max(0, audioEl.value.currentTime - 5)
      event.preventDefault()
      break
    case 'ArrowRight':
      audioEl.value.currentTime = Math.min(audioEl.value.duration || 0, audioEl.value.currentTime + 5)
      event.preventDefault()
      break
    case 'ArrowUp':
      audioEl.value.volume = Math.min(1, (audioEl.value.volume || 1) + 0.1)
      event.preventDefault()
      break
    case 'ArrowDown':
      audioEl.value.volume = Math.max(0, (audioEl.value.volume || 1) - 0.1)
      event.preventDefault()
      break
    case ' ':
    case 'Spacebar':
      event.preventDefault()
      onTogglePlay()
      break
  }
}

// Progress handle dragging
const progressTrack = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const wasPlayingBeforeDrag = ref(false)

function getClientXFromEvent(e: MouseEvent | TouchEvent) {
  if ('touches' in e) return e.touches[0]?.clientX ?? 0
  return (e as MouseEvent).clientX
}

function updateTimeFromClientX(clientX: number) {
  const el = progressTrack.value
  if (!el || !audioEl.value) return
  const rect = el.getBoundingClientRect()
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
  const pct = rect.width ? x / rect.width : 0
  const newTime = (duration.value || 0) * pct
  currentTime.value = newTime
  try { audioEl.value.currentTime = newTime } catch (_) {}
}

function onDragMove(e: MouseEvent | TouchEvent) {
  ;(e as Event).preventDefault && (e as Event).preventDefault()
  updateTimeFromClientX(getClientXFromEvent(e))
}

function stopDrag() {
  if (!isDragging.value) return
  isDragging.value = false
  if (wasPlayingBeforeDrag.value && audioEl.value) {
    try { audioEl.value.play() } catch (_) {}
  }
  window.removeEventListener('mousemove', onDragMove as any)
  window.removeEventListener('touchmove', onDragMove as any)
  window.removeEventListener('mouseup', stopDrag as any)
  window.removeEventListener('touchend', stopDrag as any)
  window.removeEventListener('touchcancel', stopDrag as any)
}

function startDrag(e: MouseEvent) {
  if (!progressTrack.value || !audioEl.value) return
  wasPlayingBeforeDrag.value = !audioEl.value.paused
  if (wasPlayingBeforeDrag.value) {
    try { audioEl.value.pause() } catch (_) {}
  }
  isDragging.value = true
  updateTimeFromClientX(getClientXFromEvent(e))
  window.addEventListener('mousemove', onDragMove as any)
  window.addEventListener('mouseup', stopDrag as any)
}

function startDragTouch(e: TouchEvent) {
  if (!progressTrack.value || !audioEl.value) return
  wasPlayingBeforeDrag.value = !audioEl.value.paused
  if (wasPlayingBeforeDrag.value) {
    try { audioEl.value.pause() } catch (_) {}
  }
  isDragging.value = true
  updateTimeFromClientX(getClientXFromEvent(e))
  window.addEventListener('touchmove', onDragMove as any, { passive: false })
  window.addEventListener('touchend', stopDrag as any)
  window.addEventListener('touchcancel', stopDrag as any)
}

onMounted(() => {
  if (audioEl.value) {
    audioEl.value.loop = loop.value
    // initialize volume percent from element
    volumePercent.value = Math.round((audioEl.value.volume ?? 1) * 100)
    muted.value = !!audioEl.value.muted || (audioEl.value.volume === 0)
  }
})

onBeforeUnmount(() => {
  // stop any in-progress drag and remove listeners
  stopDrag()
  if (audioEl.value && !audioEl.value.paused) {
    try { audioEl.value.pause() } catch (_) {}
  }
  if (volumeHideTimeout) { clearTimeout(volumeHideTimeout); volumeHideTimeout = null }
})
</script>

<style scoped>
.audio-figure { display:block; margin:1rem auto; max-width:820px; border-radius:12px; padding:10px; transition: all 0.2s ease; }
.dark .audio-figure { background: rgba(9,9,11,0.45); box-shadow: 0 8px 30px rgba(2,6,23,0.65); }

.control-card { display:flex; flex-direction:column; border: 1px solid transparent; background: #F8F9FA; gap: 14px; padding: 18px 26px; border-radius:12px; box-shadow: 0 8px 24px rgba(0,0,0,0.1); backdrop-filter: blur(6px); transition: border 0.2s ease; }
.dark .control-card { background: rgba(17,16,15,0.6); border: 1px solid rgba(255,255,255,0.05); box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.03) inset; color: #ffffff; }

.audio-figure.ProseMirror-selectednode .control-card:not(.is-playing)  { border: 1px solid rgba(0,0,0,0.1); }
.dark .audio-figure.ProseMirror-selectednode .control-card:not(.is-playing)  { border: 1px solid rgba(255,255,255,0.15); }
.control-card.is-playing { border-color: rgba(0, 70, 255, 0.4); box-shadow: 0 8px 24px rgba(0,70,255,0.2), 0 0 18px rgba(140,169,255,0.12); }
.dark .control-card.is-playing { border-color: rgba(251,191,36,0.4); box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 18px rgba(251,191,36,0.12); }

.top-row { display:flex; align-items:center; gap:16px; width:100%; }

.left-controls { display:flex; align-items:center; gap:8px; }
.icon-btn { width:36px; height:36px; border-radius:50%; background: rgba(255,255,255,0.03); display:flex; align-items:center; justify-content:center; border: none; transition: all 0.15s ease; }
.dark .icon-btn { color: #fbbf24; }
.icon-btn:hover { background: rgba(0,0,0,0.05); transform: scale(1.1); }
.dark .icon-btn:hover { background: rgba(255,255,255,0.08); }
.icon-btn:active { transform: scale(0.95); }

.square-play { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:none; box-shadow: 0 6px 16px rgba(251,191,36,0.08); transition: all 0.15s ease; }
.dark .square-play { background: rgba(0,0,0,0.6); color: #fbbf24; }
.square-play:hover { background: #ddd; box-shadow: 0 8px 20px rgba(251,191,36,0.14); transform: scale(1.05); }
.dark .square-play:hover { background: rgba(0,0,0,0.75); box-shadow: 0 8px 20px rgba(251,191,36,0.14); }
.square-play:active { transform: scale(0.95); }

.title-section { flex:1; min-width:0; }
.title { font-weight:600; font-size:1rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.title-input { font-weight:600; font-size:1rem; background:transparent; border:0; width:100%; color:inherit; padding:0; outline:none; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.progress-container { width:100%; }
.progress-track { position:relative; background: #FF8FB7; height: 6px; border-radius:999px; overflow:visible; cursor:pointer; }
.dark .progress-track { background: rgba(255,255,255,0.05); }
.progress { height:100%; background: linear-gradient(90deg,#8CA9FF,#0046FF); box-shadow: 0 6px 18px rgba(245,158,11,0.12); border-radius:999px; width:0; transition: box-shadow 0.15s ease; }
.dark .progress { background: linear-gradient(90deg,#fbbf24,#f59e0b); box-shadow: 0 6px 18px rgba(245,158,11,0.12); }
.progress-handle { background: #8CA9FF; box-shadow: 0 0 12px rgba(140,169,255,0.8); position:absolute; top:50%; transform: translate(-50%,-50%); width: 16px; height: 16px; border-radius:50%; left:0; pointer-events:auto; cursor:grab; z-index:2; touch-action:none; transition: transform 120ms ease; }
.progress-handle.is-dragging { cursor:grabbing; transform: translate(-50%,-50%) scale(1.05); }
.dark .progress-handle { background:#fbbf24; box-shadow: 0 0 12px rgba(245,158,11,0.8); }
.times { display:flex; justify-content:space-between; margin-top:8px; font-size: 1rem; font-weight: 600; }
/* .time-left, .time-right { color: #cbd5e1; } */
.right-controls { display:flex; align-items:center; gap:8px; }
.waveform-icon { font-size:18px; transition: all 0.2s ease; }
.waveform-icon.is-muted { opacity:0.4; }
.control-card.is-playing .waveform-icon:not(.is-muted) { font-size:18px; color: #fbbf24; animation: wave-animation 1s infinite; }
@keyframes wave-animation {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.3); }
}
.right-controls { position:relative; }
.volume-bubble {
  position:absolute;
  right:40px;
  top:50%;
  height: 32px;
  transform: translateY(-50%) translateX(6px);
  padding:6px 10px;
  border-radius:999px;
  display:flex;
  align-items:center;
  gap:10px;
  opacity:0;
  background: rgba(255,255,255,0.9);
  box-shadow: 0 6px 18px rgba(0,0,0,0.1);
  pointer-events:none;
  transition: opacity 160ms ease, transform 160ms ease;
}
.volume-bubble.visible {
  opacity:1;
  transform: translateY(-50%) translateX(0);
  pointer-events:auto;
}
.dark .volume-bubble { 
  background: rgba(0,0,0,0.6);
  box-shadow: 0 6px 18px rgba(0,0,0,0.6);
 }

.mute-btn { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; border:none; background: rgba(255,255,255,0.06); color: #1f2937; cursor:pointer; }
.dark .mute-btn { background: rgba(255,255,255,0.03); color: #fbbf24; }
.mute-btn:hover { transform:scale(1.05); }

.volume-slider { -webkit-appearance:none; appearance:none; width:160px; height:6px; background: transparent; }
.volume-slider:focus { outline:none; }
/* light mode: blue gradient */
.volume-slider::-webkit-slider-runnable-track { height:6px; background: linear-gradient(90deg,#8CA9FF,#0046FF); border-radius:999px; }
.volume-slider::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#8CA9FF; box-shadow: 0 0 12px rgba(140,169,255,0.8); margin-top:-3px; }
.volume-slider::-moz-range-track { height:6px; background: linear-gradient(90deg,#8CA9FF,#0046FF); border-radius:999px; }
.volume-slider::-moz-range-thumb { width:12px; height:12px; border-radius:50%; background:#8CA9FF; box-shadow: 0 0 12px rgba(140,169,255,0.8); border:none; }
/* dark mode overrides (amber) */
.dark .volume-slider::-webkit-slider-runnable-track { background: linear-gradient(90deg,#fbbf24,#f59e0b); }
.dark .volume-slider::-webkit-slider-thumb { background:#fbbf24; box-shadow: 0 0 12px rgba(245,158,11,0.8); }
.dark .volume-slider::-moz-range-track { background: linear-gradient(90deg,#fbbf24,#f59e0b); }
.dark .volume-slider::-moz-range-thumb { background:#fbbf24; box-shadow: 0 0 12px rgba(245,158,11,0.8); }

.editor-audio.sr-only { position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden; }
.caption-input { width:100%; background:transparent; border:0; color:inherit }
</style>