import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'

export type ApiMeta = {
  page?: number
  limit?: number
  total?: number
  totalPages?: number
}

export type AuthenticatedUser = {
  id: number
  name: string
  email: string
  role: string
  slug: string
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
  return { page, limit, total, totalPages: Math.ceil(total / limit) }
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

export async function verifyApiKey(rawKey: string): Promise<{ valid: boolean; user?: AuthenticatedUser }> {
  const hashBytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey))
  const hash = hex(new Uint8Array(hashBytes))

  const rows = await db
    .select()
    .from(schema.api_keys)
    .innerJoin(schema.users, eq(schema.users.id, schema.api_keys.user_id))
    .where(eq(schema.api_keys.hash, hash))
    .limit(1)

  if (!rows.length) return { valid: false }

  const row = rows[0] as any
  if (row.api_keys.revoked_at) return { valid: false }

  await db
    .update(schema.api_keys)
    .set({ last_used_at: new Date().toISOString() })
    .where(eq(schema.api_keys.id, row.api_keys.id))
    .run()

  return {
    valid: true,
    user: {
      id: row.users.id,
      name: row.users.name,
      email: row.users.email,
      role: row.users.role,
      slug: row.users.slug,
    },
  }
}

export async function requireApiKey(event: any): Promise<AuthenticatedUser> {
  const header = getRequestHeader(event, 'authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' }),
    })
  }

  const rawKey = header.slice(7)
  const result = await verifyApiKey(rawKey)
  if (!result.valid || !result.user) {
    throw createError({
      statusCode: 401,
      message: JSON.stringify({ code: 'UNAUTHORIZED', message: 'Invalid or revoked API key' }),
    })
  }

  return result.user
}

export async function requireWriteAccess(event: any): Promise<AuthenticatedUser> {
  try {
    const session = await requireUserSession(event)
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      slug: session.user.slug,
    }
  } catch {
    return requireApiKey(event)
  }
}
