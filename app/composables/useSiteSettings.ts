import { ref, computed } from 'vue'

export type SocialLink = {
  platform: string
  url: string
  label?: string
  order?: number
  enabled?: boolean
}

type SiteSettingsState = {
  socials: SocialLink[]
}

export default function useSiteSettings() {
  const state = useState<SiteSettingsState>('site-settings', () => ({ socials: [] }))
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSettings() {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<SiteSettingsState>('/api/site-settings')
      state.value.socials = res.socials || []
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Failed to load site settings'
    } finally {
      loading.value = false
    }
  }

  async function updateSocials(socials: SocialLink[]) {
    loading.value = true
    error.value = null
    try {
      await $fetch('/api/admin/site-settings', {
        method: 'PUT',
        body: { socials },
      })
      state.value.socials = socials
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Failed to update site settings'
      throw e
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client && !state.value.socials.length) {
    // Fire-and-forget initial fetch on client side
    fetchSettings()
  }

  const socials = computed(() => state.value.socials)

  return {
    settings: state,
    socials,
    loading,
    error,
    fetchSettings,
    refresh: fetchSettings,
    updateSocials,
  }
}
