<template>
  <div>
    <NDropdownMenu :items="items">
      <template #default>
        <NButton :disabled="disabled" icon btn="~" size="xs" @click.stop.prevent>
          <NIcon :name="iconName" />
        </NButton>
      </template>
    </NDropdownMenu>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  items: any[]
  disabled?: boolean
  iconName?: string
}>()

const iconName = props.iconName ?? 'i-ph-dots-three-vertical-bold'
</script>
