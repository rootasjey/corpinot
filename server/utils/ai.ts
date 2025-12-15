import { z } from 'zod'
import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'

export const aiRequestSchema = z.object({
  action: z.enum(['fix', 'shorten', 'continue', 'translate', 'summarize', 'ask']),
  content: z.string().min(1),
  language: z.string().optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  postIdentifier: z.string().optional(),
  targetLanguage: z.string().optional(),
  sourceLanguage: z.string().optional(),
}).superRefine((val, ctx) => {
  if (val.action === 'translate' && !val.targetLanguage) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'targetLanguage is required for translation',
      path: ['targetLanguage'],
    })
  }
})

export type AIRequest = z.infer<typeof aiRequestSchema>

export function getCFClient(accountId: string, apiKey: string) {
  return createWorkersAI({ accountId, apiKey })
}

export function getPrompt(req: AIRequest) {
  if (req.action === 'translate') {
    const src = req.sourceLanguage || req.language || 'en'
    const target = req.targetLanguage || 'en'
    return `Translate the following text from ${src} to ${target}. Preserve meaning, tone, and any inline formatting. Return only the translated text.\n\nText:\n${req.content}`
  }
  if (req.action === 'fix') {
    return `Fix grammar, spelling, and punctuation without changing meaning. Keep tone and formatting. Return only corrected text.\n\nText:\n${req.content}`
  }
  if (req.action === 'shorten') {
    const target = req.length === 'short' ? '80-120' : req.length === 'medium' ? '150-250' : '300-450'
    return `Shorten the text while preserving core meaning and readability. Aim for ${target} words. Keep the author's voice.\n\nText:\n${req.content}`
  }
  if (req.action === 'summarize') {
    const target = req.length === 'short' ? '2-3 sentences' : req.length === 'medium' ? '4-6 sentences' : '8-10 sentences'
    return `Summarize the text into ${target}, preserving key facts, numbers, and names. Return only the summary.\n\nText:\n${req.content}`
  }
  if (req.action === 'ask') {
    const target = req.length === 'short' ? '80-120' : req.length === 'medium' ? '150-250' : '300-450'
    return `Respond to the instruction below. Provide a clear, helpful answer suitable for a blog draft. Aim for ${target} words and avoid filler.\n\nInstruction:\n${req.content}`
  }
  // continue
  const target2 = req.length === 'short' ? '120-180' : req.length === 'medium' ? '250-400' : '500-700'
  return `Continue the following text in the same voice and structure. Add about ${target2} words and finish any incomplete sentences. Avoid introducing new topics.\n\nText:\n${req.content}`
}

export async function translateWithWorkersAI(
  accountId: string,
  apiKey: string,
  input: { text: string; targetLanguage: string; sourceLanguage?: string; signal?: AbortSignal },
) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/m2m100-1.2b`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: input.text,
      target_lang: input.targetLanguage,
      ...(input.sourceLanguage ? { source_lang: input.sourceLanguage } : {}),
    }),
    signal: input.signal,
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Workers AI translate failed: ${res.status} ${res.statusText} ${msg}`)
  }

  const json = await res.json().catch(() => null)
  const translated = json?.result?.translated_text
  if (!translated || typeof translated !== 'string') {
    throw new Error('Workers AI translate returned an empty response')
  }

  return translated as string
}

export function getSummaryMaxLength(length?: AIRequest['length']) {
  if (length === 'short') return 200
  if (length === 'long') return 520
  return 320
}

export async function summarizeWithWorkersAI(
  accountId: string,
  apiKey: string,
  input: { text: string; length?: AIRequest['length']; signal?: AbortSignal },
) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/facebook/bart-large-cnn`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_text: input.text,
      max_length: getSummaryMaxLength(input.length),
    }),
    signal: input.signal,
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`Workers AI summarize failed: ${res.status} ${res.statusText} ${msg}`)
  }

  const json = await res.json().catch(() => null)
  const summary = json?.result?.summary
  if (!summary || typeof summary !== 'string') {
    throw new Error('Workers AI summarize returned an empty response')
  }

  return summary as string
}

export function toSSEStreamFromText(text: string) {
  const enc = new TextEncoder()
  const normalized = (text || '').replace(/\r\n/g, '\n')
  return new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(':ok\n\n'))
      // Ensure any embedded newlines are preserved while keeping a single SSE data event
      const payload = normalized.replace(/\n/g, '\ndata: ')
      controller.enqueue(enc.encode(`data: ${payload}\n\n`))
      controller.enqueue(enc.encode('event: end\n\n'))
      controller.close()
    }
  })
}

export async function streamAI(
  accountId: string,
  apiKey: string,
  model: string,
  prompt: string,
  signal?: AbortSignal,
) {
  const provider = getCFClient(accountId, apiKey)
  const result = streamText({
    model: provider(model, { safePrompt: true }),
    prompt,
    maxOutputTokens: 1200,
    temperature: 0.2,
    abortSignal: signal,
  })

  return result
}
