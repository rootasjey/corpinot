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
    <template v-for="(item, idx) in actions" :key="item.label">
      <button
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
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { FloatingMenu } from '@tiptap/vue-3/menus'
import type { ComponentPublicInstance } from 'vue'
import type { Editor } from '@tiptap/vue-3'

interface FloatingAction {
  label: string
  icon?: string
  isActive?: () => boolean
  action: () => void | Promise<void>
}

const props = withDefaults(defineProps<{
  editor: Editor | null
  editable?: boolean
  shouldShow?: any
  actions: FloatingAction[]
}>(), {
  editable: false,
  shouldShow: () => false,
})

const emit = defineEmits<{
  (e: 'select', action: FloatingAction, index: number): void
}>()

const buttons = ref<HTMLButtonElement[]>([])
const index = ref(-1)

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
    props.editor?.chain().focus().run()
  }
}

const onSelect = (item: FloatingAction, idx: number) => {
  emit('select', item, idx)
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
</style>