import { ref } from 'vue'
import type { UploadingItem } from '~~/shared/types/uploading'

const uploadingAudios = ref<UploadingItem[]>([])
const uploadRequests = new Map<string, XMLHttpRequest>()

function addUploading(name: string) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  uploadingAudios.value.push({ id, name, progress: 0 })
  return id
}

function updateUploading(id: string, progress: number) {
  const idx = uploadingAudios.value.findIndex(u => u.id === id)
  if (idx >= 0) {
    const item = uploadingAudios.value[idx]
    if (item) item.progress = progress
  }
}

function removeUploading(id: string) {
  uploadingAudios.value = uploadingAudios.value.filter(u => u.id !== id)
}

function uploadAudioWithProgress(identifier: string, file: File, onProgress: (p: number) => void, id?: string) {
  return new Promise<any>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      const url = `/api/posts/${encodeURIComponent(identifier)}/audios`
      xhr.open('POST', url)

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          const percent = Math.round((evt.loaded / evt.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        if (id) uploadRequests.delete(id)
        try {
          const json = JSON.parse(xhr.responseText || '{}')
          if (xhr.status >= 200 && xhr.status < 300) resolve(json)
          else reject(json)
        } catch (e) {
          reject(e)
        }
      }

      xhr.onerror = () => {
        if (id) uploadRequests.delete(id)
        reject(new Error('Network error'))
      }

      xhr.onabort = () => {
        if (id) uploadRequests.delete(id)
        reject({ aborted: true })
      }

      const form = new FormData()
      form.append('file', file)
      form.append('fileName', file.name)
      form.append('type', file.type)
      if (id) uploadRequests.set(id, xhr)

      xhr.send(form)
    } catch (err) {
      reject(err)
    }
  })
}

function cancelUpload(id: string) {
  const req = uploadRequests.get(id)
  if (req) {
    try { req.abort() } catch (_) { /* ignore */ }
    uploadRequests.delete(id)
  }
  removeUploading(id)
}

export function useEditorAudio() {
  return {
    uploadingAudios,
    addUploading,
    updateUploading,
    removeUploading,
    uploadAudioWithProgress,
    cancelUpload,
  }
}
