import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export type ApiMeta = {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export type ApiError = {
  code: string
  message: string
}

export function apiSuccess<T>(event: any, data: T, meta?: ApiMeta) {
  setResponseStatus(event, 200)
  setResponseHeader(event, 'content-type', 'application/json')
  return { data, meta }
}

export function apiCreated<T>(event: any, data: T) {
  setResponseStatus(event, 201)
  setResponseHeader(event, 'content-type', 'application/json')
  return { data }
}

export function apiError(event: any, statusCode: number, code: string, message: string) {
  setResponseStatus(event, statusCode)
  setResponseHeader(event, 'content-type', 'application/json')
  return { error: { code, message } }
}

export function parsePagination(query: any, maxLimit = 50) {
  let page = Number.parseInt(query.page as string || '1', 10)
  let limit = Number.parseInt(query.limit as string || '25', 10)
  if (!Number.isFinite(page) || page < 1) page = 1
  if (!Number.isFinite(limit) || limit < 1) limit = 25
  if (limit > maxLimit) limit = maxLimit
  const offset = (page - 1) * limit
  return { page, limit, offset }
}

export function buildMeta(page: number, limit: number, total: number): ApiMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  }
}

const API_KEY_PREFIX = 'ene_'

function hex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function generateApiKey(): Promise<{ raw: string; hash: string; prefix: string }> {
  const rawBytes = new Uint8Array(32)
  crypto.getRandomValues(rawBytes)
  const raw = hex(rawBytes)
  const fullKey = `${API_KEY_PREFIX}${raw}`
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fullKey))
  const hash = hex(new Uint8Array(hashBytes))
  const prefix = fullKey.slice(0, 12)
  return { raw: fullKey, hash, prefix }
}

export async function verifyApiKey(rawKey: string): Promise<{ valid: boolean; keyId?: number; name?: string }> {
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hash = hex(new Uint8Array(hashBytes))
  const rows = await db
    .select()
    .from(schema.api_keys)
    .where(eq(schema.api_keys.hash, hash))
    .limit(1)

  if (!rows.length) return { valid: false }

  const key = rows[0]
  if (key.revoked_at) return { valid: false }

  await db
    .update(schema.api_keys)
    .set({ last_used_at: new Date().toISOString() })
    .where(eq(schema.api_keys.id, key.id))
    .run()

  return { valid: true, keyId: key.id, name: key.name }
}

export async function requireApiKey(event: any) {
  const header = getRequestHeader(event, 'authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }),
    })
  }

  const rawKey = header.slice(7)
  const result = await verifyApiKey(rawKey)
  if (!result.valid) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Invalid or revoked API key' }),
    })
  }

  return result
}
