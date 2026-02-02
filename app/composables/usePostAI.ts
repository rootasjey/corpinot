import { nextTick, ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { AIAction, AICommand, AILength } from '~/composables/useAIWriter'

export type NormalizedAICommand = { action: AIAction; targetLanguage?: string; sourceLanguage?: string; prompt?: string }

type AISession = {
  action: AIAction
  from: number
  to: number
  insertionFrom: number
  hasSelection: boolean
  originalDoc: any
  originalSelection: { from: number; to: number }
  currentText: string
  targetLanguage?: string
  sourceLanguage?: string
  prompt?: string
}

interface UsePostAIOptions {
  editor: Ref<any | null>
  identifier: ComputedRef<string>
  aiEnabled: ComputedRef<boolean>
  aiLength: Ref<AILength>
  sourceLanguage: ComputedRef<string>
  aiProvider: Ref<'cloudflare' | 'openrouter'>
  getModelForAction?: (action: AIAction, providerForAction: 'cloudflare' | 'openrouter') => string | undefined
  streamSuggestion: (input: {
    action: AIAction
    content: string
    length?: AILength
    postIdentifier: string
    targetLanguage?: string
    sourceLanguage?: string
    provider?: 'cloudflare' | 'openrouter'
    model?: string
  }) => AsyncIterable<{ text: string }> | Promise<AsyncIterable<{ text: string }>>
  cancelStream: () => void
  articleContent: Ref<object>
  onAutosave?: (content: object) => void
}

function normalizeAiCommand(command: AICommand): NormalizedAICommand {
  if (typeof command === 'string') return { action: command }
  if (command.action === 'ask' && 'prompt' in command) return { action: 'ask', prompt: command.prompt }
  return {
    action: command.action,
    targetLanguage: (command as { targetLanguage?: string }).targetLanguage,
    sourceLanguage: (command as { sourceLanguage?: string }).sourceLanguage,
  }
}

export function usePostAI(options: UsePostAIOptions) {
  const aiLoading = ref(false)
  const aiError = ref('')
  const aiSession = ref<AISession | null>(null)
  const aiStatus = ref<'idle' | 'streaming' | 'ready'>('idle')

  const startAI = async (command: AICommand) => {
    const payload = normalizeAiCommand(command)
    const normalizedSource = payload.sourceLanguage || options.sourceLanguage.value
    if (!options.aiEnabled.value || !options.editor.value) return

    if (payload.action === 'ask') {
      const prompt = payload.prompt?.trim() || ''
      if (!prompt) {
        aiError.value = 'Add a question before asking the AI.'
        aiStatus.value = 'idle'
        return
      }
      payload.prompt = prompt
    }

    await runAI({ ...payload, sourceLanguage: normalizedSource })
  }

  const runAI = async (payload: NormalizedAICommand) => {
    if (!options.aiEnabled.value || !options.editor.value) return
    if (aiLoading.value) await cancelAI()

    const action = payload.action
    const ed = options.editor.value
    const sel = ed.state.selection
    const hasSelection = sel && !sel.empty
    const isAsk = action === 'ask'
    const from = hasSelection ? sel.from : 0
    const to = hasSelection ? sel.to : ed.state.doc.content.size
    const insertionFrom = (action === 'continue' || isAsk) ? (sel?.to ?? ed.state.doc.content.size) : from
    const content = isAsk
      ? payload.prompt || ''
      : hasSelection
        ? ed.state.doc.textBetween(from, to, '', '\n')
        : ed.getText()

    if (isAsk && !content.trim()) {
      aiError.value = 'Add a question before asking the AI.'
      aiSession.value = null
      aiStatus.value = 'idle'
      aiLoading.value = false
      return
    }

    if (action === 'summarize' && !hasSelection) {
      aiError.value = 'Select text to summarize.'
      aiSession.value = null
      aiStatus.value = 'idle'
      return
    }

    aiError.value = ''
    aiLoading.value = true
    aiStatus.value = 'streaming'
    aiSession.value = {
      action,
      from,
      to,
      insertionFrom,
      hasSelection: !!hasSelection,
      originalDoc: ed.getJSON(),
      originalSelection: { from, to },
      currentText: '',
      targetLanguage: payload.targetLanguage,
      sourceLanguage: payload.sourceLanguage,
      prompt: payload.prompt,
    }

    if (action !== 'continue' && action !== 'ask' && to > from) {
      ed.chain().focus().deleteRange({ from, to }).run()
    }

    try {
      const providerForAction = (action === 'translate' || action === 'summarize')
        ? 'cloudflare'
        : options.aiProvider.value

      const iterator = await options.streamSuggestion({
        action,
        content,
        length: action === 'translate' ? undefined : options.aiLength.value,
        postIdentifier: options.identifier.value,
        targetLanguage: payload.targetLanguage,
        sourceLanguage: payload.sourceLanguage,
        provider: providerForAction,
        model: options.getModelForAction?.(action, providerForAction),
      })

      // Helper: strip common model-added prefixes so the editor receives
      // only the rewritten content (e.g. "Here's a shortened version...").
      const stripLeadingAiPrefix = (text: string, actionType: AIAction) => {
        if (!text) return text
        // Only sanitize shorten/summarize actions for now
        if (actionType !== 'shorten' && actionType !== 'summarize') return text

        // Common model prefixes to remove (case-insensitive).
        // Examples matched: "Here's a shortened version of the text, ...:", "Shortened version:", "Summary:"
        const re = /^\s*(?:(?:Here(?:'|’)s|Here is)(?: a)?\s+(?:shortened|shorter|short)(?:\s+version(?: of the text)?)?|Shortened version(?: of the text)?|Summary)(?:[:\-\.\,\s]*)/i
        return text.replace(re, '').replace(/^\s+/, '')
      }

      for await (const { text } of iterator) {
        const sanitized = stripLeadingAiPrefix(text, action)
        applyAiDraft(sanitized)
      }

      aiStatus.value = 'ready'
    } catch (err: any) {
      aiError.value = err?.message || 'AI request failed'
      await revertAI()
    } finally {
      aiLoading.value = false
    }
  }

  const applyAiDraft = (text: string) => {
    const session = aiSession.value
    if (!session || !options.editor.value) return

    const ed = options.editor.value
    const from = session.insertionFrom
    const to = session.insertionFrom + session.currentText.length
    session.currentText = text

    ed.chain().focus().insertContentAt({ from, to }, text).setTextSelection(from + text.length).run()
    session.to = from + text.length
  }

  const revertAI = async () => {
    if (!aiSession.value || !options.editor.value) return
    const snapshot = aiSession.value
    options.editor.value.commands.setContent(snapshot.originalDoc)
    options.editor.value.commands.focus()
    const { from, to } = snapshot.originalSelection
    options.editor.value.commands.setTextSelection({ from, to })
    options.articleContent.value = snapshot.originalDoc
    aiSession.value = null
    aiStatus.value = 'idle'
    aiLoading.value = false
    await nextTick()
  }

  const commitAiDraft = () => {
    aiSession.value = null
    aiStatus.value = 'idle'
    aiError.value = ''
    if (options.articleContent.value) {
      options.onAutosave?.(options.articleContent.value)
    }
  }

  const retryAI = async () => {
    const snapshot = aiSession.value
    if (!snapshot) return
    await revertAI()
    await nextTick()
    if (options.editor.value) {
      options.editor.value.commands.setTextSelection({ from: snapshot.originalSelection.from, to: snapshot.originalSelection.to })
    }

    const aiCommand: AICommand = snapshot.action === 'ask'
      ? { action: 'ask', prompt: snapshot.prompt ?? '' }
      : snapshot.action

    startAI(aiCommand)
  }

  const cancelAI = async () => {
    options.cancelStream()
    if (!aiSession.value) {
      aiLoading.value = false
      aiStatus.value = 'idle'
      return
    }
    await revertAI()
  }

  return {
    aiLoading,
    aiError,
    aiSession,
    aiStatus,
    startAI,
    runAI,
    revertAI,
    commitAiDraft,
    retryAI,
    cancelAI,
  }
}
