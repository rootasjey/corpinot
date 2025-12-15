
<template>
  <FloatingMenu
    v-if="editor && editable"
    :editor="editor"
    :should-show="shouldShow"
    class="floating-menu"
    role="menubar"
    aria-label="slash menu"
    @keydown.stop.prevent="onKeydown"
  >
    <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onFilesChange" />
    <template v-for="(item, idx) in actions" :key="item.label">
      <div v-if="item.ask" class="relative inline-flex">
        <button
          :ref="(el) => registerButton(el, idx)"
          @click.stop.prevent="toggleAiMenu(idx)"
          :class="['menu-item', { 'is-active': item.isActive?.() } ]"
          type="button"
          role="menuitem"
          tabindex="-1"
          :title="item.label"
        >
          <span v-if="item.icon" :class="item.icon" aria-hidden="true" />
          <span class="sr-only">{{ item.label }}</span>
        </button>

        <div v-if="aiMenuIndex === idx" 
          class="ai-popover" 
          :class="{
            'w-48': !aiAskOpen,
            'w-92': aiAskOpen
          }"
          @keydown.stop="onAiKeydown"
        >
          <button ref="aiContinueBtn" type="button" class="ai-option" @click="handleAiContinue(item, idx)">
            <span class="i-lucide-pen ai-option-icon" aria-hidden="true" />
            <span>Continue writing</span>
          </button>
          <button ref="aiAskBtn" type="button" class="ai-option" @click="openAiAsk(idx)">
            <span class="i-lucide-messages-square ai-option-icon" aria-hidden="true" />
            <span>Ask</span>
          </button>

          <div v-if="aiAskOpen && aiMenuIndex === idx" class="mt-2 space-y-2">
            <label class="sr-only" :for="`ai-prompt-${idx}`">Ask the AI</label>
            <NInput
              input="outline-gray"
              :id="`ai-prompt-${idx}`"
              ref="aiPromptInput"
              v-model="aiPrompt"
              class="ai-ask-input"
              placeholder="Ask the AI..."
              @keydown.enter.prevent="submitAiAsk(item, idx)"
              @keydown.esc.stop="closeAiAsk()"
            />
            <div class="pt-2 flex items-center justify-end gap-2">
              <NButton 
                type="button" 
                btn="outline-gray" 
                label="Cancel"
                leading="i-ph-arrow-bend-up-left"
                class="py-1.5" 
                @click="closeAiMenu"
              />
              <NButton
                type="button"
                label="Send"
                btn="outline-gray"
                trailing="i-lucide-send"
                class="min-w-28 py-1.5"
                :disabled="!aiPrompt.trim().length"
                @click="submitAiAsk(item, idx)"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        v-else
        :ref="(el) => registerButton(el, idx)"
        @click="onSelect(item, idx)"
        :class="['menu-item', { 'is-active': item.isActive?.() } ]"
        type="button"
        role="menuitem"
        tabindex="-1"
        :title="item.label"
      >
        <span v-if="item.icon" :class="item.icon" aria-hidden="true" />
        <span class="sr-only">{{ item.label }}</span>
      </button>
    </template>
  </FloatingMenu>
</template>

