import { ref } from 'vue'
import type { Post } from '~~/shared/types/post'
import { usePostsApi } from '~/composables/usePostsApi'

export function usePostImages(identifier: () => string | number, post: () => Post | null) {
  const { uploadCoverFile, deleteCover } = usePostsApi()

  const fileInput = ref<HTMLInputElement | null>(null)
  const uploadingCover = ref(false)
  const uploadProgress = ref(0)

  const triggerFileInput = () => fileInput.value?.click()

  const handleFileChange = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !post()) return

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

  return {
    fileInput,
    uploadingCover,
    uploadProgress,
    triggerFileInput,
    handleFileChange,
    deleteCoverImage,
  }
}
