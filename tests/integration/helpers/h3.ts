import { createEvent, getQuery, readBody } from 'h3'
import type { EventHandler } from 'h3'
import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'

function createMockReqRes(options: {
  path?: string
  method?: string
  headers?: Record<string, string>
  body?: string
}) {
  const url = options.path || '/'
  const socket = new Socket()

  const req = new IncomingMessage(socket)
  req.url = url
  req.method = options.method || 'GET'
  req.headers = { 'content-type': 'application/json', ...options.headers }

  const res = new ServerResponse(req)

  if (options.body) {
    req.push(options.body)
    req.push(null)
  }

  return { req, res }
}

export function createMockEvent(options: {
  path?: string
  query?: Record<string, string>
  method?: string
  body?: any
  headers?: Record<string, string>
} = {}) {
  const query = options.query ? new URLSearchParams(options.query).toString() : ''
  const path = query ? `${options.path || '/'}?${query}` : (options.path || '/')
  const bodyStr = options.body !== undefined ? JSON.stringify(options.body) : undefined

  const { req, res } = createMockReqRes({
    path,
    method: options.method || 'GET',
    headers: options.headers,
    body: bodyStr,
  })

  return createEvent(req, res)
}

export async function callHandler(handler: EventHandler, options?: Parameters<typeof createMockEvent>[0]) {
  const event = createMockEvent(options)
  return handler(event)
}
