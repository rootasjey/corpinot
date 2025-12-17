<template>
  <template v-if="!isDesktop">
    <NDrawer v-model:open="isOpen" placement="bottom">
      <template #body>
        <div class="p-4 sm:p-6 space-y-4">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="text-lg font-semibold">Site settings</div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Manage socials displayed in the header.</p>
            </div>
            <NButton btn="ghost-gray" size="xs" @click="close">Close</NButton>
          </div>

          <div v-if="!isAdmin" class="text-sm text-red-600 dark:text-red-400">You need admin permissions to edit site settings.</div>

          <div v-else class="space-y-3">
            <div v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
            <div v-if="success" class="text-sm text-green-600 dark:text-green-400">{{ success }}</div>

            <SocialsEditor
              v-model="localSocials"
              :saving="saving"
              @save="handleSave"
              @cancel="close"
            />
          </div>
        </div>
      </template>
    </NDrawer>
  </template>

  <template v-else>
    <NDialog v-model:open="isOpen">
      <NDialogContent class="max-w-2xl">
        <NDialogHeader>
          <NDialogTitle>
              <div class="text-lg font-semibold">Site settings</div>
              <p class="text-sm text-slate-600 dark:text-slate-400">Manage socials displayed in the header.</p>
          </NDialogTitle>
        </NDialogHeader>
        <div class="space-y-4">
          <div v-if="!isAdmin" class="text-sm text-red-600 dark:text-red-400">You need admin permissions to edit site settings.</div>

          <div v-else class="space-y-3">
            <div v-if="error" class="text-sm text-red-600 dark:text-red-400">{{ error }}</div>
            <div v-if="success" class="text-sm text-green-600 dark:text-green-400">{{ success }}</div>

            <SocialsEditor
              v-model="localSocials"
              :saving="saving"
              @save="handleSave"
              @cancel="close"
            />
          </div>
        </div>
      </NDialogContent>
    </NDialog>
  </template>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import useSiteSettings, { type SocialLink } from '~/composables/useSiteSettings'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['update:open'])

const isDesktop = useMediaQuery('(min-width: 1024px)')

const isOpen = computed({
  get: () => props.open,
  set: (v: boolean) => {
    emit('update:open', v)
  },
})

const { socials, fetchSettings, updateSocials, loading, error: loadError } = useSiteSettings()
const localSocials = ref<SocialLink[]>([])
const saving = ref(false)
const success = ref('')
const error = ref('')

const { user, loggedIn } = useUserSession()
const isAdmin = computed(() => !!(loggedIn?.value && user.value?.role === 'admin'))

// Keep a snapshot when settings load (but don't overwrite while editing)
watch(socials, (v) => {
  if (!isOpen.value) {
    localSocials.value = JSON.parse(JSON.stringify(v || []))
  }
}, { immediate: true, deep: true })

watch(isOpen, (newIsOpen) => {
  if (!newIsOpen) return
  
  localSocials.value = JSON.parse(JSON.stringify(socials.value || []))
  success.value = ''
  error.value = loadError.value || ''
  
  if (!socials.value.length) {
    fetchSettings()
  }
})

async function handleSave(payload: SocialLink[]) {
  if (!isAdmin.value) {
    error.value = 'Admin permission required'
    return
  }
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await updateSocials(payload)
    await fetchSettings()
    success.value = 'Socials updated'
    close()
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Failed to update socials'
  } finally {
    saving.value = false
  }
}

function close() {
  isOpen.value = false
}
</script>