<script setup lang="ts">
import { FloatingMenu } from '@tiptap/vue-3/menus'
import { nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import type { Editor } from '@tiptap/vue-3'

interface FloatingAction {
  label: string
  icon?: string
  isActive?: () => boolean
  action: () => void | Promise<void>
  ask?: (prompt: string) => void | Promise<void>
}

const props = withDefaults(defineProps<{
  editor: Editor | null
  editable?: boolean
  shouldShow?: any
  actions: FloatingAction[]
  onInsertImages?: (files: FileList) => void
}>(), {
  editable: false,
  shouldShow: () => false,
})

const emit = defineEmits<{
  (e: 'select', action: FloatingAction, index: number): void
}>()

const buttons = ref<HTMLButtonElement[]>([])
const index = ref(-1)
const fileInput = ref<HTMLInputElement | null>(null)
const aiMenuIndex = ref(-1)
const aiAskOpen = ref(false)
const aiPrompt = ref('')
const aiPromptInput = ref<HTMLInputElement | HTMLInputElement[] | null>(null)
// Vue collects refs inside v-for into arrays, so accept either a single element or an array
const aiContinueBtn = ref<HTMLButtonElement | HTMLButtonElement[] | null>(null)
const aiAskBtn = ref<HTMLButtonElement | HTMLButtonElement[] | null>(null)
const aiPopoverFocusIndex = ref(0) // 0: Continue, 1: Ask

const getContinueBtn = () => {
  const el = aiContinueBtn.value
  return Array.isArray(el) ? el[aiMenuIndex.value] ?? el[0] : el
}

const getAskBtn = () => {
  const el = aiAskBtn.value
  return Array.isArray(el) ? el[aiMenuIndex.value] ?? el[0] : el
}

const getAiPromptInput = () => {
  const el = aiPromptInput.value
  return Array.isArray(el) ? (el[aiMenuIndex.value] ?? el[0]) : el
}

const registerButton = (el: Element | ComponentPublicInstance | null, idx: number) => {
  if (!el) return

  // The ref callback can receive either a raw DOM node or a component instance.
  // Normalize to an HTMLButtonElement before storing it.
  if (el instanceof Element) {
    buttons.value[idx] = el as HTMLButtonElement
    return
  }

  // If we received a Vue component instance, use its $el (root DOM node).
  const instance = el as ComponentPublicInstance
  if (instance?.$el instanceof Element) {
    buttons.value[idx] = instance.$el as HTMLButtonElement
  }
}

const focusButton = (i: number) => {
  if (!buttons.value.length) return
  index.value = ((i % buttons.value.length) + buttons.value.length) % buttons.value.length
  buttons.value[index.value]?.focus()
}

const closeAiMenu = (returnFocus = true) => {
  const prev = aiMenuIndex.value
  aiMenuIndex.value = -1
  aiAskOpen.value = false
  aiPrompt.value = ''
  if (returnFocus && prev >= 0) buttons.value[prev]?.focus()
}

const toggleAiMenu = async (idx: number) => {
  aiMenuIndex.value = aiMenuIndex.value === idx ? -1 : idx
  aiAskOpen.value = false
  aiPrompt.value = ''
  await nextTick()
  if (aiMenuIndex.value === idx) {
    aiPopoverFocusIndex.value = 0
    getContinueBtn()?.focus()
  }
}

const handleAiContinue = (item: FloatingAction, idx: number) => {
  closeAiMenu(false)
  // Emit the continue command — parent will focus the editor
  emit('select', item, idx)
}

const openAiAsk = async (idx: number) => {
  aiMenuIndex.value = idx
  aiAskOpen.value = true
  aiPopoverFocusIndex.value = 1
  await nextTick()
  getAiPromptInput()?.focus()
}

const closeAiAsk = () => {
  aiAskOpen.value = false
  aiPrompt.value = ''
  getAskBtn()?.focus()
}

const submitAiAsk = (item: FloatingAction, idx: number) => {
  const prompt = aiPrompt.value.trim()
  if (!prompt) {
      getAiPromptInput()?.focus()
  }

  const askAction: FloatingAction = { ...item, action: () => item.ask?.(prompt) }
  closeAiMenu()
  emit('select', askAction, idx)
}

const focusAiOption = (i: number) => {
  aiPopoverFocusIndex.value = i
  if (i === 0) getContinueBtn()?.focus()
  else if (i === 1) {
    if (aiAskOpen.value) getAiPromptInput()?.focus()
    else getAskBtn()?.focus()
  }
}

const onAiKeydown = (e: KeyboardEvent) => {
  if (aiMenuIndex.value < 0) return
  // If the Ask input is focused, allow normal typing and navigation inside it
  const inputEl = getAiPromptInput()
  if (inputEl && document.activeElement === inputEl) return
  const key = e.key
  if (['ArrowDown', 'ArrowRight', 'Tab'].includes(key) && !e.shiftKey) {
    e.preventDefault()
    focusAiOption((aiPopoverFocusIndex.value + 1) % 2)
    return
  }
  if (['ArrowUp', 'ArrowLeft'].includes(key) || (key === 'Tab' && e.shiftKey)) {
    e.preventDefault()
    focusAiOption((aiPopoverFocusIndex.value - 1 + 2) % 2)
    return
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
    e.preventDefault()
    // Trigger the focused control
    if (aiPopoverFocusIndex.value === 0) {
      const aiItem = props.actions[aiMenuIndex.value]
      if (aiItem) handleAiContinue(aiItem, aiMenuIndex.value)
    } else if (aiPopoverFocusIndex.value === 1) {
      // If Ask is selected, open input
      openAiAsk(aiMenuIndex.value)
    }
    return
  }
  
  if (key === 'Escape') {
    e.preventDefault()
    closeAiMenu()
    return
  }
}

const onKeydown = (e: KeyboardEvent) => {
  const key = e.key
  if (['ArrowRight', 'ArrowDown'].includes(key) || (key === 'Tab' && !e.shiftKey)) {
    e.preventDefault()
    focusButton(index.value + 1)
    return
  }
  if (['ArrowLeft', 'ArrowUp'].includes(key) || (key === 'Tab' && e.shiftKey)) {
    e.preventDefault()
    focusButton(index.value - 1)
    return
  }
  if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
    e.preventDefault()
    const i = index.value >= 0 ? index.value : 0
    buttons.value[i]?.click()
    return
  }
  if (key === 'Escape' || key === 'Backspace') {
    e.preventDefault()
    index.value = -1
    closeAiMenu()
    props.editor?.chain().focus().run()
  }
}

