import { aiRequestSchema, getPrompt, streamAI, summarizeWithWorkersAI, toSSEStreamFromText, translateWithWorkersAI } from "~~/server/utils/ai"
import { defineEventHandler } from "h3"
import { db, schema } from 'hub:db'
import { getPostByIdentifier } from "~~/server/utils/post"

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const body = await readBody(event)
  const apiKey = config.ai?.cloudflareKey
  const accountId = config.ai?.cloudflareAccountId

  const parsed = aiRequestSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid input', data: parsed.error.flatten() })
  }

  const session = await requireUserSession(event)

  if (!apiKey || !accountId) {
    throw createError({ statusCode: 500, statusMessage: 'AI not configured' })
  }

  const req = parsed.data

  let postId: number | null = null
  if (req.postIdentifier) {
    const found = await getPostByIdentifier(db, req.postIdentifier)
    if (!found) {
      throw createError({ statusCode: 404, statusMessage: 'Post not found' })
    }
    if (found.user_id !== session.user.id) {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
    postId = found.id
  }

  if (req.action === 'translate') {
    const abort = new AbortController()
    let translated = ''
    try {
      translated = await translateWithWorkersAI(accountId, apiKey, {
        text: req.content,
        targetLanguage: req.targetLanguage!,
        sourceLanguage: req.sourceLanguage || req.language,
        signal: abort.signal,
      })
    } catch (err: any) {
      console.error('[ai/translate] translate failed', err)
      throw createError({ statusCode: 502, statusMessage: 'AI translation error' })
    }

    ;(async () => {
      try {
        await db.insert(schema.ai_requests).values({
          user_id: session.user.id,
          post_id: postId,
          action: req.action,
          created_at: new Date().toISOString(),
        }).run()
      } catch {}
    })()

    const sse = toSSEStreamFromText(translated)
    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    })
  }

  if (req.action === 'summarize') {
    const abort = new AbortController()
    let summary = ''
    try {
      summary = await summarizeWithWorkersAI(accountId, apiKey, {
        text: req.content,
        length: req.length,
        signal: abort.signal,
      })
    } catch (err: any) {
      console.error('[ai/summarize] summarize failed', err)
      throw createError({ statusCode: 502, statusMessage: 'AI summarization error' })
    }

    ;(async () => {
      try {
        await db.insert(schema.ai_requests).values({
          user_id: session.user.id,
          post_id: postId,
          action: req.action,
          created_at: new Date().toISOString(),
        }).run()
      } catch {}
    })()

    const sse = toSSEStreamFromText(summary)
    return new Response(sse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      }
    })
  }

  const prompt = getPrompt(req)

  // model per user request
  const model = "@cf/meta/llama-2-7b-chat-int8"

  // Streaming response
  const abort = new AbortController()
  let streamResp
  try {
    streamResp = await streamAI(accountId, apiKey, model, prompt, abort.signal)
  } catch (err: any) {
    console.error('[ai/write] AI stream failed', err)
    throw createError({ statusCode: 502, statusMessage: 'AI provider error' })
  }

  // Fire-and-forget logging stub
  ;(async () => {
    try {
      await db.insert(schema.ai_requests).values({
        user_id: session.user.id,
        post_id: postId,
        action: req.action,
        created_at: new Date().toISOString(),
      }).run()
    } catch {}
  })()

  // Stream via textStream (web ReadableStream) -> Node Readable -> sendStream
  const textStream: ReadableStream<any> | undefined = (streamResp as any)?.textStream
    if (textStream && typeof textStream.getReader === 'function') {
      const sse = new ReadableStream({
        async start(controller) {
          const reader = textStream.getReader()
          const decoder = new TextDecoder()
          const enc = new TextEncoder()
          try {
            // Initial SSE headers comment to open stream
            controller.enqueue(enc.encode(':ok\n\n'))
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              const chunk = typeof value === 'string' ? value : decoder.decode(value, { stream: true })
              if (chunk && chunk.length) {
                // Emit SSE data event
                controller.enqueue(enc.encode(`data: ${chunk}\n\n`))
              }
            }
            // End event
            controller.enqueue(enc.encode('event: end\n\n'))
          } catch (err) {
            console.error('[ai/write] SSE textStream error', err)
            controller.enqueue(enc.encode(`event: error\ndata: ${String(err)}\n\n`))
          } finally {
            try { reader.releaseLock?.() } catch {}
            controller.close()
          }
        }
      })

      return new Response(sse, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-store',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
        }
      })
  }

  console.warn('[ai/write] no usable stream found on streamResp; returning 204')
  return new Response(null, { status: 204 })
})
