import type {
  Post, Tag, Author, SiteSettings, BlogStats, PostStatus, PostLink,
  ApiKey, ApiKeyCreated,
  PaginatedResponse, SingleResponse, QueryParams,
  CreatePostPayload, UpdatePostPayload,
  CreateTagPayload, UpdateTagPayload,
} from './types'

export type { PostStatus, PostLink, Post, Tag, Author, SiteSettings, BlogStats, ApiKey, ApiKeyCreated, QueryParams, CreatePostPayload, UpdatePostPayload, CreateTagPayload, UpdateTagPayload }

export class EneideClient {
  private baseUrl: string
  private apiKey?: string

  constructor(config: { baseUrl: string; apiKey?: string }) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '')
    this.apiKey = config.apiKey
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/v1${path}`
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(options?.headers as Record<string, string>),
    }

    if (this.apiKey) {
      headers['authorization'] = `Bearer ${this.apiKey}`
    }

    const res = await fetch(url, { ...options, headers })

    const body = await res.json()

    if (!res.ok) {
      const err = body as { error?: { code?: string; message?: string } }
      throw new EneideApiError(
        err?.error?.message ?? `HTTP ${res.status}`,
        err?.error?.code ?? 'UNKNOWN_ERROR',
        res.status,
      )
    }

    return body as T
  }

  private buildQuery(params?: QueryParams): string {
    if (!params) return ''
    const entries = Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    if (!entries.length) return ''
    return '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString()
  }

  async getPosts(params?: QueryParams): Promise<PaginatedResponse<Post>> {
    return this.request<PaginatedResponse<Post>>(`/posts${this.buildQuery(params)}`)
  }

  async getPost(slug: string): Promise<SingleResponse<Post>> {
    return this.request<SingleResponse<Post>>(`/posts/${encodeURIComponent(slug)}`)
  }

  async getTags(params?: { category?: string; search?: string }): Promise<SingleResponse<Tag[]>> {
    return this.request<SingleResponse<Tag[]>>(`/tags${this.buildQuery(params as QueryParams)}`)
  }

  async getAuthors(): Promise<SingleResponse<Author[]>> {
    return this.request<SingleResponse<Author[]>>('/authors')
  }

  async getAuthor(id: number): Promise<SingleResponse<Author>> {
    return this.request<SingleResponse<Author>>(`/authors/${id}`)
  }

  async getStats(): Promise<SingleResponse<BlogStats>> {
    return this.request<SingleResponse<BlogStats>>('/stats')
  }

  async search(q: string, params?: { page?: number; limit?: number; language?: string }): Promise<PaginatedResponse<Post>> {
    return this.request<PaginatedResponse<Post>>(`/search${this.buildQuery({ q, ...params } as QueryParams)}`)
  }

  async getSiteSettings(): Promise<SingleResponse<SiteSettings>> {
    return this.request<SingleResponse<SiteSettings>>('/site-settings')
  }

  async listApiKeys(): Promise<SingleResponse<ApiKey[]>> {
    return this.request<SingleResponse<ApiKey[]>>('/api-keys')
  }

  async createApiKey(name: string): Promise<SingleResponse<ApiKeyCreated>> {
    return this.request<SingleResponse<ApiKeyCreated>>('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  async revokeApiKey(id: number): Promise<SingleResponse<{ id: number; revoked: boolean }>> {
    return this.request<SingleResponse<{ id: number; revoked: boolean }>>(`/api-keys/${id}`, {
      method: 'DELETE',
    })
  }

  async createPost(payload: CreatePostPayload): Promise<SingleResponse<Post>> {
    return this.request<SingleResponse<Post>>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updatePost(identifier: string | number, payload: UpdatePostPayload): Promise<SingleResponse<Post>> {
    return this.request<SingleResponse<Post>>(`/posts/${identifier}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async deletePost(identifier: string | number): Promise<SingleResponse<{ id: number; deleted: boolean }>> {
    return this.request<SingleResponse<{ id: number; deleted: boolean }>>(`/posts/${identifier}`, {
      method: 'DELETE',
    })
  }

  async createTag(payload: CreateTagPayload): Promise<SingleResponse<Tag>> {
    return this.request<SingleResponse<Tag>>('/tags', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async updateTag(id: number, payload: UpdateTagPayload): Promise<SingleResponse<Tag>> {
    return this.request<SingleResponse<Tag>>(`/tags/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async deleteTag(id: number): Promise<SingleResponse<{ id: number; deleted: boolean }>> {
    return this.request<SingleResponse<{ id: number; deleted: boolean }>>(`/tags/${id}`, {
      method: 'DELETE',
    })
  }
}

export class EneideApiError extends Error {
  code: string
  status: number

  constructor(message: string, code: string, status: number) {
    super(message)
    this.name = 'EneideApiError'
    this.code = code
    this.status = status
  }
}
