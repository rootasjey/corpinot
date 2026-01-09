export async function generatePosterFromVideoFile(file: File, seekTime = 0.5): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file)
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      video.src = url

      const cleanup = () => {
        try { URL.revokeObjectURL(url) } catch (_) {}
        if (video) {
          video.pause()
          video.removeAttribute('src')
          video.load()
        }
      }

      const onLoaded = () => {
        // Seek to a time a bit into the video (bounded by duration)
        const target = Math.min(seekTime, Math.max(0, (video.duration || 0) / 2))
        const onSeeked = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 360
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              cleanup()
              resolve(null)
              return
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              cleanup()
              resolve(blob)
            }, 'image/png')
          } catch (err) {
            cleanup()
            resolve(null)
          }
        }
        // If seeking is not supported or duration is 0, try to draw immediately
        try {
          video.currentTime = target
          video.addEventListener('seeked', onSeeked, { once: true })
        } catch (e) {
          // Fallback: draw a frame immediately
          try {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth || 640
            canvas.height = video.videoHeight || 360
            const ctx = canvas.getContext('2d')
            if (!ctx) {
              cleanup()
              resolve(null)
              return
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              cleanup()
              resolve(blob)
            }, 'image/png')
          } catch (_) {
            cleanup()
            resolve(null)
          }
        }
      }

      video.addEventListener('loadedmetadata', onLoaded, { once: true })
      // If metadata fails to load, give up after a timeout
      const timeout = setTimeout(() => {
        cleanup()
        resolve(null)
      }, 5000)

      video.addEventListener('error', () => {
        clearTimeout(timeout)
        cleanup()
        resolve(null)
      }, { once: true })
    } catch (err) {
      resolve(null)
    }
  })
}
