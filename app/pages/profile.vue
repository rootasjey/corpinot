<template>
  <section class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Sticky toolbar -->
    <div class="sticky top-0 z-30 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container mx-auto px-4 md:px-8 py-3">
        <div class="flex items-center justify-between gap-2">
          <NButton link to="/" btn="ghost-gray" size="xs">← Back</NButton>
          <div class="flex items-center gap-4">
            <div class="min-w-0 sm:min-w-[220px]">
              <div v-if="successMessage" class="text-sm truncate text-green-600 dark:text-green-400">{{ successMessage }}</div>
              <div v-else-if="errorMessage" class="text-sm truncate text-red-600 dark:text-red-400">{{ errorMessage }}</div>
            </div>
            <div class="flex items-center gap-2">
              <NButton :disabled="!hasChanges || isSaving" @click="onSubmit" btn="soft-gray" size="sm">
                <NIcon :name="isSaving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': isSaving }" />
                <span class="ml-2">Save</span>
              </NButton>
              <NButton @click="resetForm" btn="ghost-gray" size="sm">Cancel</NButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container mx-auto px-6 max-w-7xl py-10">
      <!-- Hero area: big name left, large avatar right -->
      <div class="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div class="flex-1 md:max-w-3xl">
          <!-- Big editable name styled like the design -->
          <textarea
            ref="nameTextarea"
            v-model="form.name"
            rows="1"
            class="w-full resize-none overflow-hidden text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif font-800 leading-none bg-transparent outline-none focus:outline-none uppercase text-pink-500"
            placeholder="Your name"
            @input="autoResizeName"
          />
          <NInput v-model="form.job" placeholder="Add a job title" input="~" class="mt-2 bg-transparent outline-none w-full text-gray-700 dark:text-gray-300" />
          <NInput
            input="~"
            v-model="form.biography"
            type="textarea"
            :rows="4"
            class="bg-transparent outline-none w-full text-gray-700 dark:text-gray-300"
            placeholder="Write a short biography about yourself..."
          />
        </div>

        <div
          class="relative group w-48 sm:w-64 md:w-72 lg:w-96 rounded-3xl overflow-hidden bg-pink-50 dark:bg-pink-900/20 flex items-center justify-center border transition-colors"
          :class="avatarDragOver ? 'border-primary/60 bg-pink-100 dark:bg-pink-900/40' : 'border-transparent'"
          @dragover.prevent="onAvatarDragOver"
          @dragleave.prevent="onAvatarDragLeave"
          @drop.prevent="onAvatarDrop"
        >
          <NuxtImg v-if="displayAvatar" provider="hubblob" :src="displayAvatar" :alt="form.name" class="object-cover w-full h-full" />
          <div v-else class="w-full h-40 md:h-64 flex items-center justify-center text-3xl sm:text-4xl font-bold text-gray-600 dark:text-gray-200">{{ userInitials }}</div>
          <div class="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <NButton @click="triggerAvatarFileInput" btn="solid-white" size="sm" leading="i-ph-image" :disabled="avatarUploading">
              {{ avatarUploading ? 'Uploading…' : displayAvatar ? 'Change' : 'Add' }}
            </NButton>
            <NButton @click="openDeleteAvatarDialog" :disabled="!displayAvatar" btn="solid-gray" size="sm" leading="i-ph-trash" color="danger">Remove</NButton>
          </div>
          <div v-if="avatarUploading" class="absolute left-0 bottom-0 w-full h-1 bg-black/10 rounded-b-2xl overflow-hidden">
            <div class="h-full bg-primary transition-all duration-300" :style="{ width: avatarUploadProgress + '%' }" />
          </div>
          <input ref="avatarFileInput" type="file" accept="image/*" class="hidden" @change="handleAvatarFileChange" />
        </div>
      </div>

      <div class="bg-white dark:bg-gray-950 rounded-2xl mt-8">
        <form @submit.prevent="onSubmit">
          <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Email -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-mail" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Email</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Your contact address</div>
              <NInput v-model="form.email" placeholder="email@domain.com" input="~" class="bg-transparent outline-none w-full" type="email" />
            </div>

            <!-- Location -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-map-pin" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Location</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Where you’re based</div>
              <NInput v-model="form.location" placeholder="City, Country" input="~" class="bg-transparent outline-none w-full" />
            </div>

            <!-- Avatar URL -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-ph-image" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Avatar</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Image URL to use as avatar</div>
              <NInput v-model="form.avatar" placeholder="https://..." input="~" class="bg-transparent outline-none w-full" />
            </div>

            <!-- Job -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-briefcase" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Job</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Your current title</div>
              <NInput v-model="form.job" placeholder="Job title" input="~" class="bg-transparent outline-none w-full" />
            </div>

            <!-- Language -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-globe" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Language</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Preferred language code</div>
              <NInput v-model="form.language" placeholder="en" input="~" class="bg-transparent outline-none w-full" />
            </div>

            <!-- Socials -->
            <div class="flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-link" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Socials</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">Manage your social profiles</div>
              <div class="w-full flex items-center gap-3">
                <NButton @click="openSocialsDialog" btn="soft" size="sm">Edit socials</NButton>
                <div class="text-sm text-gray-600 dark:text-gray-400">{{ socialsSummary }}</div>
              </div>
            </div>

            <!-- Biography (full-width) -->
            <div class="sm:col-span-2 lg:col-span-3 flex flex-col items-start gap-4 p-6 rounded-xl border b-dashed hover:b-solid border-gray-50 dark:border-gray-800 bg-background/50">
              <NIcon name="i-lucide-align-left" class="text-pink-500 text-3xl sm:text-4xl" />
              <div class="uppercase text-lg sm:text-xl font-bold text-pink-500">Biography</div>
              <div class="text-sm text-gray-500 dark:text-gray-400">A short bio shown on your profile</div>
              <NInput v-model="form.biography" input="~" type="textarea" :rows="6" class="bg-transparent outline-none w-full" />
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6">
            <NButton :disabled="isSaving || !hasChanges" type="submit" btn="soft-gray" class="w-full sm:w-auto">{{ isSaving ? 'Saving…' : 'Save' }}</NButton>
            <NButton @click="resetForm" btn="ghost-gray" class="w-full sm:w-auto">Reset</NButton>

            <div class="mt-2 sm:mt-0 ml-0 sm:ml-auto min-w-0 sm:min-w-[220px] text-sm">
              <div v-if="errorMessage" class="text-sm truncate text-red-600 dark:text-red-400">{{ errorMessage }}</div>
              <div v-if="successMessage" class="text-sm truncate text-green-600 dark:text-green-400">{{ successMessage }}</div>
            </div>
          </div>
        </form>
      </div>
      
      <!-- Socials editor dialog -->
      <NDialog v-model:open="socialsDialogOpen" :closeOnEsc="true">
        <NDialogOverlay />
          <NDialogContent class="max-w-full sm:max-w-2xl">
          <NDialogHeader>
            <NDialogTitle>Edit socials</NDialogTitle>
          </NDialogHeader>

          <div class="p-6 space-y-4">
            <div v-if="!socialsDraft.length" class="text-sm text-gray-500 dark:text-gray-400">No socials yet. Add one below.</div>
            <div v-for="(s, i) in socialsDraft" :key="i" class="flex items-center gap-3">
              <NIcon :name="platformIcon(s.platform)" class="text-2xl text-gray-500" />
              <NInput ref="socialPlatformRefs" v-model="s.platform" placeholder="Platform (e.g. Twitter)" input="~" class="w-28 sm:w-40" />
              <NInput ref="socialUrlRefs" v-model="s.url" placeholder="https://..." input="~" class="flex-1" />
              <NButton @click="removeSocialRow(i)" btn="ghost" size="xs" icon label="i-lucide-x" />
            </div>
          </div>

          <NDialogFooter class="flex items-center gap-2 justify-end p-0">
            <div class="flex items-center gap-2">
              <NButton @click="addSocialRow" btn="soft" size="xs" class="px-6">Add</NButton>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <NButton @click="closeSocialsDialog" btn="ghost-gray" size="xs" :disabled="socialsSaving">Cancel</NButton>
              <NButton @click="saveSocialsDialog" :disabled="socialsSaving" btn="soft-pink" size="xs">
                <NIcon :name="socialsSaving ? 'i-lucide-loader' : 'i-lucide-save'" :class="{ 'animate-spin': socialsSaving }" />
                <span class="ml-2">Save</span>
              </NButton>
            </div>
          </NDialogFooter>
        </NDialogContent>
      </NDialog>

      <!-- Confirm delete avatar dialog -->
      <NDialog v-model:open="deleteAvatarDialogOpen" :closeOnEsc="true">
        <NDialogOverlay />
        <NDialogContent class="max-w-sm">
          <NDialogHeader>
            <NDialogTitle>Remove avatar</NDialogTitle>
          </NDialogHeader>

          <div class="p-6 text-sm text-gray-600 dark:text-gray-400">Are you sure you want to remove your avatar? This action cannot be undone.</div>

          <NDialogFooter class="flex items-center gap-2 justify-end p-0">
            <div class="flex items-center gap-2">
              <NButton @click="deleteAvatarDialogOpen = false" btn="ghost-gray" size="xs" :disabled="isDeletingAvatar">Cancel</NButton>
            </div>
            <div class="ml-auto flex items-center gap-2">
              <NButton @click="confirmDeleteAvatar" :disabled="isDeletingAvatar" btn="soft-pink" size="xs" color="danger">
                <NIcon :name="isDeletingAvatar ? 'i-lucide-loader' : 'i-lucide-trash'" :class="{ 'animate-spin': isDeletingAvatar }" />
                <span class="ml-2">Remove</span>
              </NButton>
            </div>
          </NDialogFooter>
        </NDialogContent>
      </NDialog>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
