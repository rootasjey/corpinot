<template>
  <!-- Render a bottom drawer on small screens, and a centered dialog on desktop -->
  <template v-if="!isDesktop">
    <NDrawer v-model:open="open" placement="bottom">
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-semibold">Create Post</h3>
          <NDrawerClose />
        </div>
      </template>

      <template #body>
        <div class="p-4">
          <div class="grid gap-3">
            <NInput v-model="name" placeholder="Title" input="outline" />

            <NInput
              v-model="description"
              type="textarea"
              :rows="4"
              placeholder="Short description (optional)"
              input="outline"
            />

            <NInput v-model="tagsText" placeholder="Tags (comma separated)" input="outline" />

            <div v-if="assignedTag" class="mt-2">
              <span class="text-xs text-slate-500 dark:text-slate-400">Assigned tag:</span>
              <NBadge badge="soft" color="gray" class="ml-2">{{ assignedTag }}</NBadge>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <NButton @click="close" btn="ghost-gray">Cancel</NButton>
              <NButton :disabled="!name || creating" @click="create" btn="solid-primary">
                <NIcon :name="creating ? 'i-lucide-loader' : 'i-lucide-plus'" :class="{ 'animate-spin': creating }" />
                <span class="ml-2">Create</span>
              </NButton>
            </div>
          </div>
        </div>
      </template>
    </NDrawer>
  </template>

  <template v-else>
    <NDialog v-model:open="open">
      <NDialogOverlay />
      <NDialogContent class="max-w-2xl">
        <NDialogHeader>
          <NDialogTitle>Create Post</NDialogTitle>
        </NDialogHeader>

        <div class="mt-2 p-2">
          <div class="grid gap-3">
            <NInput v-model="name" placeholder="Title" input="outline" autofocus />

            <NInput
              v-model="description"
              type="textarea"
              :rows="4"
              placeholder="Short description (optional)"
              input="outline"
            />

            <NInput v-model="tagsText" placeholder="Tags (comma separated)" input="outline" />

            <div v-if="assignedTag" class="mt-2">
              <span class="text-xs text-slate-500 dark:text-slate-400">Assigned tag:</span>
              <NBadge badge="soft" color="gray" class="ml-2">{{ assignedTag }}</NBadge>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2">
              <NDialogFooter class="flex items-center gap-2 justify-end p-0">
                <NButton @click="close" btn="ghost-gray">Cancel</NButton>
                <NButton :disabled="!name || creating" @click="create" btn="soft-blue">
                  <NIcon :name="creating ? 'i-lucide-loader' : 'i-lucide-plus'" :class="{ 'animate-spin': creating }" />
                  <span class="ml-2">Create</span>
                </NButton>
              </NDialogFooter>
            </div>
          </div>
        </div>
      </NDialogContent>
    </NDialog>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'

const props = defineProps({ modelValue: { type: Boolean, default: false }, defaultTag: { type: String, required: false } })
const emit = defineEmits(['update:modelValue', 'created'])

const open = ref(props.modelValue)
watch(() => props.modelValue, (v) => (open.value = v))
watch(open, (v) => emit('update:modelValue', v))

const name = ref('')
const description = ref('')
const tagsText = ref('')
const creating = ref(false)

const router = useRouter()

// Detect desktop (>= 1024px) to show dialog instead of drawer
const isDesktop = useMediaQuery('(min-width: 1024px)')

const close = () => {
  open.value = false
}

const assignedTag = computed(() => props.defaultTag ? props.defaultTag.trim() : '')

const create = async () => {
  if (!name.value) return
  creating.value = true
  try {
    let tags = tagsText.value
      ? tagsText.value.split(',').map((t) => ({ name: t.trim() })).filter((t) => t.name)
      : undefined

    // Ensure defaultTag is included (no duplicates), if provided
    if (props.defaultTag) {
      const desired = props.defaultTag.trim()
      if (desired) {
        const currentNames = (tags || []).map((t) => t.name.toLowerCase())
        if (!currentNames.includes(desired.toLowerCase())) {
          tags = tags ? [...tags, { name: desired }] : [{ name: desired }]
        }
      }
    }

    const res: any = await $fetch('/api/posts', {
      method: 'POST',
      body: { name: name.value, description: description.value || undefined, tags },
    })

    emit('created', res)
    open.value = false
    // navigate to editor for new post
    await router.push(`/posts/edit/${res.id}`)
  } catch (e: any) {
    console.error('Create post failed', e)
    // lightweight error surface
    try { alert(e?.data?.message || e?.message || 'Failed to create post') } catch {}
  } finally {
    creating.value = false
  }
}
</script>

<style scoped>
.grid { max-width: 720px; }
</style>
