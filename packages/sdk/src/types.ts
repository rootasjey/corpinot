export type PostStatus = 'draft' | 'published' | 'archived'

export type PostLink = {
  href: string
  name: string
}

export type Post = {
  article?: object
  blobPath?: string
  canEdit?: boolean
  createdAt: string
  description: string
  id: number
  image: {
    alt: string
    ext: string
    src: string
  }
  language: string
  links: PostLink[]
  metrics: {
    comments: number
    likes: number
    views: number
  }
  name: string
  publishedAt?: string
  slug: string
  status: PostStatus
  tags: Tag[]
  translationGroupId?: string
  updatedAt: string
  user?: {
    id?: number
    avatar?: string
    name?: string
    slug?: string
  }
}

export type Tag = {
  id: number
  name: string
  category: string
  description: string
  created_at: string
  updated_at: string
}

export type Author = {
  id: number
  name: string
  slug: string
  avatar: string
  biography: string
  job: string
  location: string
  socials: Record<string, string>[]
}

export type SiteSettings = Record<string, unknown>

export type BlogStats = {
  posts: number
  projects: number
  authorsTotal: number
  authorsWithPosts: number
}

export type ApiKey = {
  id: number
  name: string
  prefix: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
}

export type ApiKeyCreated = {
  name: string
  prefix: string
  key: string
  message: string
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type SingleResponse<T> = {
  data: T
  meta?: undefined
}

export type ApiError = {
  error: {
    code: string
    message: string
  }
}

export type QueryParams = {
  page?: number
  limit?: number
  search?: string
  tag?: string
  author?: string
  exclude?: string
  language?: string
  q?: string
  category?: string
}