useHead({ title: 'Profile - Corpinot' })
const { user, loggedIn, fetch: refreshSession } = useUserSession()

// Redirect unauthenticated users on client-side
if (typeof loggedIn !== 'boolean' ? !loggedIn.value : !loggedIn) {
  router.push('/signin')
}

type UserProfile = {
  id: number
  name: string
  email: string
  avatar: string | null
  biography: string | null
  job: string | null
  location: string | null
  language: string | null
  socials: string | null
  created_at: string
  updated_at: string
}

const { data: profileData, pending, error } = await useFetch<UserProfile>('/api/user/profile', { server: false })
const userProfile = computed(() => {
  const payload = profileData.value as any
  if (payload?.data) return payload.data
  return payload ?? (user.value as any)
})

const form = reactive({
  name: '',
  email: '',
  avatar: '',
  biography: '',
  job: '',
  location: '',
  language: '',
  socials: '' as string | null,
})

const initialForm = ref({} as Record<string, any>)
const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
// Auto-hide timeout for success messages
const successTimeout = ref<number | null>(null)
const avatarFileInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const avatarUploadProgress = ref(0)
const avatarDragOver = ref(false)
  // Preview avatar shown immediately after upload until the session/user data refreshes
  const previewAvatar = ref<string | null>(null)
  // Delete avatar confirmation dialog state & loading indicator
  const deleteAvatarDialogOpen = ref(false)
  const isDeletingAvatar = ref(false)

  function openDeleteAvatarDialog() { deleteAvatarDialogOpen.value = true }

  async function confirmDeleteAvatar() {
    isDeletingAvatar.value = true
    errorMessage.value = ''
    try {
      await deleteAvatar()
      // close dialog on success
      deleteAvatarDialogOpen.value = false
    } catch (e) {
      // deleteAvatar already sets errorMessage
    } finally {
      isDeletingAvatar.value = false
    }
  }

