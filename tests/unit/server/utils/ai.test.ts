import { describe, expect, it, vi, beforeEach } from 'vitest'
import { resolveModel, getPrompt, getSummaryMaxLength, aiRequestSchema, toSSEStreamFromText, translateWithWorkersAI, summarizeWithWorkersAI } from '../../../../server/utils/ai'
import type { AIRequest } from '../../../../server/utils/ai'

describe('resolveModel', () => {
  it('returns requested model when provided', () => {
    expect(resolveModel('cloudflare', 'my-model')).toBe('my-model')
  })

  it('returns default cloudflare model when no model requested', () => {
    expect(resolveModel('cloudflare')).toBe('@cf/meta/llama-2-7b-chat-int8')
  })

  it('returns default openrouter model when no model requested', () => {
    expect(resolveModel('openrouter')).toBe('mistralai/devstral-2512:free')
  })

  it('ignores whitespace-only model string', () => {
    expect(resolveModel('cloudflare', '   ')).toBe('@cf/meta/llama-2-7b-chat-int8')
  })
})

describe('getPrompt', () => {
  const base: AIRequest = { action: 'fix', content: 'Hello world' }

  it('builds fix prompt', () => {
    const prompt = getPrompt(base)
    expect(prompt).toContain('Fix grammar')
    expect(prompt).toContain('Hello world')
  })

  it('builds shorten prompt with length target', () => {
    const prompt = getPrompt({ ...base, action: 'shorten', length: 'short' })
    expect(prompt).toContain('80-120')
    expect(prompt).toContain('Shorten')
  })

  it('builds summarize prompt', () => {
    const prompt = getPrompt({ ...base, action: 'summarize', length: 'long' })
    expect(prompt).toContain('8-10 sentences')
  })

  it('builds ask prompt', () => {
    const prompt = getPrompt({ ...base, action: 'ask' })
    expect(prompt).toContain('Respond to the instruction')
  })

  it('builds translate prompt', () => {
    const prompt = getPrompt({ ...base, action: 'translate', targetLanguage: 'fr', sourceLanguage: 'en' })
    expect(prompt).toContain('Translate')
    expect(prompt).toContain('en to fr')
  })

  it('defaults to continue action', () => {
    const prompt = getPrompt({ ...base, action: 'continue' })
    expect(prompt).toContain('Continue')
  })
})

describe('getSummaryMaxLength', () => {
  it('returns 200 for short', () => expect(getSummaryMaxLength('short')).toBe(200))
  it('returns 520 for long', () => expect(getSummaryMaxLength('long')).toBe(520))
  it('returns 320 for medium', () => expect(getSummaryMaxLength('medium')).toBe(320))
  it('returns 320 for undefined', () => expect(getSummaryMaxLength()).toBe(320))
})

describe('aiRequestSchema', () => {
  it('validates a valid request', () => {
    const result = aiRequestSchema.safeParse({ action: 'fix', content: 'hello' })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    const result = aiRequestSchema.safeParse({ action: 'fix', content: '' })
    expect(result.success).toBe(false)
  })

  it('rejects unknown action', () => {
    const result = aiRequestSchema.safeParse({ action: 'unknown', content: 'hello' })
    expect(result.success).toBe(false)
  })

  it('requires targetLanguage for translate action', () => {
    const result = aiRequestSchema.safeParse({ action: 'translate', content: 'hello' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('targetLanguage')
    }
  })

  it('accepts translate with targetLanguage', () => {
    const result = aiRequestSchema.safeParse({ action: 'translate', content: 'hello', targetLanguage: 'fr' })
    expect(result.success).toBe(true)
  })
})

describe('toSSEStreamFromText', () => {
  it('produces SSE events from text', async () => {
    const stream = toSSEStreamFromText('Hello world')
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    const chunks: string[] = []

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(decoder.decode(value, { stream: true }))
    }

    const output = chunks.join('')
    expect(output).toContain(':ok')
    expect(output).toContain('data: Hello world')
    expect(output).toContain('event: end')
  })

  it('handles multiline text', async () => {
    const stream = toSSEStreamFromText('line1\nline2')
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let output = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      output += decoder.decode(value, { stream: true })
    }

    expect(output).toContain('data: line1')
    expect(output).toContain('data: line2')
  })

  it('handles empty text', async () => {
    const stream = toSSEStreamFromText('')
    const reader = stream.getReader()
    const decoder = new TextDecoder()
    let output = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      output += decoder.decode(value, { stream: true })
    }

    expect(output).toContain(':ok')
    expect(output).toContain('event: end')
  })
})

describe('translateWithWorkersAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls Workers AI API and returns translated text', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ result: { translated_text: 'Bonjour le monde' } }), { status: 200 })
    )

    const result = await translateWithWorkersAI('account-id', 'api-key', {
      text: 'Hello world',
      targetLanguage: 'fr',
    })

    expect(result).toBe('Bonjour le monde')
  })

  it('throws on API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 401, statusText: 'Unauthorized' })
    )

    await expect(
      translateWithWorkersAI('account-id', 'api-key', { text: 'Hello', targetLanguage: 'fr' })
    ).rejects.toThrow('Workers AI translate failed')
  })

  it('throws on empty response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ result: {} }), { status: 200 })
    )

    await expect(
      translateWithWorkersAI('account-id', 'api-key', { text: 'Hello', targetLanguage: 'fr' })
    ).rejects.toThrow('empty response')
  })
})

describe('summarizeWithWorkersAI', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls Workers AI API and returns summary', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ result: { summary: 'A short summary.' } }), { status: 200 })
    )

    const result = await summarizeWithWorkersAI('account-id', 'api-key', { text: 'Long text to summarize' })
    expect(result).toBe('A short summary.')
  })

  it('throws on API error', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 500 })
    )

    await expect(
      summarizeWithWorkersAI('account-id', 'api-key', { text: 'Hello' })
    ).rejects.toThrow('Workers AI summarize failed')
  })
})
