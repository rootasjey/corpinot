<template>
  <!-- Drawer on mobile, dialog on desktop -->
  <template v-if="isMobile">
    <NDrawer v-model:open="open" placement="bottom">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold">Uncommon nodes</h3>
          <NDrawerClose />
        </div>
      </template>

      <template #body>
        <div class="p-4">
          <div class="grid gap-3">
            <NButton @click="select('conway')" btn="outline" class="justify-start">
              <NIcon name="i-ph-circles-three-duotone" class="mr-2" /> Conway
            </NButton>
          </div>
        </div>
      </template>
    </NDrawer>
  </template>

  <template v-else>
    <NDialog v-model:open="open">
      <NDialogContent class="max-w-2xl">
        <NDialogHeader>
          <NDialogTitle>Uncommon nodes</NDialogTitle>
        </NDialogHeader>

        <div class="mt-2 p-2">
          <div class="grid gap-3">
            <NButton @click="select('conway')" btn="outline" class="justify-start">
              <NIcon name="i-ph-circles-three-duotone" class="mr-2" /> Conway
            </NButton>
          </div>
        </div>

        <NDialogFooter class="flex items-center gap-2 justify-end p-0">
          <NButton @click="close" btn="ghost-gray">Close</NButton>
        </NDialogFooter>
      </NDialogContent>
    </NDialog>
  </template>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIsMobile } from '~/composables/useIsMobile'

const props = defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue', 'select'])

const open = ref(props.modelValue)
watch(() => props.modelValue, (v) => (open.value = v))
watch(open, (v) => emit('update:modelValue', v))

const isMobile = useIsMobile()

function close() {
  open.value = false
}

function select(type: string) {
  emit('select', { type })
  open.value = false
}
</script>

<style scoped>
/* Keep styles minimal — buttons use global UI theme */
</style>
