import { ref, onUnmounted } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'

export function usePostImages(identifier: () => string | number, post: () => Post | null) {
  const { uploadCoverFile, deleteCover } = usePostsApi()

  const fileInput = ref<HTMLInputElement | null>(null)
  const uploadingCover = ref(false)
  const uploadProgress = ref(0)

  // Transient preview URL for optimistic preview before server responds
  const previewSrc = ref<string | null>(null)

  const revokePreview = () => {
    if (previewSrc.value) {
      try {
        URL.revokeObjectURL(previewSrc.value)
      } catch (e) {
        // ignore
      }
      previewSrc.value = null
    }
  }

  // Ensure preview URL is revoked if the composable is destroyed
  onUnmounted(() => {
    revokePreview()
  })

  const triggerFileInput = () => fileInput.value?.click()

  const handleFileChange = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !post()) return

    // Create an object URL for immediate preview (optimistic)
    revokePreview()
    previewSrc.value = URL.createObjectURL(file)

    uploadingCover.value = true
    uploadProgress.value = 0

    try {
      const res = await uploadCoverFile(String(identifier()), file, (p) => (uploadProgress.value = p))
      if (res?.success && res.image) {
        const current = post()
        if (current) {
          if (!current.image) current.image = { alt: '', ext: '', src: '' }
          current.image.src = res.image.src ?? ''
          current.image.alt = res.image.alt ?? ''
        }
      }

      // On success, revoke local preview (server image will be used)
      revokePreview()
    } catch (e) {
      // On failure, revoke preview and rethrow so caller can show an error
      revokePreview()
      throw e
    } finally {
      uploadingCover.value = false
      input.value = ''
      setTimeout(() => (uploadProgress.value = 0), 800)
    }
  }

  const deleteCoverImage = async (): Promise<void> => {
    const current = post()
    if (!current?.image?.src) return
    await deleteCover(String(identifier()))
    if (current.image) {
      current.image.src = ''
      current.image.alt = ''
    }
  }

  const clearPreview = () => revokePreview()

  return {
    fileInput,
    uploadingCover,
    uploadProgress,
    previewSrc,
    clearPreview,
    triggerFileInput,
    handleFileChange,
    deleteCoverImage,
  }
}
