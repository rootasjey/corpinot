<template>
  <NDialog v-model:open="open">
    <NDialogContent class="max-w-xl">
      <NDialogHeader>
        <NDialogTitle>Edit post slug</NDialogTitle>
      </NDialogHeader>

      <NDialogDescription>
        Use a short, URL-friendly slug. Lowercase letters, numbers and hyphens only.
      </NDialogDescription>

      <div class="mt-4">
        <NInput
          v-model="localSlugCandidate"
          placeholder="enter slug"
          input="outline"
          class="w-full"
          :maxlength="255"
          autofocus
        />
      </div>

      <!-- Reserve space for messages so the UI doesn't jump when messages appear/disappear -->
      <div class="text-sm min-h-[1rem]">
        <span v-if="slugCheckLoading" class="text-foreground/70"><NIcon name="i-ph-spinner animate-spin" /> Checking slug availability…</span>
        <span v-else-if="error" class="text-danger">{{ error }}</span>
        <span v-else-if="slugTaken" class="text-danger">{{ slugCheckMessage }}</span>
        <span v-else-if="slugCheckMessage" class="text-success"><NIcon name="i-ph-check-circle" /> {{ slugCheckMessage }}</span>

        <!-- placeholder to keep a consistent height when nothing to show -->
        <span v-else class="invisible">placeholder</span>
      </div>

      <NDialogFooter class="flex items-center gap-2 justify-end">
        <NButton btn="ghost-gray" class="px-5" @click="close">Cancel</NButton>
        <NButton
          btn="soft-blue"
          class="px-8 py-0 min-h-0"
          :trailing='disableSave ? "" : "i-ph-check"'
          :disabled="disableSave"
          @click="onSave"
        >
          Save
        </NButton>
      </NDialogFooter>
    </NDialogContent>
  </NDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  slugCandidate: { type: String, required: false },
  slug: { type: String, required: false },
  slugCheckLoading: { type: Boolean, required: false, default: false },
  slugTaken: { type: Boolean, required: false, default: false },
  slugCheckMessage: { type: String, required: false, default: '' },
  error: { type: String, required: false, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:slugCandidate', 'save'])

const open = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

// We'll make a local copy of slugCandidate to allow immediate UI feedback
const localSlugCandidate = ref(props.slugCandidate || '')
const disableSave = computed(() => {
  return !localSlugCandidate.value || localSlugCandidate.value === props.slug || props.slugTaken
})

watch(
  () => props.slugCandidate,
  (v) => (localSlugCandidate.value = v || '')
)

watch(localSlugCandidate, (v) => {
  emit('update:slugCandidate', v)
})

const close = () => {
  emit('update:modelValue', false)
}

const onSave = () => {
  emit('save')
}
</script>