watch(userProfile, (val) => {
  if (!val) return
  form.name = val.name ?? ''
  form.email = val.email ?? ''
  form.avatar = val.avatar ?? ''
  form.biography = val.biography ?? ''
  form.job = val.job ?? ''
  form.location = val.location ?? ''
  form.language = val.language ?? ''
  form.socials = typeof val.socials === 'string' ? val.socials : JSON.stringify(val.socials ?? '')
  initialForm.value = { ...form }
  // Clear preview avatar once the actual user profile has updated
  if (previewAvatar.value !== null) {
    // If the persisted avatar matches the preview, or the preview was set to empty string and the persisted avatar is now absent, clear the preview
    if (val.avatar === previewAvatar.value || (previewAvatar.value === '' && !val.avatar)) {
      previewAvatar.value = null
    }
  }
  // Ensure textarea is sized after we update the form value
  nextTick(() => autoResizeName(nameTextarea.value))
}, { immediate: true })

// If fetching the profile returns a 401 (unauthenticated), redirect to signin
if (error?.value?.statusCode === 401) {
  router.push('/signin')
}

const userInitials = computed(() => {
  const n = userProfile.value?.name ?? ''
  return n ? n.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase() : ''
})

const displayAvatar = computed(() => {
  // Prefer a temporary preview after upload/delete, otherwise use persisted user profile avatar
  if (previewAvatar.value !== null) return previewAvatar.value
  return userProfile.value?.avatar ?? ''
})

const nameTextarea = ref<HTMLTextAreaElement | null>(null)

function autoResizeName(eventOrEl?: Event | HTMLTextAreaElement | null) {
  let t: HTMLTextAreaElement | null = null
  if (!eventOrEl) t = nameTextarea.value
  else if ((eventOrEl as Event).target) t = (eventOrEl as Event).target as HTMLTextAreaElement
  else t = eventOrEl as HTMLTextAreaElement
  if (!t) return
  t.style.height = 'auto'
  t.style.height = `${t.scrollHeight}px`
}

