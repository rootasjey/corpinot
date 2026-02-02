<template>
  <span class="typewriter-text" role="status" aria-live="polite">
    <span>{{ displayed }}</span><span v-if="cursorVisible" class="cursor" aria-hidden="true">|</span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  text: { type: String, required: true },
  speed: { type: Number, default: 45 },
  cursor: { type: Boolean, default: true },
  autoHideCursor: { type: Boolean, default: false }, // when true, hide cursor automatically after 10s
})

const displayed = ref('')
let timer: ReturnType<typeof setInterval> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
const cursorVisible = ref(props.cursor)

function setupAutoHide() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  if (!import.meta.client || !props.autoHideCursor) return
  if (!props.cursor) {
    cursorVisible.value = false
    return
  }
  hideTimer = setTimeout(() => {
    cursorVisible.value = false
    hideTimer = null
  }, 10000) // 10 seconds
}

function clearAutoHide() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function startTyping() {
  // Server-side: render full text immediately to avoid SSR timing issues
  if (!import.meta.client) {
    displayed.value = props.text
    return
  }

  if (timer) clearInterval(timer)
  displayed.value = ''
  let i = 0
  // ensure cursor visible when typing starts
  cursorVisible.value = props.cursor
  timer = setInterval(() => {
    if (i < props.text.length) {
      displayed.value += props.text[i++]
    } else {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
  }, props.speed)

  // (re)start auto-hide timer when typing starts
  if (props.autoHideCursor) setupAutoHide()
}

watch(() => props.text, () => {
  startTyping()
})

watch(() => props.autoHideCursor, (v) => {
  if (v) setupAutoHide()
  else clearAutoHide()
})

watch(() => props.cursor, (v) => {
  cursorVisible.value = v
  if (v && props.autoHideCursor) setupAutoHide()
  else if (!v) clearAutoHide()
})

onMounted(() => {
  startTyping()
  if (props.autoHideCursor) setupAutoHide()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (hideTimer) clearTimeout(hideTimer)
})
</script>

<style scoped>
.typewriter-text {
  display: inline-block;
}
.cursor {
  display: inline-block;
  margin-left: 0.12em;
  width: 0.6ch;
  animation: blink 1s steps(1, start) infinite;
  opacity: 0.9;
}
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
</style>
