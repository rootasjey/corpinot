export const EXCLUDED_TAGS = ['top pinned', 'featured post', 'featured project'] as const
export type ExcludedTag = (typeof EXCLUDED_TAGS)[number]