let nameResizeObserver: ResizeObserver | null = null
onMounted(() => {
  // Initial sizing after mount
  nextTick(() => autoResizeName(nameTextarea.value))
  if (nameTextarea.value && typeof ResizeObserver !== 'undefined') {
    nameResizeObserver = new ResizeObserver(() => autoResizeName(nameTextarea.value))
    nameResizeObserver.observe(nameTextarea.value)
  }
  // Global keyboard shortcut: Cmd/Ctrl + Enter to save
  if (import.meta.client) window.addEventListener('keydown', handleGlobalKeydown)
})
onBeforeUnmount(() => {
  nameResizeObserver?.disconnect(); nameResizeObserver = null
  if (import.meta.client) window.removeEventListener('keydown', handleGlobalKeydown)
  if (successTimeout.value) { clearTimeout(successTimeout.value); successTimeout.value = null }
})

const hasChanges = computed(() => {
  return Object.keys(initialForm.value).some((k) => (initialForm.value as any)[k] !== (form as any)[k])
})

function resetForm() {
  Object.assign(form, initialForm.value)
  errorMessage.value = ''
  successMessage.value = ''
}

const triggerAvatarFileInput = () => avatarFileInput.value?.click()

const onAvatarDragOver = () => { avatarDragOver.value = true }
const onAvatarDragLeave = () => { avatarDragOver.value = false }

const onAvatarDrop = async (event: DragEvent) => {
  avatarDragOver.value = false
  const file = event.dataTransfer?.files?.[0]
  if (!file) return
  await uploadAvatarWithUi(file)
}

async function uploadAvatarWithUi(file: File) {
  avatarUploading.value = true
  avatarUploadProgress.value = 0
  errorMessage.value = ''
  try {
    const res: any = await uploadAvatar(file)
    if (res.success && res.image?.src) {
      // show a temporary preview while we refresh the session
      previewAvatar.value = res.image.src
      showSuccess('Avatar updated')
      await refreshSession()
      // Keep preview until userProfile watcher confirms the update
      // The watch on userProfile will clear previewAvatar when val.avatar matches
      initialForm.value = { ...form }
    }
  } catch (e: any) {
    errorMessage.value = e?.message || e?.data?.message || 'Failed to upload avatar'
    console.error('Failed to upload avatar:', e)
  } finally {
    avatarUploading.value = false
    avatarUploadProgress.value = 0
  }
}

const uploadAvatar = (file: File) => {
  return new Promise<any>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `/api/user/avatar`)
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(json)
        } catch (e) {
          reject(e)
        }
      }
    }
    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        avatarUploadProgress.value = Math.round((evt.loaded / evt.total) * 100)
      }
    }
    xhr.onerror = () => reject(new Error('Network error'))
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileName', file.name)
    formData.append('type', file.type)
    xhr.send(formData)
  })
}

const handleAvatarFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input?.files?.length) return
  const file = input.files[0]
  if (!file) return
  await uploadAvatarWithUi(file)
  input.value = ''
}

const deleteAvatar = async () => {
  try {
    const res: any = await $fetch('/api/user/avatar', { method: 'DELETE' })
    if (res.success) {
      // Set preview to empty string to immediately clear the image
      previewAvatar.value = ''
      form.avatar = ''
      showSuccess(res.message || 'Avatar removed')
      await refreshSession()
      // The watch on userProfile will clear previewAvatar when the update is confirmed
      initialForm.value = { ...form }
      return res
    }
    // treat non-success payloads as errors
    const err = new Error(res?.message || 'Failed to remove avatar')
    errorMessage.value = res?.message || 'Failed to remove avatar'
    throw err
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Failed to remove avatar'
    throw e
  }
}

// Socials editor state & helpers
const socialsDialogOpen = ref(false)
const socialsDraft = ref<Array<{ platform: string; url: string }>>([])
const socialsSaving = ref(false)
// Template refs for the dynamically rendered social inputs
const socialPlatformRefs = ref<Array<any>>([])
const socialUrlRefs = ref<Array<any>>([])

const socialsSummary = computed(() => {
  if (!form.socials) return 'No socials'
  try {
    const arr = JSON.parse(form.socials as string)
    if (Array.isArray(arr)) return `${arr.length} social${arr.length === 1 ? '' : 's'}`
  } catch {
    return 'Invalid JSON'
  }
  return 'No socials'
})

function openSocialsDialog() {
  socialsDraft.value = []
  if (form.socials && form.socials.trim().length) {
    try {
      const parsed = JSON.parse(form.socials as string)
      if (Array.isArray(parsed)) socialsDraft.value = parsed.map((p: any) => ({ platform: p.platform || '', url: p.url || '' }))
    } catch (e) {
      // invalid JSON — start with empty list
      socialsDraft.value = []
    }
  }
  socialsDialogOpen.value = true
}