const onSelect = (item: FloatingAction, idx: number) => {
  closeAiMenu()
  if (item.label === 'Image' && props.onInsertImages) {
    // Trigger hidden file input for image selection
    fileInput.value?.click()
    return
  }
  emit('select', item, idx)
}

function onFilesChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  props.onInsertImages?.(input.files)
  // Reset so selecting same file again triggers change
  input.value = ''
}

// When the editor selection changes we re-evaluate the `shouldShow` predicate
// and focus the first button when the menu becomes visible.
watch(
  () => props.editor?.state.selection.from,
  async () => {
    if (!props.editor) return
    const visible = typeof props.shouldShow === 'function' ? props.shouldShow({ state: props.editor.state, editor: props.editor }) : false
    if (!visible) {
      index.value = -1
      closeAiMenu()
      return
    }
    await nextTick()
    focusButton(0)
  }
)
</script>

<style scoped>
.floating-menu .menu-item {
  @apply p-1.5 rounded-md text-foreground/80 hover:bg-muted transition-colors flex items-center justify-center min-w-[28px];
}

.floating-menu .menu-item:focus {
  outline: none;
  background: rgba(245, 245, 244, 1);
  color: var(--un-primary-color, #2563eb);
  transform: translateY(-1px);
}

.dark .floating-menu .menu-item:focus {
  background: rgba(41, 37, 36, 1);
}

.floating-menu .menu-item:focus .i-lucide-list,
.floating-menu .menu-item:focus .i-lucide-list-ordered,
.floating-menu .menu-item:focus .i-lucide-check-square,
.floating-menu .menu-item:focus .i-lucide-quote,
.floating-menu .menu-item:focus .i-lucide-image,
.floating-menu .menu-item:focus .i-lucide-heading-1,
.floating-menu .menu-item:focus .i-lucide-heading-2 {
  color: var(--un-primary-color, #2563eb);
}

.ai-popover {
  @apply absolute mt-2 rounded-xl border border-border bg-background z-1 p-3 shadow-lg transition-width;
}

.ai-option {
  @apply outline-none flex w-full justify-start items-center gap-2 rounded-lg px-2 py-1.5 font-500 text-left text-sm text-foreground/90 transition-colors hover:bg-muted focus:bg-muted focus:color-blue-500;
}

.ai-option-icon {
  @apply text-base text-foreground/80;
}

.ai-ask-input {
  @apply w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/60;
}
</style>