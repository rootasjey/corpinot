import { useRuntimeConfig } from '#app'
import { ref } from 'vue'

export type AIAction = 'fix' | 'shorten' | 'continue' | 'translate' | 'summarize' | 'ask'
export type AICommand =
  | Exclude<AIAction, 'ask'>
  | { action: Exclude<AIAction, 'ask'>; targetLanguage?: string; sourceLanguage?: string }
  | { action: 'ask'; prompt: string }
export type AILength = 'short' | 'medium' | 'long'

export function useAIWriter() {
  const controller = ref<AbortController | null>(null)

  const nextController = () => {
    controller.value?.abort()
    controller.value = new AbortController()
    return controller.value
  }

  async function streamSuggestion(params: {
    action: AIAction
    content: string
    length?: AILength
    language?: string
    targetLanguage?: string
    sourceLanguage?: string
    postIdentifier?: string
  }) {
    // Use POST and parse SSE-style stream from the response body
    const ctrl = nextController()
    const body = {
      action: params.action,
      content: params.content,
      ...(params.length ? { length: params.length } : {}),
      ...(params.language ? { language: params.language } : {}),
      ...(params.targetLanguage ? { targetLanguage: params.targetLanguage } : {}),
      ...(params.sourceLanguage ? { sourceLanguage: params.sourceLanguage } : {}),
      ...(params.postIdentifier ? { postIdentifier: params.postIdentifier } : {}),
    }

    const res = await fetch('/api/ai/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })

    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      throw new Error(`AI request failed: ${res.status} ${res.statusText} ${txt}`)
    }

    // If there's no body to stream, return the full text
    if (!res.body) {
      const txt = await res.text()
      async function *iter() { yield { chunk: txt, text: txt }; return txt }
      return iter()
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let finished = false
    const queue: { chunk: string; text: string }[] = []
    let fullText = ''

    const push = (chunk: string) => {
      fullText += chunk
      queue.push({ chunk, text: fullText })
    }

    ;(async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          // Parse SSE style events separated by double-newline
          let idx
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, idx)
            buffer = buffer.slice(idx + 2)
            const lines = raw.split(/\r?\n/)
            let data = ''
            let ev: string | null = null
            for (const line of lines) {
              if (line.startsWith('data:')) {
                // Preserve spaces inside the chunk; SSE lines are prefixed with `data:` optionally followed by a space.
                const payload = line.slice(5)
                data += payload.startsWith(' ') ? payload.slice(1) : payload
              }
              else if (line.startsWith('event:')) ev = line.slice(6).trim()
            }
            if (data) push(data)
            if (ev === 'end') { finished = true; break }
            if (ev === 'error') { finished = true; break }
          }
        }
        // flush remainder
        if (buffer.length) {
          const lines = buffer.split(/\r?\n/)
          let data = ''
          let ev: string | null = null
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const payload = line.slice(5)
              data += payload.startsWith(' ') ? payload.slice(1) : payload
            }
            else if (line.startsWith('event:')) ev = line.slice(6).trim()
          }
          if (data) push(data)
          if (ev === 'end') finished = true
        }
      } catch (err) {
        finished = true
      } finally {
        try { reader.releaseLock?.() } catch {}
      }
    })()

    async function *iterator() {
      while (!finished || queue.length > 0) {
        const item = queue.shift()
        if (item) yield item
        else await new Promise(r => setTimeout(r, 20))
      }
      return fullText
    }

    return iterator()
  }

  function cancel() {
    controller.value?.abort()
  }

  return { streamSuggestion, cancel }
}