function closeSocialsDialog() {
  socialsDialogOpen.value = false
}

async function saveSocialsDialog() {
  // prism: convert empty entries
  const sanitized = socialsDraft.value.filter((s) => (s.platform && s.platform.trim()) || (s.url && s.url.trim()))
  form.socials = sanitized.length ? JSON.stringify(sanitized) : ''

  // Persist immediately since user confirmed in the dialog
  socialsSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const payload: any = { socials: form.socials }
    const res: any = await $fetch('/api/user/profile', { method: 'PUT', body: payload })
    showSuccess(res?.message || 'Socials updated')
    // Refresh session/profile data
    await refreshSession()
    initialForm.value = { ...form }
    socialsDialogOpen.value = false
  } catch (e: any) {
    errorMessage.value = e?.statusMessage || e?.data?.message || 'Failed to update socials'
    // keep dialog open so user can retry
  } finally {
    socialsSaving.value = false
  }
}

function addSocialRow() {
  socialsDraft.value.push({ platform: '', url: '' })
  // Focus the newly added platform input after it's rendered
  nextTick(() => {
    const last = socialPlatformRefs.value[socialPlatformRefs.value.length - 1]
    const wrapperEl: HTMLElement | null = (last as any)?.$el ?? last
    const inputEl: HTMLInputElement | null = wrapperEl?.querySelector('input') ?? (wrapperEl as HTMLInputElement | null)
    inputEl?.focus()
  })
}

function removeSocialRow(i: number) { socialsDraft.value.splice(i, 1) }

function platformIcon(platform?: string) {
  if (!platform) return 'i-lucide-link'
  let p = platform.toLowerCase().trim()
  // If user pasted a URL, try to infer by hostname
  if (p.startsWith('http')) {
    try {
      const h = new URL(p).hostname
      p = h.replace(/^www\./, '')
    } catch (_) {}
  }
  if (p.includes('twitter') || p === 'x' || p.includes('x.com')) return 'i-lucide-twitter'
  if (p.includes('github')) return 'i-lucide-github'
  if (p.includes('linkedin')) return 'i-lucide-linkedin'
  if (p.includes('instagram')) return 'i-lucide-instagram'
  if (p.includes('facebook')) return 'i-lucide-facebook'
  if (p.includes('tiktok')) return 'i-lucide-music'
  if (p.includes('youtube') || p.includes('youtu.be')) return 'i-lucide-youtube'
  if (p.includes('website') || p.includes('site') || p.includes('blog') || p.includes('homepage')) return 'i-lucide-globe'
  return 'i-lucide-link'
}

function validateForm() {
  errorMessage.value = ''
  // Simple validation: name required
  if (!form.name || !form.name.trim()) {
    errorMessage.value = 'Name is required'
    return false
  }
  if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    errorMessage.value = 'Enter a valid email address'
    return false
  }
  if (form.socials && form.socials.trim().length) {
    try { JSON.parse(form.socials) } catch { errorMessage.value = 'Socials must be valid JSON'; return false }
  }
  return true
}

async function onSubmit() {
  if (!validateForm()) return
  isSaving.value = true
  errorMessage.value = ''
  successMessage.value = ''

  const payload: any = {}
  for (const key of Object.keys(initialForm.value)) {
    if ((initialForm.value as any)[key] !== (form as any)[key]) {
      payload[key] = (form as any)[key]
    }
  }

  try {
    const res: any = await $fetch('/api/user/profile', { method: 'PUT', body: payload })
    showSuccess(res?.message || 'Profile updated successfully')
    // refresh session data if available
    await refreshSession()
    initialForm.value = { ...form }
  } catch (e: any) {
    errorMessage.value = e?.statusMessage || e?.data?.message || 'Failed to update profile'
  } finally {
    isSaving.value = false
  }
}

// Helper: show a success message and auto-clear it after a timeout
function showSuccess(msg: string, ms = 5000) {
  // clear any previous timeout
  if (successTimeout.value) { clearTimeout(successTimeout.value); successTimeout.value = null }
  successMessage.value = msg
  if (import.meta.client) {
    successTimeout.value = window.setTimeout(() => {
      successMessage.value = ''
      successTimeout.value = null
    }, ms)
  }
}

// Global keyboard handler (Cmd/Ctrl + Enter triggers save)
function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    // avoid re-triggering while saving
    if (isSaving.value) return
    e.preventDefault()
    onSubmit()
  }
}
</script>

<style scoped></style>
